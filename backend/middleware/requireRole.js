export default function requireRole(requiredRole) {
  return function roleGuard(req, res, next) {
    if (!req.user) {
      return next({ statusCode: 401, message: 'Unauthorized' });
    }

    if (req.user.role !== requiredRole) {
      return next({ statusCode: 403, message: 'Forbidden' });
    }

    return next();
  };
}

