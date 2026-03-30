import express from 'express';

import authMiddleware from '../middleware/authMiddleware.js';

import {
  getEcourtsCase,
  listTrackedCases,
  trackCase,
  untrackCase,
} from '../controllers/ecourtsController.js';

const router = express.Router();

// Search case by CNR (public authenticated).
router.get('/case/:cnr', authMiddleware, getEcourtsCase);

// Track / manage.
router.post('/track', authMiddleware, trackCase);
router.get('/tracked', authMiddleware, listTrackedCases);
router.delete('/tracked/:id', authMiddleware, untrackCase);

// Exported for internal use/testing (not mounted).
router.post('/_refresh', authMiddleware, async (req, res, next) => {
  try {
    return res.json({ success: false, message: 'Not implemented' });
  } catch (err) {
    return next(err);
  }
});

export default router;

