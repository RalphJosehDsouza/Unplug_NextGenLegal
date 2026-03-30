import express from 'express';

import authMiddleware from '../middleware/authMiddleware.js';

import { generatePwdvaApplication } from '../controllers/womensHelpController.js';

const router = express.Router();

router.post('/generate-application', authMiddleware, async (req, res, next) => {
  try {
    return await generatePwdvaApplication(req, res, next);
  } catch (err) {
    return next(err);
  }
});

export default router;

