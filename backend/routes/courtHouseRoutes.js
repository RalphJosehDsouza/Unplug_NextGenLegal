import { Router } from 'express';
import multer from 'multer';
import { body, validationResult } from 'express-validator';

import authMiddleware from '../middleware/authMiddleware.js';
import requireRole from '../middleware/requireRole.js';
import {
  createHearing,
  getHearing,
  listCaseTypes,
  listHearings,
  uploadRequiredDocument,
} from '../controllers/courtHouseController.js';

const router = Router();
const uploadMiddleware = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 },
});

const createHearingSchema = [
  body('topic').notEmpty().isString().withMessage('topic is required'),
  body('description').optional().isString().withMessage('description must be a string'),
  body('hearing_at').notEmpty().withMessage('hearing_at is required'),
  body('case_type_id').notEmpty().isUUID().withMessage('case_type_id must be a UUID'),
];

const validateOrThrow = (req, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    next({ statusCode: 400, message: errors.array()[0].msg });
    return true;
  }
  return false;
};

router.get('/case-types', authMiddleware, requireRole('lawyer'), async (req, res, next) => {
  try {
    return await listCaseTypes(req, res, next);
  } catch (err) {
    return next(err);
  }
});

router.post('/hearings', authMiddleware, requireRole('lawyer'), createHearingSchema, async (req, res, next) => {
  try {
    if (validateOrThrow(req, next)) return;
    return await createHearing(req, res, next);
  } catch (err) {
    return next(err);
  }
});

router.get('/hearings', authMiddleware, requireRole('lawyer'), async (req, res, next) => {
  try {
    return await listHearings(req, res, next);
  } catch (err) {
    return next(err);
  }
});

router.get('/hearings/:id', authMiddleware, requireRole('lawyer'), async (req, res, next) => {
  try {
    return await getHearing(req, res, next);
  } catch (err) {
    return next(err);
  }
});

router.post(
  '/hearings/:id/requirements/:requirementId/upload',
  authMiddleware,
  requireRole('lawyer'),
  uploadMiddleware.single('file'),
  async (req, res, next) => {
    try {
      return await uploadRequiredDocument(req, res, next);
    } catch (err) {
      return next(err);
    }
  },
);

export default router;
