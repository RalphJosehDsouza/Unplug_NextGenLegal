import { Notification } from '../models/index.js';

export async function listNotifications(req, res, next) {
  try {
    const userId = req.user.id;
    const notifications = await Notification.findAll({
      where: { user_id: userId },
      order: [['created_at', 'DESC']],
      limit: 20,
    });

    const unreadCount = await Notification.count({ where: { user_id: userId, read: false } });

    return res.json({
      success: true,
      data: {
        unreadCount,
        notifications: notifications.map((n) => ({
          id: n.id,
          title: n.title,
          body: n.body,
          read: n.read,
          type: n.type,
          resource_id: n.resource_id,
          created_at: n.created_at,
        })),
      },
    });
  } catch (err) {
    return next(err);
  }
}

export async function markAllRead(req, res, next) {
  try {
    const userId = req.user.id;
    await Notification.update({ read: true }, { where: { user_id: userId, read: false } });
    return res.json({ success: true, data: { message: 'ok' } });
  } catch (err) {
    return next(err);
  }
}

