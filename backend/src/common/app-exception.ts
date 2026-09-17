import { HttpException, HttpStatus } from '@nestjs/common';

/** An error with a stable `code` the frontend can switch on. */
export class AppException extends HttpException {
  constructor(
    status: HttpStatus,
    readonly code: string,
    message: string,
  ) {
    super({ code, message }, status);
  }
}
