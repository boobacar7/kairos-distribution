import {
  Catch,
  HttpException,
  HttpStatus,
  type ArgumentsHost,
  type ExceptionFilter,
} from '@nestjs/common';
import { ZodError } from 'zod';

import { CatalogInconsistentError } from '../catalog/catalog.errors.js';

export type ApiErrorBody = {
  statusCode: number;
  code: string;
  message: string;
};

@Catch()
export class ApiExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<{
      status: (code: number) => { json: (body: ApiErrorBody) => void };
    }>();

    if (exception instanceof ZodError) {
      response.status(HttpStatus.BAD_REQUEST).json({
        statusCode: HttpStatus.BAD_REQUEST,
        code: 'VALIDATION_ERROR',
        message: 'Requête invalide.',
      });
      return;
    }

    if (exception instanceof CatalogInconsistentError) {
      response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        code: 'CATALOG_INCONSISTENT',
        message: 'Données catalogue incohérentes.',
      });
      return;
    }

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const payload = exception.getResponse();
      const code =
        status === HttpStatus.NOT_FOUND
          ? 'NOT_FOUND'
          : status === HttpStatus.BAD_REQUEST
            ? 'VALIDATION_ERROR'
            : 'HTTP_ERROR';
      const message =
        status === HttpStatus.NOT_FOUND
          ? 'Introuvable.'
          : typeof payload === 'string'
            ? payload
            : 'Une erreur est survenue.';
      response.status(status).json({ statusCode: status, code, message });
      return;
    }

    console.error(exception);
    response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      code: 'INTERNAL_ERROR',
      message: 'Une erreur est survenue.',
    });
  }
}
