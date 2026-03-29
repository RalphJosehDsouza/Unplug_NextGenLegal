import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';

import authRoutes from './routes/authRoutes.js';
import documentRoutes from './routes/documentRoutes.js';
import lawyersRoutes from './routes/lawyersRoutes.js';
import paymentsRoutes from './routes/paymentsRoutes.js';
import complianceRoutes from './routes/complianceRoutes.js';
import chatRoutes from './routes/chatRoutes.js';
import bookingRoutes from './routes/bookingRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import activityRoutes from './routes/activityRoutes.js';
import courtHouseRoutes from './routes/courtHouseRoutes.js';
import { startComplianceAlertsCron } from './cron/complianceAlerts.js';
import { startCourtHearingAlertsCron } from './cron/courtHearingAlerts.js';

import errorHandler from './middleware/errorHandler.js';
import passport from 'passport';

const app = express();

app.disable('x-powered-by');

// Strict CSP for an API-only service.
app.use(
  helmet({
    xFrameOptions: false,
    contentSecurityPolicy: {
      useDefaults: false,
      directives: {
        defaultSrc: ["'none'"],
        baseUri: ["'none'"],
        formAction: ["'none'"],
        frameAncestors: ["'self'", process.env.FRONTEND_URL],
        objectSrc: ["'none'"],
        scriptSrc: ["'none'"],
        styleSrc: ["'none'"],
        imgSrc: ["'none'"],
        fontSrc: ["'none'"],
        connectSrc: ["'self'"],
        upgradeInsecureRequests: [],
      },
    },
  }),
);

app.use(
  cors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
  }),
);

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(passport.initialize());

export const authLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Too many authentication requests, please try again later.' },
});

export const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Too many requests, please try again later.' },
});

export const chatLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Too many chat requests, please try again later.' },
});

app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/docs', apiLimiter, documentRoutes);
app.use('/api/lawyers', apiLimiter, lawyersRoutes);
app.use('/api/bookings', apiLimiter, bookingRoutes);
app.use('/api/payments', apiLimiter, paymentsRoutes);
app.use('/api/compliance', apiLimiter, complianceRoutes);
app.use('/api/notifications', apiLimiter, notificationRoutes);
app.use('/api/chat', chatLimiter, chatRoutes);
app.use('/api/activity', apiLimiter, activityRoutes);
app.use('/api/courthouse', apiLimiter, courtHouseRoutes);

// Start background schedulers
startComplianceAlertsCron();
startCourtHearingAlertsCron();

// 404 -> centralized error handler
app.use((req, res, next) => {
  next({ statusCode: 404, message: 'Not Found' });
});

// Global error handler (must be last)
app.use(errorHandler);

export default app;

