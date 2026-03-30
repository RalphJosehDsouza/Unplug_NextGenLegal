import { Router } from 'express';
import multer from 'multer';

import authMiddleware from '../middleware/authMiddleware.js';

import { analyzeDocReview } from '../controllers/docReviewController.js';

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
});

// POST /api/doc-review/analyze?doc_type=...
router.post('/analyze', authMiddleware, upload.single('file'), async (req, res, next) => {
  try {
    return await analyzeDocReview(req, res, next);
  } catch (err) {
    return next(err);
  }
});

export default router;

