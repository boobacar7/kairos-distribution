import {
  Catch,
  HttpException,
  HttpStatus,
  type ArgumentsHost,
  type ExceptionFilter,
} from '@nestjs/common';
import { ZodError } from 'zod';
import { InventoryInconsistencyError } from '@kairos/database';

import { CatalogInconsistentError } from '../catalog/catalog.errors.js';
import {
  CheckoutConflictError,
  GuestClaimRejectedError,
  IdempotencyConflictError,
  PaidWithoutStockError,
} from '../checkout/checkout.errors.js';

export type ApiErrorBody = {
  statusCode: number;
  code: string;
  message: string;
  issues?: Array<{ code: string; variantId?: string | undefined; message: string }>;
  incident?: string;
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

    if (exception instanceof CheckoutConflictError) {
      response.status(HttpStatus.CONFLICT).json({
        statusCode: HttpStatus.CONFLICT,
        code:
          exception instanceof Error && exception.name === 'DeliveryUnavailableError'
            ? 'DELIVERY_UNAVAILABLE'
            : 'CHECKOUT_CONFLICT',
        message: exception.message,
        issues: exception.issues,
      });
      return;
    }

    if (exception instanceof IdempotencyConflictError) {
      response.status(HttpStatus.CONFLICT).json({
        statusCode: HttpStatus.CONFLICT,
        code: exception.code,
        message:
          exception.code === 'IDEMPOTENCY_IN_PROGRESS'
            ? 'Requête déjà en cours.'
            : 'Clé d’idempotence réutilisée avec un autre contenu.',
      });
      return;
    }

    if (exception instanceof GuestClaimRejectedError) {
      response.status(HttpStatus.BAD_REQUEST).json({
        statusCode: HttpStatus.BAD_REQUEST,
        code: 'CLAIM_FAILED',
        message: 'Impossible de rattacher cette commande.',
      });
      return;
    }

    if (exception instanceof PaidWithoutStockError) {
      response.status(HttpStatus.CONFLICT).json({
        statusCode: HttpStatus.CONFLICT,
        code: 'PAID_WITHOUT_STOCK',
        message: 'Paiement enregistré sans stock — remboursement requis.',
        incident: 'payments.paid_without_stock',
      });
      return;
    }

    if (
      exception instanceof CatalogInconsistentError ||
      exception instanceof InventoryInconsistencyError
    ) {
      response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        code: 'INVENTORY_INCONSISTENT',
        message: 'Données de stock incohérentes.',
      });
      return;
    }

    if (exception instanceof Error && 'code' in exception && typeof exception.code === 'string') {
      if (exception.code === 'ORDER_NOT_FOUND' || exception.code === 'CART_NOT_FOUND') {
        response.status(HttpStatus.NOT_FOUND).json({
          statusCode: HttpStatus.NOT_FOUND,
          code: 'NOT_FOUND',
          message: 'Introuvable.',
        });
        return;
      }
      if (exception.code === 'ORDER_NOT_PAYABLE' || exception.code === 'PROVIDER_INACTIVE') {
        response.status(HttpStatus.CONFLICT).json({
          statusCode: HttpStatus.CONFLICT,
          code: exception.code,
          message: 'Paiement impossible.',
        });
        return;
      }
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
