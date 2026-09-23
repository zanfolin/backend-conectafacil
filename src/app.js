import express from 'express';
import { env } from './config/env.js';
import { errorHandler } from './middlewares/errorHandler.js';
import { routes } from './routes/index.js';

export function createApp() {
  const app = express();

  // Body parsers
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Static files for uploads
  app.use('/uploads', express.static(env.UPLOAD_DIR));

  // Health check
  app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // API routes
  app.use('/api', routes);

  // 404 handler
  app.use((req, res) => {
    res.status(404).json({
      error: 'Not Found',
      message: `Route ${req.method} ${req.path} not found`,
    });
  });

  // Error handler (must be last)
  app.use(errorHandler);

  return app;
}