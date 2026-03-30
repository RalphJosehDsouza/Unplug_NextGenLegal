import { Router } from 'express';

import authMiddleware from '../middleware/authMiddleware.js';
import requireRole from '../middleware/requireRole.js';

import { listDisputes, resolveDispute } from '../controllers/adminController.js';

const router = Router();

router.get('/disputes', authMiddleware, requireRole('admin'), async (req, res, next) => {
  try {
    return await listDisputes(req, res, next);
  } catch (err) {
    return next(err);
  }
});

router.post('/disputes/:id/resolve', authMiddleware, requireRole('admin'), async (req, res, next) => {
  try {
    return await resolveDispute(req, res, next);
  } catch (err) {
    return next(err);
  }
});

export default router;
