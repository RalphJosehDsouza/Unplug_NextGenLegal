import express from 'express';

import authMiddleware from '../middleware/authMiddleware.js';
import requireRole from '../middleware/requireRole.js';
import { initiateKyc, addBankAccount, getKycStatus } from '../controllers/kycController.js';

const router = express.Router();

router.post('/initiate', authMiddleware, requireRole('lawyer'), initiateKyc);
router.post('/bank-account', authMiddleware, requireRole('lawyer'), addBankAccount);
router.get('/status', authMiddleware, requireRole('lawyer'), getKycStatus);

export default router;
