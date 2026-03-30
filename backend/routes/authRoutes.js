import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import jwt from 'jsonwebtoken';

// Ensure the Google strategy is registered.
import passport from '../config/passport.js';

import authMiddleware from '../middleware/authMiddleware.js';

import {
  login,
  logout,
  me,
  refresh,
  register,
} from '../controllers/authController.js';

const router = Router();

export const registerSchema = [
  body('email').notEmpty().isEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  body('full_name').notEmpty().withMessage('Full name is required'),
  body('phone').optional({ nullable: true }).matches(/^\d{10}$/).withMessage('Phone must be a 10-digit number'),
  body('role').optional().isIn(['citizen', 'lawyer']).withMessage('Role must be citizen or lawyer'),
  body('specialization')
    .if(body('role').equals('lawyer'))
    .isArray({ min: 1 })
    .withMessage('At least one specialization is required for lawyers'),
  body('specialization.*')
    .if(body('role').equals('lawyer'))
    .isString()
    .trim()
    .notEmpty()
    .withMessage('Each specialization must be a non-empty string'),
  body('rate_per_hour')
    .if(body('role').equals('lawyer'))
    .isInt({ gt: 0 })
    .withMessage('rate_per_hour must be a positive integer (paisa)'),
];

export const loginSchema = [
  body('email').notEmpty().isEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required'),
];

function validateOrThrow(req, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    next({ statusCode: 400, message: errors.array()[0].msg });
    return true;
  }
  return false;
}

router.post('/register', registerSchema, async (req, res, next) => {
  try {
    if (validateOrThrow(req, next)) return;
    return await register(req, res, next);
  } catch (err) {
    return next(err);
  }
});

router.post('/login', loginSchema, async (req, res, next) => {
  try {
    if (validateOrThrow(req, next)) return;
    return await login(req, res, next);
  } catch (err) {
    return next(err);
  }
});

router.post('/refresh', async (req, res, next) => {
  try {
    return await refresh(req, res, next);
  } catch (err) {
    return next(err);
  }
});

router.post('/logout', async (req, res, next) => {
  try {
    return await logout(req, res, next);
  } catch (err) {
    return next(err);
  }
});

router.get('/me', authMiddleware, async (req, res, next) => {
  try {
    return await me(req, res, next);
  } catch (err) {
    return next(err);
  }
});

// Google OAuth
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'], session: false }));

router.get(
  '/google/callback',
  passport.authenticate('google', { session: false, failureRedirect: `${process.env.FRONTEND_URL}/login` }),
  async (req, res, next) => {
    try {
      const user = req.user;
      if (!user) return next({ statusCode: 401, message: 'Google authentication failed' });

      const accessToken = jwt.sign(
        { id: user.id, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m' },
      );

      const refreshToken = jwt.sign(
        { id: user.id, role: user.role, tokenType: 'refresh' },
        process.env.JWT_REFRESH_SECRET,
        { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d' },
      );

      res.cookie(
        'refreshToken',
        refreshToken,
        {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
          maxAge: 30 * 24 * 60 * 60 * 1000,
          path: '/api/auth',
        },
      );

      const redirectUrl = `${process.env.FRONTEND_URL}/dashboard?accessToken=${encodeURIComponent(accessToken)}`;
      return res.redirect(redirectUrl);
    } catch (err) {
      return next(err);
    }
  },
);

export default router;

