import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Response } from 'express';
import { AppException } from '../app-exception';

/** Every error leaves the API as `{ statusCode, code, message, details? }`. */
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse<Response>();

    if (exception instanceof AppException) {
      response.status(exception.getStatus()).json({
        statusCode: exception.getStatus(),
        code: exception.code,
        message: exception.message,
      });
      return;
    }

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const body = exception.getResponse() as { message?: string | string[] };
      const details = Array.isArray(body?.message) ? body.message : undefined;

      response.status(status).json({
        statusCode: status,
        code: status === HttpStatus.BAD_REQUEST ? 'VALIDATION_ERROR' : HttpStatus[status],
        message: details ? 'Some fields are invalid.' : exception.message,
        ...(details ? { details } : {}),
      });
      return;
    }

    this.logger.error(exception);
    response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      code: 'INTERNAL_ERROR',
      message: 'Something went wrong.',
    });
  }
}
