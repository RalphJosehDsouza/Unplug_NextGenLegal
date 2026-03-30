import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import multer from 'multer';

import authMiddleware from '../middleware/authMiddleware.js';

import { listLawyers, getLawyerProfile, getLawyerSlots, registerLawyer } from '../controllers/lawyerController.js';
import { matchLawyer } from '../controllers/lawyerMatchController.js';

const router = Router();

const memoryUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 6 * 1024 * 1024 }, // 6MB
});

// GET /api/lawyers?specialization=...&language=...&state=...&min_rate=...&max_rate=...&stars=5,4&verified_only=true&page=1&limit=12
router.get('/', async (req, res, next) => {
  try {
    return await listLawyers(req, res, next);
  } catch (err) {
    return next(err);
  }
});

// POST /api/lawyers/match
router.post('/match', authMiddleware, async (req, res, next) => {
  try {
    return await matchLawyer(req, res, next);
  } catch (err) {
    return next(err);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    return await getLawyerProfile(req, res, next);
  } catch (err) {
    return next(err);
  }
});

router.get('/:id/slots', async (req, res, next) => {
  try {
    return await getLawyerSlots(req, res, next);
  } catch (err) {
    return next(err);
  }
});

// Lawyer registration: multipart/form-data with bar_council_image file field.
router.post(
  '/register',
  authMiddleware,
  memoryUpload.single('bar_council_image'),
  [
    body('bar_council_id').notEmpty().withMessage('bar_council_id is required'),
    body('specialization').optional({ nullable: true }).isArray().withMessage('specialization must be an array'),
    body('languages').optional({ nullable: true }).isArray().withMessage('languages must be an array'),
    body('state').notEmpty().withMessage('state is required'),
    body('city').notEmpty().withMessage('city is required'),
    body('rate_per_hour').optional({ nullable: true }).isInt().withMessage('rate_per_hour must be an int (paisa)'),
    body('bio').optional({ nullable: true }).isString(),
  ],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next({ statusCode: 400, message: errors.array()[0].msg });
    }

    try {
      return await registerLawyer(req, res, next);
    } catch (err) {
      return next(err);
    }
  },
);

export default router;

