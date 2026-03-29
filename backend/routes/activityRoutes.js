import { Router } from 'express';

import authMiddleware from '../middleware/authMiddleware.js';
import { listRecent } from '../controllers/activityController.js';

const router = Router();

router.get('/recent', authMiddleware, async (req, res, next) => {
  try {
    return await listRecent(req, res, next);
  } catch (err) {
    return next(err);
  }
});

export default router;
