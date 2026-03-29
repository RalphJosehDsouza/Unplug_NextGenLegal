import { Router } from 'express';

import authMiddleware from '../middleware/authMiddleware.js';

import {
  createTask,
  deleteTask,
  listTasks,
  stats,
  updateTask
} from '../controllers/complianceController.js';

const router = Router();

/**
 * @route   GET /api/compliance/stats
 * @desc    Get compliance statistics
 * @access  Private
 */
router.get('/stats', authMiddleware, stats);

/**
 * @route   GET /api/compliance
 * @desc    Get all compliance tasks
 * @access  Private
 */
router.get('/', authMiddleware, listTasks);

/**
 * @route   POST /api/compliance
 * @desc    Create a new compliance task
 * @access  Private
 */
router.post('/', authMiddleware, createTask);

/**
 * @route   PATCH /api/compliance/:id
 * @desc    Update a compliance task
 * @access  Private
 */
router.patch('/:id', authMiddleware, updateTask);

/**
 * @route   DELETE /api/compliance/:id
 * @desc    Delete a compliance task
 * @access  Private
 */
router.delete('/:id', authMiddleware, deleteTask);

export default router;