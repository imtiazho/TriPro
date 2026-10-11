import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';
import { env } from '../config/env';

export interface AppError extends Error {
  statusCode?: number;
  code?: string;
  details?: any;
}

export function errorHandler(
  err: AppError,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  const statusCode = err.statusCode || (err.name === 'ValidationError' ? 400 : 500);
  const code = err.code || 'INTERNAL_SERVER_ERROR';

  logger.error(
    {
      requestId: req.id,
      method: req.method,
      path: req.path,
      statusCode,
      code,
      error: err.message,
      stack: env.NODE_ENV !== 'production' ? err.stack : undefined,
    },
    'Unhandled request error'
  );

  // Mongoose duplicate key error
  if ((err as any).code === 11000) {
    const field = Object.keys((err as any).keyPattern || {})[0] || 'field';
    res.status(409).json({
      success: false,
      error: {
        code: 'DUPLICATE_KEY',
        message: `A record with this ${field} already exists.`,
      },
    });
    return;
  }

  // Mongoose CastError (invalid ObjectId)
  if (err.name === 'CastError') {
    res.status(400).json({
      success: false,
      error: {
        code: 'INVALID_IDENTIFIER',
        message: 'Invalid resource ID provided.',
      },
    });
    return;
  }

  res.status(statusCode).json({
    success: false,
    error: {
      code,
      message:
        env.NODE_ENV === 'production' && statusCode === 500
          ? 'An internal error occurred. Please contact support.'
          : err.message,
      details: err.details,
    },
  });
}
