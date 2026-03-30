import { Router } from 'express';

import authMiddleware from '../middleware/authMiddleware.js';
import requireRole from '../middleware/requireRole.js';

import { withdrawPayout, getPayoutHistory, getPayoutStats, getEarningsBookings } from '../controllers/payoutController.js';

const router = Router();

router.post('/withdraw', authMiddleware, requireRole('lawyer'), async (req, res, next) => {
  try {
    return await withdrawPayout(req, res, next);
  } catch (err) {
    return next(err);
  }
});

router.get('/history', authMiddleware, requireRole('lawyer'), async (req, res, next) => {
  try {
    return await getPayoutHistory(req, res, next);
  } catch (err) {
    return next(err);
  }
});

router.get('/stats', authMiddleware, requireRole('lawyer'), async (req, res, next) => {
  try {
    return await getPayoutStats(req, res, next);
  } catch (err) {
    return next(err);
  }
});

router.get('/earnings', authMiddleware, requireRole('lawyer'), async (req, res, next) => {
  try {
    return await getEarningsBookings(req, res, next);
  } catch (err) {
    return next(err);
  }
});

export default router;
