import { Request, Response, NextFunction } from 'express';

/**
 * Global error handling middleware
 * Must be registered after all routes
 */
export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  console.error('Error:', err);

  const isDevelopment = process.env['NODE_ENV'] !== 'production';

  res.status(500).json({
    error: err.message,
    ...(isDevelopment && { stack: err.stack }),
  });
}

/**
 * 404 handler for unknown routes
 */
export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({
    error: `Route not found: ${req.method} ${req.path}`,
  });
}
