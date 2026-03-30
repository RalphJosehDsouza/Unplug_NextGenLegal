import express from 'express';

import authMiddleware from '../middleware/authMiddleware.js';

import {
  initiateDocumentEsign,
  getDocumentEsignStatus,
  leegalityWebhook,
} from '../controllers/esignController.js';

const router = express.Router();

router.post('/docs/:id/esign/initiate', authMiddleware, initiateDocumentEsign);
router.get('/docs/:id/esign/status', authMiddleware, getDocumentEsignStatus);
router.post('/esign/webhook', leegalityWebhook);

export default router;

