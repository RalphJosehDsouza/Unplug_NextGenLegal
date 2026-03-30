import crypto from 'crypto';

import { Op } from 'sequelize';
import nodemailer from 'nodemailer';

import { razorpay } from '../services/razorpay.js';

import { Booking, Lawyer, User, Review, Notification } from '../models/index.js';

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
    if (lawyer.kyc_status !== 'verified' || !lawyer.bank_account_verified || !lawyer.razorpay_linked_account_id) {
      return next({ statusCode: 400, message: 'Lawyer is not eligible to receive payments yet' });
    }

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
    const commissionRate = lawyer.commission_rate || 0.05; // 5% by default
    const commissionPaise = Math.round(amountPaise * commissionRate);
    const lawyerPaise = amountPaise - commissionPaise;
    
    // Hold transfer for 24 hours post-consultation
    const slotMs = new Date(slot_time).getTime();
    const holdUntilEpoch = Math.floor(slotMs / 1000) + 86400;

    let order;
    try {
      order = await razorpay.orders.create({
        amount: amountPaise,
        currency: 'INR',
        receipt: `NGL_${userId}_${Date.now()}`,
        transfers: [{
          account: lawyer.razorpay_linked_account_id,
          amount: lawyerPaise,
          currency: 'INR',
          on_hold: 1,
          on_hold_until: holdUntilEpoch
        }]
      });
    } catch (razorpayErr) {
      console.error('[bookingController] createOrder Razorpay error:', razorpayErr);
      return next({ statusCode: 502, message: 'Payment provider error. Please try again.' });
    }

    const booking = await Booking.create({
      user_id: userId,
      lawyer_id,
      slot_time: new Date(slot_time),
      duration_mins: duration,
      status: 'pending',
      meeting_url: null,
      payment_id: null,
      amount_paise: amountPaise,
      razorpay_order_id: order.id,
      platform_commission_paise: commissionPaise,
      lawyer_payout_paise: lawyerPaise,
      payout_status: 'pending'
    });

    return res.json({
      success: true,
      data: {
        booking_id: booking.id,
        razorpay_order_id: order.id,
        razorpay_key: process.env.RAZORPAY_KEY_ID,
        amount_paise: amountPaise,
        order,
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
    // Keep both legacy `payment_id` and the newer `razorpay_payment_id` column in sync.
    booking.razorpay_payment_id = razorpay_payment_id;
    booking.meeting_url = meetingUrl;
    booking.status = 'confirmed';
    booking.payout_status = 'in_escrow';

    try {
      // Securely pull the attached transfer so we can release Escrow later
      const transfers = await razorpay.orders.fetchTransfers(razorpay_order_id);
      if (transfers && transfers.items && transfers.items.length > 0) {
        booking.razorpay_transfer_id = transfers.items[0].id;
      }
    } catch (routeErr) {
      console.error('[bookingController] Failed to associate transfers:', routeErr);
    }

    await booking.save();

    // Increment lawyer's earned payout balance
    const lawyerAccount = await Lawyer.findByPk(booking.lawyer_id);
    if (lawyerAccount) {
      // Need to make sure total_earned_paise starts at 0 if null
      lawyerAccount.total_earned_paise = (lawyerAccount.total_earned_paise || 0) + booking.lawyer_payout_paise;
      await lawyerAccount.save();
    }

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

export async function confirmConsultation(req, res, next) {
  try {
    const userId = req.user.id;
    const bookingId = req.params.id;

    const booking = await Booking.findByPk(bookingId, { include: ['lawyer'] });
    if (!booking) return next({ statusCode: 404, message: 'Booking not found' });
    if (booking.status !== 'confirmed') return next({ statusCode: 400, message: 'Consultation is not confirmed' });
    
    const slotMs = new Date(booking.slot_time).getTime();
    if (Date.now() < slotMs) {
      return next({ statusCode: 400, message: 'Consultation slot has not occurred yet' });
    }

    let isParty = false;
    let bothConfirmed = false;

    if (userId === booking.user_id) {
      booking.consultation_confirmed_client = true;
      isParty = true;
    } else if (userId === booking.lawyer?.user_id) {
      booking.consultation_confirmed_lawyer = true;
      isParty = true;
    }

    if (!isParty) {
      return next({ statusCode: 403, message: 'Forbidden' });
    }

    await booking.save();

    if (booking.consultation_confirmed_client && booking.consultation_confirmed_lawyer) {
      bothConfirmed = true;
      // Dynamically import releaseEscrow to break circular dependency cycles if any
      const { releaseEscrow } = await import('../services/paymentService.js');
      await releaseEscrow(booking);
    }

    return res.json({
      success: true,
      data: {
        confirmed: true,
        payout_released: bothConfirmed,
      }
    });
  } catch (err) {
    return next(err);
  }
}

export async function disputeConsultation(req, res, next) {
  try {
    const userId = req.user.id;
    const bookingId = req.params.id;
    const { reason } = req.body;

    const booking = await Booking.findByPk(bookingId);
    if (!booking) return next({ statusCode: 404, message: 'Booking not found' });
    if (booking.user_id !== userId) return next({ statusCode: 403, message: 'Forbidden' });
    
    if (booking.payout_status !== 'in_escrow') {
      return next({ statusCode: 400, message: 'Dispute cannot be raised at this status' });
    }

    const slotMs = new Date(booking.slot_time).getTime();
    if (Date.now() < slotMs) {
      return next({ statusCode: 400, message: 'Cannot dispute before consultation slot time' });
    }

    // Only allow dispute up to 24HR past the start schedule.
    if (Date.now() > slotMs + (24 * 60 * 60 * 1000)) {
      return next({ statusCode: 400, message: 'Dispute window closed (24h has passed)' });
    }

    booking.payout_status = 'disputed';
    booking.disputed_at = new Date();
    booking.dispute_reason = reason;
    await booking.save();

    // Dynamically notify admin and capture action
    const { sendEmail } = await import('../services/notificationService.js');

    if (process.env.ADMIN_EMAIL) {
      await sendEmail(
        process.env.ADMIN_EMAIL,
        `NextGenLegal Dispute Raised: ${booking.id}`,
        `Client ${userId} raised a dispute for consultation ${booking.id}: ${reason}`
      );
    }

    // In-app notification for admins (so disputes appear in the admin panel)
    try {
      const adminUser = await User.findOne({ where: { role: 'admin' }, attributes: ['id'] });
      if (adminUser) {
        await Notification.create({
          user_id: adminUser.id,
          title: 'New booking dispute',
          body: `Client ${userId} raised a dispute for booking ${booking.id}. Reason: ${reason || 'N/A'}`,
          type: 'booking',
          resource_id: booking.id,
          read: false,
        });
      }
    } catch (notifErr) {
      // Don't fail the dispute flow if in-app notification creation fails.
      console.error('[bookingController] Failed to create admin dispute notification:', notifErr);
    }

    return res.json({
      success: true,
      message: 'Dispute raised. Admin will review within 72 hours.',
    });
  } catch (err) {
    return next(err);
  }
}
