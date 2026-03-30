import express from 'express';

import authMiddleware from '../middleware/authMiddleware.js';

import {
  generateLegalNotice,
  trackDelivery,
  getTracking,
} from '../controllers/legalNoticeController.js';

const router = express.Router();

router.post('/generate', authMiddleware, generateLegalNotice);
router.post('/:id/track-delivery', authMiddleware, trackDelivery);
router.get('/tracking', authMiddleware, getTracking);

export default router;

