import cors from 'cors';

/**
 * CORS middleware configuration
 * Allows cross-origin requests during development
 */
export const corsMiddleware = cors({
  origin: process.env['CORS_ORIGIN'] ?? '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
});
