import { Router } from 'express';
import authMiddleware from '../middleware/authMiddleware.js';
import { User } from '../models/index.js';

const router = Router();

// GET /api/subscription — returns the user's current tier + available plans
router.get('/', authMiddleware, async (req, res, next) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: ['id', 'subscription_tier', 'subscription_billing', 'subscription_started_at', 'subscription_expires_at', 'documents_generated_this_month'],
    });
    if (!user) return next({ statusCode: 404, message: 'User not found' });

    return res.json({
      success: true,
      data: {
        subscription_tier: user.subscription_tier || 'business',
        subscription_billing: user.subscription_billing || 'monthly',
        subscription_started_at: user.subscription_started_at,
        subscription_expires_at: user.subscription_expires_at,
        documents_generated_this_month: user.documents_generated_this_month || 0,
        tiers: [
          {
            id: 'free',
            label: 'Free',
            price_monthly: 0,
            price_yearly: 0,
            features: ['Browse Lawyers', 'Women\'s Help Resources', 'Compliance Dashboard', '1 Document/month'],
          },
          {
            id: 'starter',
            label: 'Starter',
            price_monthly: 499,
            price_yearly: 4199,
            features: ['AI Legal Chat', 'Contract Audit', 'Name Generator', '10 Documents/month', 'Basic Templates', 'Browse & Book Lawyers'],
          },
          {
            id: 'professional',
            label: 'Professional',
            price_monthly: 1499,
            price_yearly: 12499,
            features: ['Everything in Starter', 'Unlimited Documents', 'All Templates', 'Doc Review & eSign', 'RTI Assistant', 'Legal Notice Tracking', 'Law Mapper'],
          },
          {
            id: 'business',
            label: 'Business',
            price_monthly: 2499,
            price_yearly: 24999,
            features: ['Everything in Professional', 'Business Registration', 'Trademark Filing', 'AI Logo Maker', 'Registered Agent', 'eCourts Tracking', 'Priority Support'],
          },
        ],
      },
    });
  } catch (err) {
    return next(err);
  }
});

// POST /api/subscription/upgrade — simulate upgrade (MVP demo)
router.post('/upgrade', authMiddleware, async (req, res, next) => {
  try {
    const { tier, billing } = req.body;
    const validTiers = ['free', 'starter', 'professional', 'business'];
    if (!tier || !validTiers.includes(tier)) {
      return next({ statusCode: 400, message: 'Invalid tier. Must be one of: free, starter, professional, business' });
    }

    // Lawyers are commission-based, no subscription needed
    if (req.user.role === 'lawyer') {
      return next({ statusCode: 400, message: 'Lawyers use commission-based pricing, not subscriptions' });
    }

    const billingCycle = billing === 'yearly' ? 'yearly' : 'monthly';
    const now = new Date();
    const expiresAt = new Date(now);
    if (billingCycle === 'yearly') {
      expiresAt.setFullYear(expiresAt.getFullYear() + 1);
    } else {
      expiresAt.setMonth(expiresAt.getMonth() + 1);
    }

    await User.update({
      subscription_tier: tier,
      subscription_billing: billingCycle,
      subscription_started_at: now,
      subscription_expires_at: tier === 'free' ? null : expiresAt,
      documents_generated_this_month: 0,
    }, { where: { id: req.user.id } });

    return res.json({
      success: true,
      data: {
        subscription_tier: tier,
        subscription_billing: billingCycle,
        subscription_expires_at: tier === 'free' ? null : expiresAt,
        message: `Upgraded to ${tier} tier successfully`,
      },
    });
  } catch (err) {
    return next(err);
  }
});

export default router;
