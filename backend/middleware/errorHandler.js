export default function errorHandler(err, req, res, next) {
  // eslint-disable-next-line no-unused-vars
  const _ = next;

  const statusCode = err?.statusCode || err?.status || 500;
  const isProd = process.env.NODE_ENV === 'production';

  // Never leak stack traces in production.
  const message =
    isProd && statusCode >= 500
      ? 'An unexpected error occurred'
      : err?.message || 'Internal Server Error';

  if (!isProd) {
    // eslint-disable-next-line no-console
    console.error('[errorHandler]', err);
  }

  res.status(statusCode).json({
    success: false,
    error: message,
  });
}

