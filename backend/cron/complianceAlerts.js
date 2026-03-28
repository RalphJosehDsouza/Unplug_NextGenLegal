import cron from 'node-cron';
import { Op } from 'sequelize';

import { ActivityLog, ComplianceTask, Notification, User } from '../models/index.js';
import { sendEmail, sendSMS, sendWhatsApp, emailTemplate } from '../services/notificationService.js';

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

function daysUntilDue(dateOnly) {
  const now = new Date();
  const todayUtc = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  const [y, m, d] = dateOnly.split('-').map(Number);
  const dueUtc = Date.UTC(y, m - 1, d);
  return Math.floor((dueUtc - todayUtc) / (24 * 60 * 60 * 1000));
}

async function createInAppNotification(userId, title, body, type, resource_id) {
  await Notification.create({
    user_id: userId,
    title,
    body,
    type,
    resource_id: resource_id || null,
    read: false,
  });
}

async function runComplianceAlerts() {
  const today = toDateOnly(new Date());
  const plus30 = addDaysDateOnly(today, 30);

  // a) Due within 30 days, pending -> notify, mark notified
  const dueSoon = await ComplianceTask.findAll({
    where: {
      due_date: { [Op.between]: [today, plus30] },
      status: { [Op.in]: ['pending'] },
    },
    include: [{ model: User, as: 'user', attributes: ['email', 'full_name', 'phone', 'preferred_lang'] }],
  });

  let notifiedCount = 0;
  for (const task of dueSoon) {
    const user = task.user;
    const n = daysUntilDue(task.due_date);
    const subject = `NextGenLegal: Compliance reminder (${task.label})`;
    const bodyHtml = `
      <div style="font-size:14px;color:#333;">
        <div>Hi <b>${user?.full_name || 'there'}</b>,</div>
        <div style="margin-top:10px;">A compliance task is due soon.</div>
        <table>
          <tr><td><b>Task</b></td><td>${task.label}</td></tr>
          <tr><td><b>Due date</b></td><td>${task.due_date}</td></tr>
          <tr><td><b>Due in</b></td><td>${n} day(s)</td></tr>
        </table>
      </div>
    `;
    const html = emailTemplate({
      title: 'Compliance Reminder',
      bodyHtml,
      ctaUrl: `${process.env.FRONTEND_URL}/compliance`,
      ctaLabel: 'View Dashboard',
      theme: 'indigo',
    });

    if (user?.email) {
      await sendEmail(user.email, subject, html);
    }

    if (user?.phone) {
      await sendSMS(user.phone, `NextGenLegal: ${task.label} due in ${n} days on ${task.due_date}. Login: app.nextgenlegal.in`);
    }

    if (user?.phone) {
      await sendWhatsApp(user.phone, 'compliance_reminder', {
        lawyer_name: user?.full_name || 'User',
        task_label: task.label,
        due_date: task.due_date,
        dashboard_link: `${process.env.FRONTEND_URL}/compliance`,
      });
    }

    task.status = 'notified';
    task.notified_at = new Date();
    await task.save();

    await createInAppNotification(
      task.user_id,
      'Compliance reminder',
      `${task.label} due in ${n} days on ${task.due_date}.`,
      'compliance',
      task.id,
    );

    notifiedCount++;
  }

  // b) Overdue: due_date < today and status in pending/notified
  const overdue = await ComplianceTask.findAll({
    where: {
      due_date: { [Op.lt]: today },
      status: { [Op.in]: ['pending', 'notified'] },
    },
    include: [{ model: User, as: 'user', attributes: ['email', 'full_name', 'phone'] }],
  });

  let overdueCount = 0;
  for (const task of overdue) {
    const user = task.user;
    const subject = `NextGenLegal: OVERDUE compliance task (${task.label})`;
    const bodyHtml = `
      <div style="font-size:14px;color:#333;">
        <div>Hi <b>${user?.full_name || 'there'}</b>,</div>
        <div style="margin-top:10px;color:#b91c1c;font-weight:700;">This task is OVERDUE.</div>
        <table>
          <tr><td><b>Task</b></td><td>${task.label}</td></tr>
          <tr><td><b>Due date</b></td><td>${task.due_date}</td></tr>
        </table>
      </div>
    `;
    const html = emailTemplate({
      title: 'Overdue Compliance Alert',
      bodyHtml,
      ctaUrl: `${process.env.FRONTEND_URL}/compliance`,
      ctaLabel: 'View Dashboard',
      theme: 'red',
    });

    if (user?.email) {
      await sendEmail(user.email, subject, html);
    }

    task.status = 'overdue';
    await task.save();

    await createInAppNotification(
      task.user_id,
      'Overdue compliance alert',
      `${task.label} is overdue (due ${task.due_date}).`,
      'compliance',
      task.id,
    );

    overdueCount++;
  }

  await ActivityLog.create({
    user_id: null,
    action: 'cron_compliance_run',
    resource_type: 'system',
    resource_id: null,
    ip_address: '127.0.0.1',
  });

  return { notifiedCount, overdueCount };
}

export function startComplianceAlertsCron() {
  cron.schedule(
    '0 8 * * *',
    async () => {
      try {
        await runComplianceAlerts();
      } catch {
        // Swallow cron errors to keep process alive; errors should be handled by external logging.
      }
    },
    { timezone: 'Asia/Kolkata' },
  );
}

