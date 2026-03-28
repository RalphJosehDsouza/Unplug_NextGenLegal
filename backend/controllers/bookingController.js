import crypto from 'crypto';

import { Op } from 'sequelize';
import nodemailer from 'nodemailer';

import { razorpay } from '../services/razorpay.js';

import { Booking, Lawyer, User, Review } from '../models/index.js';

function buildMailTemplate({ title, userName, meetingUrl, lawyerName }) {
  const safeTitle = String(title || 'NextGenLegal');
  return `<!doctype html>
  <html>
    <head>
      <meta charset="utf-8" />
      <style>
        body { font-family: Arial, sans-serif; background: #f6f7fb; margin: 0; padding: 0; }
        .wrap { max-width: 680px; margin: 0 auto; padding: 28px; }
        .card { background: #fff; border-radius: 14px; overflow: hidden; border: 1px solid #e7e8f0; }
        .header { background: #4f46e5; padding: 18px 20px; color: #fff; }
        .header b { font-size: 16px; }
        .content { padding: 22px 20px; color: #111; }
        table { width: 100%; border-collapse: collapse; margin-top: 14px; }
        td { padding: 10px 8px; border-bottom: 1px solid #eee; font-size: 14px; }
        .cta { display: inline-block; background: #4f46e5; color: #fff; text-decoration: none; padding: 10px 14px; border-radius: 10px; margin-top: 16px; }
        .muted { color: #666; font-size: 12px; margin-top: 14px; line-height: 1.4; }
      </style>
    </head>
    <body>
      <div class="wrap">
        <div class="card">
          <div class="header"><b>NextGenLegal</b></div>
          <div class="content">
            <div style="font-size: 16px; font-weight: 700; margin-bottom: 6px;">${safeTitle}</div>
            <div style="color:#333; font-size: 14px;">Hi ${userName},</div>
            <div style="color:#333; font-size: 14px; margin-top: 10px;">
              Your consultation meeting has been confirmed.
            </div>
            <table>
              <tr><td><b>Lawyer</b></td><td>${lawyerName}</td></tr>
              <tr><td><b>Meeting link</b></td><td><a href="${meetingUrl}" style="color:#4f46e5; word-break: break-all;">${meetingUrl}</a></td></tr>
            </table>
            <a class="cta" href="${meetingUrl}">Join Meeting</a>
            <div class="muted">For any queries, log in to app.nextgenlegal.in.</div>
          </div>
        </div>
      </div>
    </body>
  </html>`;
}

function getSmtpTransport() {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;
  if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS) return null;
  return nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT),
    secure: Number(SMTP_PORT) === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });
}

async function sendEmail(to, subject, html) {
  const transport = getSmtpTransport();
  if (!transport) return;
  await transport.sendMail({
    from: process.env.SMTP_USER,
    to,
    subject,
    html,
  });
}

async function sendSMS(phone, message) {
  const authKey = process.env.MSG91_AUTH_KEY;
  const flowId = process.env.MSG91_SMS_FLOW_ID; // create a flow with a VAR1 (message) variable
  const sender = process.env.MSG91_SMS_SENDER || 'FromAPI';
  if (!authKey || !flowId) return;

  const mobile = String(phone || '').replace(/\D/g, '');
  if (!mobile) return;
  const mobileWithCountry = mobile.startsWith('91') ? mobile : `91${mobile}`;

  const url = 'https://control.msg91.com/api/v5/flow/';
  const resp = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      authkey: authKey,
      flow_id: flowId,
      sender,
      recipients: [
        {
          mobiles: mobileWithCountry,
          VAR1: message,
        },
      ],
    }),
  });
  if (!resp.ok) {
    // Swallow SMS errors; booking should still succeed.
  }
}

