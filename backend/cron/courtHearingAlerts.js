import cron from 'node-cron';
import { Op } from 'sequelize';

import { Notification, User } from '../models/index.js';
import {
  createCourtReminderNotification,
  listMissingReminderCandidates,
} from '../controllers/courtHouseController.js';
import { emailTemplate, sendEmail } from '../services/notificationService.js';

function toDateOnly(d) {
  const yyyy = d.getUTCFullYear();
  const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(d.getUTCDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function addDaysDateOnly(dateOnly, days) {
  const [y, m, d] = dateOnly.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + days));
  return toDateOnly(dt);
}

function startOfDateOnlyUtc(dateOnly) {
  const [y, m, d] = dateOnly.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d, 0, 0, 0));
}

function endOfDateOnlyUtc(dateOnly) {
  const [y, m, d] = dateOnly.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d, 23, 59, 59, 999));
}

async function wasReminderSentToday({ userId, hearingId, todayStart, todayEnd }) {
  const existing = await Notification.findOne({
    where: {
      user_id: userId,
      type: 'court_hearing',
      resource_id: hearingId,
      created_at: {
        [Op.between]: [todayStart, todayEnd],
      },
    },
  });

  return Boolean(existing);
}

export async function runCourtHearingAlerts() {
  const today = toDateOnly(new Date());
  const plus6 = addDaysDateOnly(today, 6);

  const start = startOfDateOnlyUtc(today);
  const end = endOfDateOnlyUtc(plus6);

  const items = await listMissingReminderCandidates({ start, end });

  let reminderCount = 0;
  for (const item of items) {
    const { hearing, missing } = item;
    if (!missing.length) continue;

    const todayStart = startOfDateOnlyUtc(today);
    const todayEnd = endOfDateOnlyUtc(today);

    const alreadySent = await wasReminderSentToday({
      userId: hearing.lawyer_id,
      hearingId: hearing.id,
      todayStart,
      todayEnd,
    });
    if (alreadySent) continue;

    const lawyer = await User.findByPk(hearing.lawyer_id, { attributes: ['email', 'full_name'] });

    const missingList = missing.map((d) => d.label).join(', ');
    const hearingDate = new Date(hearing.hearing_at).toISOString();

    if (lawyer?.email) {
      const html = emailTemplate({
        title: 'CourtHouse: Pending required uploads',
        bodyHtml: `
          <div style="font-size:14px;color:#333;">
            <div>Hi <b>${lawyer.full_name || 'there'}</b>,</div>
            <div style="margin-top:10px;">Your hearing is approaching and required files are still missing.</div>
            <table>
              <tr><td><b>Topic</b></td><td>${hearing.topic}</td></tr>
              <tr><td><b>Case type</b></td><td>${hearing.caseType?.name || '-'}</td></tr>
              <tr><td><b>Hearing at</b></td><td>${hearingDate}</td></tr>
              <tr><td><b>Missing files</b></td><td>${missingList}</td></tr>
            </table>
          </div>
        `,
        ctaUrl: `${process.env.FRONTEND_URL}/courthouse`,
        ctaLabel: 'Open CourtHouse',
        theme: 'red',
      });

      await sendEmail(lawyer.email, 'NextGenLegal: Court hearing document reminder', html);
    }

    await createCourtReminderNotification({
      userId: hearing.lawyer_id,
      hearingId: hearing.id,
      title: 'Court hearing document reminder',
      body: `${hearing.topic}: upload pending files (${missingList}).`,
    });

    reminderCount++;
  }

  return { reminderCount };
}

export function startCourtHearingAlertsCron() {
  cron.schedule(
    '0 9 * * *',
    async () => {
      try {
        await runCourtHearingAlerts();
      } catch {
        // Keep process alive if reminder job fails.
      }
    },
    { timezone: 'Asia/Kolkata' },
  );
}
