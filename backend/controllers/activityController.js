import { ActivityLog, Document, User } from '../models/index.js';

export async function listRecent(req, res, next) {
  try {
    const role = req.user?.role;
    const userId = req.user?.id;
    const limitRaw = Number(req.query.limit || 20);
    const limit = Math.min(Math.max(limitRaw, 1), 100);

    const where = {
      resource_type: 'document',
      action: 'document.uploaded',
    };

    if (role !== 'lawyer') {
      where.user_id = userId;
    }

    const logs = await ActivityLog.findAll({
      where,
      order: [['created_at', 'DESC']],
      limit,
      include: [
        { model: User, as: 'user', attributes: ['id', 'full_name'] },
        {
          model: Document,
          as: 'document',
          attributes: ['id', 'title', 'source_type', 'share_scope', 'viewer_policy'],
        },
      ],
    });

    const items = logs
      .filter((log) => log.document)
      .filter((log) => {
        if (role === 'lawyer') {
          return log.document.share_scope === 'all_lawyers' && log.document.source_type === 'uploaded';
        }
        return true;
      })
      .map((log) => ({
        id: log.id,
        action: log.action,
        created_at: log.created_at,
        uploader: {
          id: log.user?.id || null,
          name: log.document?.uploader_name || log.user?.full_name || 'Unknown user',
        },
        document: {
          id: log.document.id,
          title: log.document.title,
          viewer_policy: log.document.viewer_policy,
        },
      }));

    return res.json({ success: true, data: { items } });
  } catch (err) {
    return next(err);
  }
}