async function createDailyRoom({ name, expEpoch }) {
  const dailyApiKey = process.env.DAILY_API_KEY;
  if (!dailyApiKey) throw new Error('DAILY_API_KEY is not configured');

  // Use REST directly (Daily API expects `properties.exp`).
  const resp = await fetch('https://api.daily.co/v1/rooms', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      authorization: `Bearer ${dailyApiKey}`,
    },
    body: JSON.stringify({
      name,
      privacy: 'private',
      properties: { exp: expEpoch },
    }),
  });

  const data = await resp.json();
  if (!resp.ok) {
    throw new Error(`Daily room creation failed: ${data?.message || resp.status}`);
  }
  return data;
}

function verifyRazorpaySignature({ order_id, payment_id, razorpay_signature }) {
  const secret = process.env.RAZORPAY_KEY_SECRET;
  if (!secret) throw new Error('RAZORPAY_KEY_SECRET is not configured');

  const body = `${order_id}|${payment_id}`;
  const expected = crypto.createHmac('sha256', secret).update(body).digest('hex');
  if (expected !== razorpay_signature) return false;
  return true;
}

export async function createOrder(req, res, next) {
  try {
    const userId = req.user.id;
    const { lawyer_id, slot_time, duration_mins } = req.body;

    if (!razorpay) return next({ statusCode: 500, message: 'Razorpay is not configured' });

    const lawyer = await Lawyer.findByPk(lawyer_id);
    if (!lawyer) return next({ statusCode: 404, message: 'Lawyer not found' });

    // Ensure slot isn't already booked (non-cancelled).
    const existing = await Booking.findOne({
      where: {
        lawyer_id,
        slot_time,
        status: { [Op.ne]: 'cancelled' },
      },
    });
    if (existing) return next({ statusCode: 409, message: 'Slot already booked' });

    const duration = duration_mins ? Number(duration_mins) : 60;
    const amountPaise = Math.floor((Number(lawyer.rate_per_hour || 0) * duration) / 60);

    const order = await razorpay.orders.create({
      amount: amountPaise,
      currency: 'INR',
      receipt: `NGL_${userId}_${Date.now()}`,
    });

    const booking = await Booking.create({
      user_id: userId,
      lawyer_id,
      slot_time: new Date(slot_time),
      duration_mins: duration,
      status: 'pending',
      meeting_url: null,
      payment_id: null,
      amount_paise: amountPaise,
    });

    return res.json({
      success: true,
      data: {
        order,
        booking_id: booking.id,
      },
    });
  } catch (err) {
    return next(err);
  }
}

export async function confirmBooking(req, res, next) {
  try {
    const userId = req.user.id;
    const {
      booking_id,
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    } = req.body;

    const booking = await Booking.findByPk(booking_id);
    if (!booking) return next({ statusCode: 404, message: 'Booking not found' });
    if (booking.user_id !== userId) return next({ statusCode: 403, message: 'Forbidden' });
    if (booking.status !== 'pending') return next({ statusCode: 400, message: 'Booking is not pending' });

    const ok = verifyRazorpaySignature({
      order_id: razorpay_order_id,
      payment_id: razorpay_payment_id,
      razorpay_signature,
    });
    if (!ok) return next({ statusCode: 400, message: 'Invalid Razorpay signature' });

    const duration = booking.duration_mins || 60;
    const slotMs = new Date(booking.slot_time).getTime();
    const expEpoch = Math.floor((slotMs + duration * 60 * 1000) / 1000);

    const daily = await createDailyRoom({
      name: `NGL-${booking.id.slice(0, 8)}`,
      expEpoch,
    });

    const meetingUrl = daily?.url;
    if (!meetingUrl) throw new Error('Daily room returned no URL');

    booking.payment_id = razorpay_payment_id;
    booking.meeting_url = meetingUrl;
    booking.status = 'confirmed';
    await booking.save();

    // Emails: user + lawyer
    const [user, lawyer] = await Promise.all([
      User.findByPk(booking.user_id),
      Lawyer.findByPk(booking.lawyer_id, { include: [{ model: User, as: 'user', attributes: ['email', 'full_name', 'phone'] }] }),
    ]);

    if (user?.email && lawyer?.user?.email) {
      const subject = 'NextGenLegal: Your Consultation is Confirmed';
      const htmlUser = buildMailTemplate({
        title: 'Consultation Confirmed',
        userName: user.full_name || user.email,
        meetingUrl,
        lawyerName: lawyer.user.full_name || 'Lawyer',
      });

      const htmlLawyer = buildMailTemplate({
        title: 'New Consultation Confirmed',
        userName: lawyer.user.full_name || lawyer.user.email,
        meetingUrl,
        lawyerName: lawyer.user.full_name || 'Lawyer',
      });

      await Promise.all([
        sendEmail(user.email, subject, htmlUser),
        sendEmail(lawyer.user.email, subject, htmlLawyer),
      ]);
    }

    // SMS to user
    if (user?.phone) {
      const msg = `NextGenLegal: Consultation confirmed. Meeting: ${meetingUrl} Login: app.nextgenlegal.in`;
      await sendSMS(user.phone, msg);
    }

    return res.json({
      success: true,
      data: {
        booking_id: booking.id,
        meeting_url: booking.meeting_url,
      },
    });
  } catch (err) {
    return next(err);
  }
}

