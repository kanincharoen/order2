export interface LoginDto {
  username: string; // 3-50 chars
  password: string; // 8-128 chars
}

export interface RefreshTokenDto {
  refreshToken: string;
}

export interface AuthResponseDto {
  accessToken: string;
  refreshToken: string;
}

export interface TokenRefreshResponseDto {
  accessToken: string;
}
