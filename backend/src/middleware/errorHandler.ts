import { Request, Response, NextFunction } from 'express';

/**
 * Error Handling Middleware
 * Catches and formats all errors
 */

export class AppError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public isOperational = true
  ) {
    super(message);
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export const errorHandler = (err: Error | AppError, _req: Request, res: Response, _next: NextFunction) => {
  // Default error values
  let statusCode = 500;
  let message = 'Internal Server Error';

  // Handle custom AppError
  if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
  } else if (err instanceof SyntaxError) {
    statusCode = 400;
    message = 'Invalid JSON';
  } else if (err.message) {
    message = err.message;
  }

  // Log error
  console.error(`[${new Date().toISOString()}] Error: ${message}`, err);

  // Send error response
  res.status(statusCode).json({
    success: false,
    error: message,
    timestamp: new Date().toISOString(),
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

export const notFoundHandler = (_req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: 'Route not found',
    timestamp: new Date().toISOString(),
  });
};