export async function listMyBookings(req, res, next) {
  try {
    const userId = req.user.id;

    const bookings = await Booking.findAll({
      where: { user_id: userId },
      include: [
        {
          model: Lawyer,
          as: 'lawyer',
          include: [{ model: User, as: 'user', attributes: ['full_name', 'email'] }],
          attributes: ['id', 'rate_per_hour'],
        },
        { model: Review, as: 'review', required: false, attributes: ['id'] },
      ],
      order: [['slot_time', 'DESC']],
    });

    return res.json({
      success: true,
      data: {
        bookings: bookings.map((b) => ({
          id: b.id,
          lawyer_id: b.lawyer_id,
          lawyer_name: b.lawyer?.user?.full_name || null,
          slot_time: b.slot_time,
          duration_mins: b.duration_mins,
          status: b.status,
          meeting_url: b.meeting_url,
          reviewed: Boolean(b.review?.id),
        })),
      },
    });
  } catch (err) {
    return next(err);
  }
}

export async function cancelBooking(req, res, next) {
  try {
    const userId = req.user.id;
    const bookingId = req.params.id;

    const booking = await Booking.findByPk(bookingId);
    if (!booking) return next({ statusCode: 404, message: 'Booking not found' });
    if (booking.user_id !== userId) return next({ statusCode: 403, message: 'Forbidden' });

    const slotMs = new Date(booking.slot_time).getTime();
    if (slotMs - Date.now() < 24 * 60 * 60 * 1000) {
      return next({ statusCode: 400, message: 'This booking can only be cancelled 24+ hours before start' });
    }

    booking.status = 'cancelled';
    await booking.save();

    return res.json({ success: true, data: { booking_id: booking.id, status: booking.status } });
  } catch (err) {
    return next(err);
  }
}

export async function addReview(req, res, next) {
  try {
    const userId = req.user.id;
    const bookingId = req.params.id;
    const { rating, comment } = req.body;

    const booking = await Booking.findByPk(bookingId);
    if (!booking) return next({ statusCode: 404, message: 'Booking not found' });
    if (booking.user_id !== userId) return next({ statusCode: 403, message: 'Forbidden' });
    if (booking.status !== 'completed') return next({ statusCode: 400, message: 'Reviews can only be left after completion' });

    const existing = await Review.findOne({ where: { booking_id: bookingId } });
    if (existing) return next({ statusCode: 409, message: 'Review already exists for this booking' });

    const review = await Review.create({
      user_id: userId,
      booking_id: bookingId,
      rating: Number(rating),
      comment: comment || null,
    });

    return res.json({ success: true, data: { review_id: review.id } });
  } catch (err) {
    return next(err);
  }
}

