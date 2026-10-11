import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import mongoose from 'mongoose';
import { env } from './config/env';
import { requestLogger } from './middleware/requestLogger';
import { standardRateLimiter } from './middleware/rateLimiter';
import { errorHandler } from './middleware/errorHandler';
import v1Routes from './routes/v1';

export const app = express();

// Security headers
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

// CORS Allowlist
const allowedOrigins = [env.CLIENT_ORIGIN, 'http://localhost:5173', 'http://127.0.0.1:5173'];
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. mobile apps, curl) or allowed origins
      if (!origin || allowedOrigins.includes(origin) || env.NODE_ENV === 'development') {
        callback(null, true);
      } else {
        callback(new Error('CORS policy: Not allowed by Access-Control-Allow-Origin'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-request-id', 'x-organization-id'],
  })
);

// Body Parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request tracing and logging
app.use(requestLogger);

// Global rate limiter
app.use(standardRateLimiter);

// Liveness & Readiness health checks
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
  });
});

app.get('/ready', (_req, res) => {
  const isDbReady = mongoose.connection.readyState === 1;
  if (isDbReady) {
    res.json({ status: 'ready', database: 'connected' });
  } else {
    res.status(503).json({ status: 'not_ready', database: 'disconnected' });
  }
});

// Mount API v1
app.use('/api/v1', v1Routes);

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'ROUTE_NOT_FOUND',
      message: `Endpoint ${req.method} ${req.originalUrl} not found`,
    },
  });
});

// Centralized Error Handler
app.use(errorHandler);
