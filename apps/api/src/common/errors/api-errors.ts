import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  HttpException,
  HttpStatus,
  NotFoundException,
  UnauthorizedException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { ErrorCode, PAYMENT_FAILED_MESSAGE } from '@coastline/api-contracts';

/** Throw helpers that keep the global response shape consistent. */
export function unauthenticated(message = 'Sign in to continue.'): HttpException {
  return new UnauthorizedException({ code: ErrorCode.UNAUTHENTICATED, message });
}

export function forbidden(message = 'You do not have access to this action.'): HttpException {
  return new ForbiddenException({ code: ErrorCode.FORBIDDEN, message });
}

export function notFound(message = 'Not found.'): HttpException {
  return new NotFoundException({ code: ErrorCode.NOT_FOUND, message });
}

export function validation(
  message = 'The request could not be validated.',
  details?: unknown,
): HttpException {
  return new BadRequestException({ code: ErrorCode.VALIDATION_ERROR, message, details });
}

export function unprocessable(message: string, details?: unknown): HttpException {
  return new UnprocessableEntityException({
    code: ErrorCode.UNPROCESSABLE_ENTITY,
    message,
    details,
  });
}

/** HTTP 422 `PAYMENT_FAILED`: the provider declined; the caller's transaction rolls back. */
export function paymentFailed(message: string = PAYMENT_FAILED_MESSAGE): HttpException {
  return new UnprocessableEntityException({ code: ErrorCode.PAYMENT_FAILED, message });
}

export function conflict(message: string, details?: unknown): HttpException {
  return new ConflictException({ code: ErrorCode.CONFLICT, message, details });
}

const STATUS_CODES: Record<number, ErrorCode> = {
  [HttpStatus.BAD_REQUEST]: ErrorCode.VALIDATION_ERROR,
  [HttpStatus.UNAUTHORIZED]: ErrorCode.UNAUTHENTICATED,
  [HttpStatus.FORBIDDEN]: ErrorCode.FORBIDDEN,
  [HttpStatus.NOT_FOUND]: ErrorCode.NOT_FOUND,
  [HttpStatus.CONFLICT]: ErrorCode.CONFLICT,
  [HttpStatus.UNPROCESSABLE_ENTITY]: ErrorCode.UNPROCESSABLE_ENTITY,
  [HttpStatus.INTERNAL_SERVER_ERROR]: ErrorCode.INTERNAL_ERROR,
};

export function defaultCodeForStatus(status: number): ErrorCode {
  return STATUS_CODES[status] ?? ErrorCode.INTERNAL_ERROR;
}
