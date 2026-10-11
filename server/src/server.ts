import http from 'http';
import { app } from './app';
import { env } from './config/env';
import { connectDatabase, disconnectDatabase } from './config/database';
import { startComplianceWorker, stopComplianceWorker } from './workers/complianceWorker';
import { logger } from './utils/logger';

let server: http.Server;

async function bootstrap() {
  try {
    logger.info('Starting TriPro ECM SaaS Backend Server...');

    // Connect to MongoDB
    await connectDatabase();

    // Start background worker
    startComplianceWorker();

    server = http.createServer(app);

    server.listen(env.PORT, () => {
      logger.info(`🚀 TriPro ECM Server running at http://localhost:${env.PORT}`);
      logger.info(`Environment: ${env.NODE_ENV}`);
      logger.info(`Health check: http://localhost:${env.PORT}/health`);
    });

    // Graceful shutdown handling
    const shutdown = async (signal: string) => {
      logger.info({ signal }, 'Received termination signal. Starting graceful shutdown...');

      if (server) {
        server.close(async () => {
          logger.info('HTTP server closed');
          await stopComplianceWorker();
          await disconnectDatabase();
          logger.info('Shutdown complete. Exiting process.');
          process.exit(0);
        });
      }
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  } catch (error) {
    logger.fatal({ error: (error as Error).message }, 'Fatal error during server bootstrap');
    process.exit(1);
  }
}

bootstrap();
