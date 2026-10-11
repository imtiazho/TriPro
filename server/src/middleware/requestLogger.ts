import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../utils/logger';

export function requestLogger(req: Request, res: Response, next: NextFunction): void {
  const reqId = (req.headers['x-request-id'] as string) || uuidv4();
  req.id = reqId;
  res.setHeader('x-request-id', reqId);

  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    if (req.path !== '/health') {
      logger.info(
        {
          requestId: reqId,
          method: req.method,
          url: req.originalUrl,
          status: res.statusCode,
          durationMs: duration,
        },
        'HTTP request'
      );
    }
  });

  next();
}
