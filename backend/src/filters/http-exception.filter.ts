import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let error = 'Internal Server Error';
    let fieldErrors: Record<string, string[]> | undefined;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exResponse = exception.getResponse();

      if (typeof exResponse === 'string') {
        message = exResponse;
      } else if (typeof exResponse === 'object') {
        const resp = exResponse as any;
        message = resp.message || exception.message;
        error = resp.error || error;

        // Handle validation errors from class-validator
        if (Array.isArray(resp.message)) {
          fieldErrors = {};
          for (const msg of resp.message) {
            if (typeof msg === 'string') {
              if (!fieldErrors['general']) fieldErrors['general'] = [];
              fieldErrors['general'].push(msg);
            } else if (msg.property && msg.constraints) {
              fieldErrors[msg.property] = Object.values(msg.constraints);
            }
          }
          message = 'Validation failed';
        }
      }
    } else if (exception instanceof Error) {
      this.logger.error(`Unhandled error: ${exception.message}`, exception.stack);
    }

    response.status(status).json({
      statusCode: status,
      message,
      error,
      fieldErrors,
      timestamp: new Date().toISOString(),
    });
  }
}
