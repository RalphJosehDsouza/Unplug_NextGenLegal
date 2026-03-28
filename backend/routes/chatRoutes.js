import { Router } from 'express';

import authMiddleware from '../middleware/authMiddleware.js';

import { ask } from '../controllers/chatController.js';

const router = Router();

router.post('/', authMiddleware, async (req, res, next) => {
  try {
    return await ask(req, res, next);
  } catch (err) {
    return next(err);
  }
});

export default router;

