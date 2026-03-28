import { Op } from 'sequelize';

import { ComplianceTask } from '../models/index.js';

function endOfMonth(d) {
  const dt = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0));
  return dt;
}

function endOfQuarter(d) {
  const m = d.getUTCMonth(); // 0-11
  const quarterEndMonth = m <= 2 ? 2 : m <= 5 ? 5 : m <= 8 ? 8 : 11;
  return new Date(Date.UTC(d.getUTCFullYear(), quarterEndMonth + 1, 0));
}

function toDateOnly(d) {
  const yyyy = d.getUTCFullYear();
  const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(d.getUTCDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function parseDateOnly(s) {
  const str = String(s || '').trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(str)) return null;
  return str;
}

function daysUntilDue(dateOnly) {
  const now = new Date();
  const todayUtc = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  const [y, m, d] = dateOnly.split('-').map(Number);
  const dueUtc = Date.UTC(y, m - 1, d);
  return Math.floor((dueUtc - todayUtc) / (24 * 60 * 60 * 1000));
}

export async function createTask(req, res, next) {
  try {
    const userId = req.user.id;
    const { task_type, label, due_date, notes, external_ref } = req.body;

    if (!task_type || !label) return next({ statusCode: 400, message: 'task_type and label are required' });

    let due = due_date ? parseDateOnly(due_date) : null;
    const now = new Date();

    if (!due) {
      if (task_type === 'gst_return_monthly') {
        due = toDateOnly(endOfMonth(now));
      } else if (task_type === 'gst_return_quarterly') {
        due = toDateOnly(endOfQuarter(now));
      } else if (task_type === 'mca_annual_return') {
        // 60 days after FY end (Mar 31) -> May 30, but user asked Sep 29. We'll honor Sep 29.
        const y = now.getUTCFullYear();
        const sep29 = new Date(Date.UTC(y, 8, 29));
        due = toDateOnly(sep29);
      } else if (task_type === 'rera_registration' || task_type === 'contract_expiry') {
        return next({ statusCode: 400, message: 'due_date is required for this task type' });
      }
    }

    if (!due) return next({ statusCode: 400, message: 'Unable to determine due_date' });

    const task = await ComplianceTask.create({
      user_id: userId,
      task_type,
      label,
      due_date: due,
      status: 'pending',
      notified_at: null,
      notes: notes || null,
      external_ref: external_ref || null,
    });

    return res.status(201).json({ success: true, data: { task } });
  } catch (err) {
    return next(err);
  }
}

export async function listTasks(req, res, next) {
  try {
    const userId = req.user.id;
    const tasks = await ComplianceTask.findAll({
      where: { user_id: userId },
      order: [['due_date', 'ASC']],
    });

    const grouped = { pending: [], notified: [], completed: [], overdue: [] };
    for (const t of tasks) {
      const dto = {
        id: t.id,
        task_type: t.task_type,
        label: t.label,
        due_date: t.due_date,
        status: t.status,
        notified_at: t.notified_at,
        notes: t.notes,
        external_ref: t.external_ref,
        created_at: t.created_at,
        daysUntilDue: daysUntilDue(t.due_date),
      };
      grouped[t.status]?.push(dto);
    }

    return res.json({ success: true, data: { tasks: grouped } });
  } catch (err) {
    return next(err);
  }
}

export async function updateTask(req, res, next) {
  try {
    const userId = req.user.id;
    const id = req.params.id;
    const { status, notes, label, due_date, external_ref } = req.body;

    const task = await ComplianceTask.findByPk(id);
    if (!task) return next({ statusCode: 404, message: 'Task not found' });
    if (task.user_id !== userId) return next({ statusCode: 403, message: 'Forbidden' });

    if (status) task.status = status;
    if (notes !== undefined) task.notes = notes || null;
    if (label) task.label = label;
    if (due_date) {
      const parsed = parseDateOnly(due_date);
      if (!parsed) return next({ statusCode: 400, message: 'Invalid due_date' });
      task.due_date = parsed;
    }
    if (external_ref !== undefined) task.external_ref = external_ref || null;

    await task.save();
    return res.json({ success: true, data: { task } });
  } catch (err) {
    return next(err);
  }
}

export async function deleteTask(req, res, next) {
  try {
    const userId = req.user.id;
    const id = req.params.id;
    const task = await ComplianceTask.findByPk(id);
    if (!task) return next({ statusCode: 404, message: 'Task not found' });
    if (task.user_id !== userId) return next({ statusCode: 403, message: 'Forbidden' });
    await task.destroy();
    return res.json({ success: true, data: { message: 'Deleted' } });
  } catch (err) {
    return next(err);
  }
}

export async function stats(req, res, next) {
  try {
    const userId = req.user.id;
    const now = new Date();
    const today = toDateOnly(now);

    const [pending, overdue, completed] = await Promise.all([
      ComplianceTask.count({ where: { user_id: userId, status: 'pending' } }),
      ComplianceTask.count({ where: { user_id: userId, status: 'overdue' } }),
      ComplianceTask.count({ where: { user_id: userId, status: 'completed' } }),
    ]);

    // due this week: pending/notified with due_date in [today, today+7]
    const weekEnd = toDateOnly(new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 7)));
    const dueThisWeek = await ComplianceTask.count({
      where: {
        user_id: userId,
        status: { [Op.in]: ['pending', 'notified'] },
        due_date: { [Op.between]: [today, weekEnd] },
      },
    });

    return res.json({
      success: true,
      data: { pending, overdue, due_this_week: dueThisWeek, completed },
    });
  } catch (err) {
    return next(err);
  }
}

