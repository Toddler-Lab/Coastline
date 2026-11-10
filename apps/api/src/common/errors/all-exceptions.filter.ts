import {
  type ArgumentsHost,
  Catch,
  type ExceptionFilter,
  HttpException,
  Logger,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { ErrorCode, type ApiErrorBody } from '@coastline/api-contracts';
import { defaultCodeForStatus } from './api-errors';

interface ExceptionPayload {
  code?: unknown;
  message?: unknown;
  details?: unknown;
}

/** Turns any thrown value into the single public error envelope. */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const http = host.switchToHttp();
    const response = http.getResponse<Response>();
    const request = http.getRequest<Request>();

    let status = 500;
    let code: ErrorCode = ErrorCode.INTERNAL_ERROR;
    let message = 'Something went wrong. Try again.';
    let details: unknown = null;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      code = defaultCodeForStatus(status);
      const payload = exception.getResponse();

      if (typeof payload === 'string') {
        message = payload;
      } else if (payload && typeof payload === 'object') {
        const value = payload as ExceptionPayload;

        if (Array.isArray(value.message)) {
          code = ErrorCode.VALIDATION_ERROR;
          message = 'The request could not be validated.';
          details = value.message;
        } else if (typeof value.message === 'string') {
          message = value.message;
        }

        if (typeof value.code === 'string') {
          code = value.code as ErrorCode;
        }
        if (value.details !== undefined) {
          details = value.details;
        }
      }
    } else {
      this.logger.error(
        `Unhandled error on ${request.method} ${request.originalUrl}`,
        exception instanceof Error ? exception.stack : String(exception),
      );
    }

    const body: ApiErrorBody = {
      error: {
        code,
        message,
        details,
        requestId: request.requestId ?? '',
      },
    };

    response.status(status).json(body);
  }
}
