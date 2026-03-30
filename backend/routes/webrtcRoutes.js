import { Router } from 'express';
import { body } from 'express-validator';
import authMiddleware from '../middleware/authMiddleware.js';
import {
  initiateVideoCall,
  acceptVideoCall,
  rejectVideoCall,
  scheduleVideoCall,
  endVideoCall,
  getCallStatus,
} from '../controllers/webrtcController.js';

const router = Router();

// Citizen initiates video call request
router.post('/initiate', authMiddleware, [body('booking_id').notEmpty().isUUID()], async (req, res, next) => {
  try {
    return await initiateVideoCall(req, res, next);
  } catch (err) {
    return next(err);
  }
});

// Lawyer accepts video call
router.post('/accept', authMiddleware, [body('booking_id').notEmpty().isUUID()], async (req, res, next) => {
  try {
    return await acceptVideoCall(req, res, next);
  } catch (err) {
    return next(err);
  }
});

// Lawyer rejects video call
router.post('/reject', authMiddleware, [body('booking_id').notEmpty().isUUID()], async (req, res, next) => {
  try {
    return await rejectVideoCall(req, res, next);
  } catch (err) {
    return next(err);
  }
});

// Lawyer schedules video call time
router.post('/schedule', authMiddleware, [
  body('booking_id').notEmpty().isUUID(),
  body('scheduled_time').optional().isISO8601().toDate(),
  body('start_immediately').optional().isBoolean(),
], async (req, res, next) => {
  try {
    return await scheduleVideoCall(req, res, next);
  } catch (err) {
    return next(err);
  }
});

// End video call
router.post('/end', authMiddleware, [body('booking_id').notEmpty().isUUID()], async (req, res, next) => {
  try {
    return await endVideoCall(req, res, next);
  } catch (err) {
    return next(err);
  }
});

// Get call status
router.get('/status/:booking_id', authMiddleware, async (req, res, next) => {
  try {
    return await getCallStatus(req, res, next);
  } catch (err) {
    return next(err);
  }
});

export default router;
