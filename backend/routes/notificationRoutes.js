import { Router } from 'express';

import authMiddleware from '../middleware/authMiddleware.js';
import { listNotifications, markAllRead } from '../controllers/notificationController.js';

const router = Router();

router.get('/', authMiddleware, async (req, res, next) => {
  try {
    return await listNotifications(req, res, next);
  } catch (err) {
    return next(err);
  }
});

router.patch('/read-all', authMiddleware, async (req, res, next) => {
  try {
    return await markAllRead(req, res, next);
  } catch (err) {
    return next(err);
  }
});

export default router;

