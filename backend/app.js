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
import kycRoutes from './routes/kycRoutes.js';
import payoutRoutes from './routes/payoutRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import esignRoutes from './routes/esignRoutes.js';
import legalNoticeRoutes from './routes/legalNoticeRoutes.js';
import ecourtsRoutes from './routes/ecourtsRoutes.js';
import rtiRoutes from './routes/rtiRoutes.js';
import womensHelpRoutes from './routes/womensHelpRoutes.js';
import docReviewRoutes from './routes/docReviewRoutes.js';
import webrtcRoutes from './routes/webrtcRoutes.js';
import { startComplianceAlertsCron } from './cron/complianceAlerts.js';
import { startCourtHearingAlertsCron } from './cron/courtHearingAlerts.js';
import { startPayoutReleaseCron } from './cron/payoutRelease.js';
import { startEcourtsTrackerCron } from './cron/ecourtsTracker.js';

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
app.use('/api/webrtc', apiLimiter, webrtcRoutes);
app.use('/api/payments', apiLimiter, paymentsRoutes);
app.use('/api/compliance', apiLimiter, complianceRoutes);
app.use('/api/notifications', apiLimiter, notificationRoutes);
app.use('/api/chat', chatLimiter, chatRoutes);
app.use('/api/activity', apiLimiter, activityRoutes);
app.use('/api/courthouse', apiLimiter, courtHouseRoutes);
app.use('/api/kyc', apiLimiter, kycRoutes);
app.use('/api/payouts', apiLimiter, payoutRoutes);
app.use('/api/admin', apiLimiter, adminRoutes);
app.use('/api', esignRoutes);
app.use('/api/legal-notice', apiLimiter, legalNoticeRoutes);
app.use('/api/ecourts', apiLimiter, ecourtsRoutes);
app.use('/api/rti', apiLimiter, rtiRoutes);
app.use('/api/womens-help', apiLimiter, womensHelpRoutes);
app.use('/api/doc-review', apiLimiter, docReviewRoutes);

// Start background schedulers
startComplianceAlertsCron();
startCourtHearingAlertsCron();
startPayoutReleaseCron();
startEcourtsTrackerCron();

// 404 -> centralized error handler
app.use((req, res, next) => {
  next({ statusCode: 404, message: 'Not Found' });
});

// Global error handler (must be last)
app.use(errorHandler);

export default app;

