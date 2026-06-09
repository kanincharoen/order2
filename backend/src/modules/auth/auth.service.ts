import {
  Injectable,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan, MoreThan } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { StaffUser } from '../../entities/staff-user.entity';
import { Session } from '../../entities/session.entity';

const BCRYPT_ROUNDS = 12;
const MAX_FAILED_ATTEMPTS = 5;
const LOCK_DURATION_MINUTES = 15;
const MAX_CONCURRENT_SESSIONS = 3;

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(StaffUser)
    private readonly userRepository: Repository<StaffUser>,
    @InjectRepository(Session)
    private readonly sessionRepository: Repository<Session>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async validateCredentials(
    username: string,
    password: string,
  ): Promise<StaffUser> {
    const user = await this.userRepository.findOne({ where: { username } });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Check account lock
    if (await this.isAccountLocked(user)) {
      throw new ForbiddenException(
        'Account is temporarily locked. Please try again later.',
      );
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

    if (!isPasswordValid) {
      await this.recordFailedAttempt(user);
      throw new UnauthorizedException('Invalid credentials');
    }

    // Reset failed attempts on successful login
    await this.resetFailedAttempts(user);
    return user;
  }

  async generateTokens(
    user: StaffUser,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    // Enforce max concurrent sessions
    await this.enforceSessionLimit(user.id);

    const payload = { sub: user.id, username: user.username };

    const accessToken = this.jwtService.sign(payload);

    const refreshToken = crypto.randomBytes(32).toString('hex');
    const refreshExpiration = this.configService.get<string>(
      'JWT_REFRESH_EXPIRATION',
      '7d',
    );
    const expiresAt = this.calculateExpiration(refreshExpiration);

    // Store session
    const tokenHash = await bcrypt.hash(refreshToken, BCRYPT_ROUNDS);
    const session = this.sessionRepository.create({
      userId: user.id,
      tokenHash,
      expiresAt,
    });
    await this.sessionRepository.save(session);

    return { accessToken, refreshToken };
  }

  async refreshAccessToken(refreshToken: string): Promise<{ accessToken: string }> {
    // Find all non-expired sessions
    const sessions = await this.sessionRepository.find({
      where: { expiresAt: MoreThan(new Date()) },
      relations: ['user'],
    });

    for (const session of sessions) {
      const isMatch = await bcrypt.compare(refreshToken, session.tokenHash);
      if (isMatch) {
        const payload = {
          sub: session.userId,
          username: session.user.username,
        };
        const accessToken = this.jwtService.sign(payload);
        return { accessToken };
      }
    }

    throw new UnauthorizedException('Invalid refresh token');
  }

  async invalidateSession(refreshToken: string): Promise<void> {
    const sessions = await this.sessionRepository.find({
      where: { expiresAt: MoreThan(new Date()) },
    });

    for (const session of sessions) {
      const isMatch = await bcrypt.compare(refreshToken, session.tokenHash);
      if (isMatch) {
        await this.sessionRepository.remove(session);
        return;
      }
    }
  }

  async getActiveSessionCount(userId: string): Promise<number> {
    return this.sessionRepository.count({
      where: {
        userId,
        expiresAt: MoreThan(new Date()),
      },
    });
  }

  private async isAccountLocked(user: StaffUser): Promise<boolean> {
    if (!user.lockedUntil) return false;
    if (user.lockedUntil > new Date()) return true;

    // Lock expired, reset
    user.lockedUntil = null;
    user.failedLoginAttempts = 0;
    await this.userRepository.save(user);
    return false;
  }

  private async recordFailedAttempt(user: StaffUser): Promise<void> {
    user.failedLoginAttempts += 1;

    if (user.failedLoginAttempts >= MAX_FAILED_ATTEMPTS) {
      const lockUntil = new Date();
      lockUntil.setMinutes(lockUntil.getMinutes() + LOCK_DURATION_MINUTES);
      user.lockedUntil = lockUntil;
    }

    await this.userRepository.save(user);
  }

  private async resetFailedAttempts(user: StaffUser): Promise<void> {
    if (user.failedLoginAttempts > 0 || user.lockedUntil) {
      user.failedLoginAttempts = 0;
      user.lockedUntil = null;
      await this.userRepository.save(user);
    }
  }

  private async enforceSessionLimit(userId: string): Promise<void> {
    const activeSessions = await this.sessionRepository.find({
      where: {
        userId,
        expiresAt: MoreThan(new Date()),
      },
      order: { createdAt: 'ASC' },
    });

    // Remove oldest sessions if at limit
    if (activeSessions.length >= MAX_CONCURRENT_SESSIONS) {
      const sessionsToRemove = activeSessions.slice(
        0,
        activeSessions.length - MAX_CONCURRENT_SESSIONS + 1,
      );
      await this.sessionRepository.remove(sessionsToRemove);
    }
  }

  private calculateExpiration(duration: string): Date {
    const now = new Date();
    const match = duration.match(/^(\d+)([smhd])$/);
    if (!match) {
      now.setDate(now.getDate() + 7); // default 7 days
      return now;
    }

    const value = parseInt(match[1], 10);
    const unit = match[2];

    switch (unit) {
      case 's':
        now.setSeconds(now.getSeconds() + value);
        break;
      case 'm':
        now.setMinutes(now.getMinutes() + value);
        break;
      case 'h':
        now.setHours(now.getHours() + value);
        break;
      case 'd':
        now.setDate(now.getDate() + value);
        break;
    }
    return now;
  }
}
