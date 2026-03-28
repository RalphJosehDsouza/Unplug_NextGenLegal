import { Router } from 'express';
import { body, validationResult } from 'express-validator';

import { Document } from '../models/index.js';
import authMiddleware from '../middleware/authMiddleware.js';

import { generate, list, download, remove } from '../controllers/documentController.js';

const router = Router();

const templates = ['nda', 'rental_agreement', 'partnership_deed', 'employment_contract', 'affidavit'];

const validateOrThrow = (req, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    next({ statusCode: 400, message: errors.array()[0].msg });
    return true;
  }
  return false;
};

async function planLimiter(req, res, next) {
  try {
    const plan = req.user?.plan || 'freemium';
    if (plan !== 'freemium') return next();

    const count = await Document.count({ where: { user_id: req.user.id } });
    if (count >= 3) {
      return next({ statusCode: 403, message: 'Freemium plan limit reached (max 3 documents)' });
    }
    return next();
  } catch (err) {
    return next(err);
  }
}

const generateSchema = [
  body('doc_type').isIn(templates).withMessage('Invalid doc_type'),
  body('title').notEmpty().isString().withMessage('Title is required'),
  body('fields').isObject().withMessage('fields must be an object'),
];

router.post('/generate', authMiddleware, planLimiter, generateSchema, async (req, res, next) => {
  try {
    if (validateOrThrow(req, next)) return;
    return await generate(req, res, next);
  } catch (err) {
    return next(err);
  }
});

router.get('/', authMiddleware, async (req, res, next) => {
  try {
    return await list(req, res, next);
  } catch (err) {
    return next(err);
  }
});

router.get('/:id/download', authMiddleware, async (req, res, next) => {
  try {
    return await download(req, res, next);
  } catch (err) {
    return next(err);
  }
});

router.delete('/:id', authMiddleware, async (req, res, next) => {
  try {
    return await remove(req, res, next);
  } catch (err) {
    return next(err);
  }
});

export default router;

