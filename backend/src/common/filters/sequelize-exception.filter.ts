import { ArgumentsHost, Catch, ExceptionFilter, HttpStatus, Logger } from '@nestjs/common';
import type { Response } from 'express';
import {
  BaseError,
  DatabaseError,
  ForeignKeyConstraintError,
  UniqueConstraintError,
  ValidationError,
} from 'sequelize';

/** Translates Sequelize/Postgres errors into proper HTTP responses. */
@Catch(BaseError)
export class SequelizeExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(SequelizeExceptionFilter.name);

  catch(exception: BaseError, host: ArgumentsHost) {
    const res = host.switchToHttp().getResponse<Response>();
    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Database error';

    if (exception instanceof UniqueConstraintError) {
      status = HttpStatus.CONFLICT;
      const fields = Object.keys(exception.fields ?? {});
      message = fields.length ? `Duplicate value for: ${fields.join(', ')}` : 'Duplicate record';
    } else if (exception instanceof ForeignKeyConstraintError) {
      status = HttpStatus.CONFLICT;
      message = 'Operation violates a relation with other records';
    } else if (exception instanceof ValidationError) {
      status = HttpStatus.BAD_REQUEST;
      message = exception.errors.map((e) => e.message).join(', ');
    } else if (exception instanceof DatabaseError && /check constraint/i.test(exception.message)) {
      status = HttpStatus.BAD_REQUEST;
      message = exception.message;
    } else {
      this.logger.error(exception.message, exception.stack);
    }

    res.status(status).json({ statusCode: status, message, error: exception.name });
  }
}
