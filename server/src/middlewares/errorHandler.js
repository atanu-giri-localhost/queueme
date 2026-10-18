/**
 * Centralized error handler middleware for Express
 */
export function errorHandler(err, req, res, _next) {
  const statusCode = err.status || err.statusCode || 500;

  // Handle Prisma-specific known errors
  if (err.code === 'P2002') {
    return res.status(409).json({
      success: false,
      error: 'A record with that unique constraint already exists.',
      details: err.meta,
    });
  }

  if (err.code === 'P2025') {
    return res.status(404).json({
      success: false,
      error: 'Record not found.',
      details: err.meta,
    });
  }

  // Handle syntax/JSON parse error
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({
      success: false,
      error: 'Malformed JSON payload in request body.',
    });
  }

  // Log server errors for observability
  if (statusCode >= 500) {
    console.error(`[ServerError] ${req.method} ${req.url}:`, err);
  }

  res.status(statusCode).json({
    success: false,
    error: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
}
