import express from 'express';
import cors from 'cors';
import itemsRouter from './routes/items.js';
import { errorHandler } from './middlewares/errorHandler.js';

export function createApp() {
  const app = express();

  // CORS configuration
  const allowedOrigin = process.env.CORS_ORIGIN || 'http://localhost:5173';
  app.use(
    cors({
      origin: allowedOrigin === '*' ? '*' : [allowedOrigin, 'http://localhost:5173'],
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    })
  );

  // Body parsing
  app.use(express.json());

  // Health check endpoint
  app.get('/api/health', (_req, res) => {
    res.json({
      status: 'ok',
      service: 'queueme-api',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    });
  });

  // Items API routes
  app.use('/api/items', itemsRouter);

  // 404 handler for unknown routes
  app.use((req, res) => {
    res.status(404).json({
      success: false,
      error: `Route ${req.method} ${req.originalUrl} not found`,
    });
  });

  // Centralized error handling
  app.use(errorHandler);

  return app;
}

export const app = createApp();
export default app;
