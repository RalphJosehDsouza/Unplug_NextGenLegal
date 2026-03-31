import { User } from '../models/index.js';

const TIER_RANK = { free: 0, starter: 1, professional: 2, business: 3 };

export function requireTier(minimumTier) {
  return async (req, res, next) => {
    try {
      // Lawyers bypass all tier checks (commission-based, not subscription)
      if (req.user?.role === 'lawyer') return next();

      const user = await User.findByPk(req.user?.id, { attributes: ['subscription_tier'] });
      if (!user) return next({ statusCode: 401, message: 'Unauthorized' });

      const userRank = TIER_RANK[user.subscription_tier] ?? 0;
      const requiredRank = TIER_RANK[minimumTier] ?? 0;

      if (userRank >= requiredRank) return next();

      return res.status(403).json({
        success: false,
        error: `This feature requires the ${minimumTier.charAt(0).toUpperCase() + minimumTier.slice(1)} plan or higher.`,
        upgrade_required: true,
        minimum_tier: minimumTier,
        current_tier: user.subscription_tier,
      });
    } catch (err) {
      return next(err);
    }
  };
}
