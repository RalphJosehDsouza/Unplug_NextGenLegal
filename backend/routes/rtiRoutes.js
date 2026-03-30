import express from 'express';

import authMiddleware from '../middleware/authMiddleware.js';

import { generateRti, searchPio } from '../controllers/rtiController.js';

const router = express.Router();

router.post('/search-pio', async (req, res, next) => {
  try {
    return await searchPio(req, res, next);
  } catch (err) {
    return next(err);
  }
});

router.post('/generate', authMiddleware, async (req, res, next) => {
  try {
    return await generateRti(req, res, next);
  } catch (err) {
    return next(err);
  }
});

export default router;

