import { Router } from 'express';
import multer from 'multer';
import { body, validationResult } from 'express-validator';

import { Document } from '../models/index.js';
import authMiddleware from '../middleware/authMiddleware.js';

import {
  generate,
  list,
  download,
  remove,
  upload,
  createViewToken,
  stream,
  purchaseEstamp,
} from '../controllers/documentController.js';

const router = Router();
const uploadMiddleware = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 },
});

const templates = ['nda', 'rental_agreement', 'partnership_deed', 'employment_contract', 'affidavit'];

const validateOrThrow = (req, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    next({ statusCode: 400, message: errors.array()[0].msg });
    return true;
  }
  return false;
};

const generateSchema = [
  body('doc_type').isIn(templates).withMessage('Invalid doc_type'),
  body('title').notEmpty().isString().withMessage('Title is required'),
  body('fields').isObject().withMessage('fields must be an object'),
];

const uploadSchema = [
  body('title').optional().isString().withMessage('title must be a string'),
];

async function authIfPresent(req, res, next) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authMiddleware(req, res, next);
  }
  return next();
}

router.post('/generate', authMiddleware, generateSchema, async (req, res, next) => {
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

router.post('/upload', authMiddleware, uploadMiddleware.single('file'), uploadSchema, async (req, res, next) => {
  try {
    if (validateOrThrow(req, next)) return;
    return await upload(req, res, next);
  } catch (err) {
    return next(err);
  }
});

router.post('/:id/purchase-estamp', authMiddleware, async (req, res, next) => {
  try {
    return await purchaseEstamp(req, res, next);
  } catch (err) {
    return next(err);
  }
});

router.post('/:id/view-token', authMiddleware, async (req, res, next) => {
  try {
    return await createViewToken(req, res, next);
  } catch (err) {
    return next(err);
  }
});

router.get('/:id/stream', authIfPresent, async (req, res, next) => {
  try {
    return await stream(req, res, next);
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

