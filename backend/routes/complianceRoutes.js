import { Router } from 'express';

import authMiddleware from '../middleware/authMiddleware.js';

import { createTask, deleteTask, listTasks, stats, updateTask } from '../controllers/complianceController.js';

const router = Router();

router.post('/', authMiddleware, async (req, res, next) => {
  try {
    return await createTask(req, res, next);
  } catch (err) {
    return next(err);
  }
});

router.get('/', authMiddleware, async (req, res, next) => {
  try {
    return await listTasks(req, res, next);
  } catch (err) {
    return next(err);
  }
});

router.patch('/:id', authMiddleware, async (req, res, next) => {
  try {
    return await updateTask(req, res, next);
  } catch (err) {
    return next(err);
  }
});

router.delete('/:id', authMiddleware, async (req, res, next) => {
  try {
    return await deleteTask(req, res, next);
  } catch (err) {
    return next(err);
  }
});

router.get('/stats', authMiddleware, async (req, res, next) => {
  try {
    return await stats(req, res, next);
  } catch (err) {
    return next(err);
  }
});

export default router;

import { Router } from 'express';

const router = Router();

router.get('/', async (req, res, next) => {
  try {
    return res.json({ success: true, data: { message: 'Compliance API placeholder' } });
  } catch (err) {
    return next(err);
  }
});

export default router;

