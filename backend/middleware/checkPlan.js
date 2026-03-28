export default function checkPlan(allowedPlans = []) {
  const set = new Set(allowedPlans);
  return function planGuard(req, res, next) {
    const plan = req.user?.plan || 'freemium';
    if (!set.has(plan)) {
      return next({ statusCode: 403, message: 'Upgrade required for this action' });
    }
    return next();
  };
}

