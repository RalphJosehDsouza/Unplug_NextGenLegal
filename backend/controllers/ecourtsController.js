import { Notification, TrackedCase, User } from '../models/index.js';
import { sendSMS } from '../services/notificationService.js';
import { normalizeCnr, searchEcourtsCase, isValidCnr } from '../services/ecourtsService.js';

async function requireUser(req) {
  if (!req.user?.id) {
    const err = new Error('Authentication required');
    err.statusCode = 401;
    throw err;
  }
  return req.user;
}

export async function getEcourtsCase(req, res, next) {
  try {
    const cnr = req.params.cnr;
    if (!isValidCnr(cnr)) {
      return next({ statusCode: 400, message: 'Invalid CNR format' });
    }

    const result = await searchEcourtsCase(cnr);
    return res.json({ success: true, data: result });
  } catch (err) {
    return next(err);
  }
}

export async function trackCase(req, res, next) {
  try {
    const { id: userId } = await requireUser(req);
    const { cnr } = req.body || {};

    if (!cnr || !isValidCnr(cnr)) {
      return next({ statusCode: 400, message: 'Invalid CNR format' });
    }

    const normalized = normalizeCnr(cnr);

    const existing = await TrackedCase.findOne({ where: { user_id: userId, cnr: normalized } });
    if (existing) {
      return res.json({ success: true, data: { tracked: true, tracked_case_id: existing.id } });
    }

    const ecourts = await searchEcourtsCase(normalized);

    const tracked = await TrackedCase.create({
      user_id: userId,
      cnr: normalized,
      case_name: ecourts.case_name,
      last_status: ecourts.status,
      last_hearing_date: ecourts.next_hearing_date || null,
      last_checked_at: new Date(),
    });

    return res.json({ success: true, data: { tracked: true, tracked_case_id: tracked.id } });
  } catch (err) {
    return next(err);
  }
}

export async function listTrackedCases(req, res, next) {
  try {
    const { id: userId } = await requireUser(req);

    const cases = await TrackedCase.findAll({
      where: { user_id: userId },
      order: [['last_checked_at', 'DESC']],
    });

    return res.json({
      success: true,
      data: {
        trackedCases: cases.map((c) => ({
          id: c.id,
          cnr: c.cnr,
          case_name: c.case_name,
          last_status: c.last_status,
          last_hearing_date: c.last_hearing_date,
          last_checked_at: c.last_checked_at,
        })),
      },
    });
  } catch (err) {
    return next(err);
  }
}

export async function untrackCase(req, res, next) {
  try {
    const { id: userId } = await requireUser(req);
    const trackedId = req.params.id;

    const tracked = await TrackedCase.findByPk(trackedId);
    if (!tracked) return next({ statusCode: 404, message: 'Tracked case not found' });
    if (tracked.user_id !== userId) return next({ statusCode: 403, message: 'Forbidden' });

    await tracked.destroy();
    return res.json({ success: true, data: { untracked: true, tracked_case_id: trackedId } });
  } catch (err) {
    return next(err);
  }
}

// Used by cron job.
export async function refreshTrackedCaseAndNotify({ trackedCase }) {
  const user = await User.findByPk(trackedCase.user_id, { attributes: ['id', 'phone', 'email', 'full_name'] });
  if (!user) return;

  const ecourts = await searchEcourtsCase(trackedCase.cnr);

  const newNext = ecourts.next_hearing_date || null;
  const oldNext = trackedCase.last_hearing_date || null;

  // If date object differs, or status differs, notify.
  const newNextTs = newNext ? newNext.getTime() : null;
  const oldNextTs = oldNext ? oldNext.getTime() : null;

  const statusChanged = trackedCase.last_status !== (ecourts.status || null);
  const hearingChanged = newNextTs !== oldNextTs;

  await trackedCase.update({
    case_name: ecourts.case_name,
    last_status: ecourts.status,
    last_hearing_date: newNext,
    last_checked_at: new Date(),
  });

  if (!hearingChanged && !statusChanged) return;

  const nextDateText = newNext ? newNext.toISOString().slice(0, 10) : 'N/A';

  const title = 'eCourts: Case update';
  const body = `CNR ${trackedCase.cnr} update. Next hearing: ${nextDateText}. Status: ${ecourts.status || 'N/A'}.`;

  const notification = await Notification.create({
    user_id: user.id,
    title,
    body,
    type: 'system',
    resource_id: trackedCase.id,
    read: false,
  });

  if (user.phone) {
    await sendSMS(user.phone, `NextGenLegal: eCourts update for CNR ${trackedCase.cnr}. Next hearing: ${nextDateText}.`);
  }

  return { notified: true, notificationId: notification.id };
}

