import { Router } from 'express';
import { body } from 'express-validator';

import authMiddleware from '../middleware/authMiddleware.js';
import checkPlan from '../middleware/checkPlan.js';

import { createOrder, confirmBooking, listMyBookings, cancelBooking, addReview } from '../controllers/bookingController.js';

const router = Router();

router.post('/',
  authMiddleware,
  checkPlan(['starter', 'pro', 'enterprise']),
  [
    body('lawyer_id').notEmpty().isUUID().withMessage('lawyer_id is required'),
    body('slot_time').notEmpty().withMessage('slot_time is required'),
    body('duration_mins').optional().isInt({ min: 30, max: 180 }).withMessage('duration_mins must be 30..180'),
  ],
  async (req, res, next) => {
    try {
      return await createOrder(req, res, next);
    } catch (err) {
      return next(err);
    }
  },
);

router.post('/confirm', authMiddleware, async (req, res, next) => {
  try {
    return await confirmBooking(req, res, next);
  } catch (err) {
    return next(err);
  }
});

router.get('/', authMiddleware, async (req, res, next) => {
  try {
    return await listMyBookings(req, res, next);
  } catch (err) {
    return next(err);
  }
});

router.patch('/:id/cancel', authMiddleware, async (req, res, next) => {
  try {
    return await cancelBooking(req, res, next);
  } catch (err) {
    return next(err);
  }
});

router.post('/:id/review', authMiddleware, async (req, res, next) => {
  try {
    return await addReview(req, res, next);
  } catch (err) {
    return next(err);
  }
});

export default router;

