import express from 'express';
import cors from 'cors';
import itemsRouter from './routes/items.js';
import { errorHandler } from './middlewares/errorHandler.js';

export function createApp() {
  const app = express();

  // CORS configuration
  const rawCorsOrigin = process.env.CORS_ORIGIN || 'http://localhost:5173';
  const allowedOrigins = rawCorsOrigin
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);

  app.use(
    cors({
      origin: (origin, callback) => {
        // Allow requests with no origin (e.g. mobile apps, curl, uptime monitors)
        if (!origin) return callback(null, true);
        if (rawCorsOrigin === '*' || allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
          return callback(null, true);
        }
        if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
          return callback(null, true);
        }
        return callback(new Error(`CORS policy blocked access from origin: ${origin}`));
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    })
  );

  // Body parsing
  app.use(express.json());

  // Root status endpoint for browser visits and uptime monitors
  app.get('/', (_req, res) => {
    res.json({
      service: 'queueme-api',
      status: 'running',
      health: '/api/health',
      docs: '/api/items',
    });
  });

  // Health check endpoints (supports both /api/health and /health)
  const handleHealth = (_req, res) => {
    res.json({
      status: 'ok',
      service: 'queueme-api',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    });
  };

  app.get('/api/health', handleHealth);
  app.get('/health', handleHealth);

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
