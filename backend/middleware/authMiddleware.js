import jwt from 'jsonwebtoken';

import { Subscription, User } from '../models/index.js';

export default async function authMiddleware(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next({ statusCode: 401, message: 'Missing Authorization header' });
    }

    const token = authHeader.slice('Bearer '.length);
    const payload = jwt.verify(token, process.env.JWT_SECRET);

    const id = payload.id;
    const role = payload.role;
    let plan = payload.plan;

    if (!plan && id) {
      // Fallback if plan wasn't embedded (or token is old).
      const subscription = await Subscription.findOne({
        where: { user_id: id },
        order: [['starts_at', 'DESC']],
      });
      plan = subscription?.plan || 'freemium';
    }

    // Optional: ensure the user exists (and normalized role).
    if (id) {
      const user = await User.findByPk(id, { attributes: ['id', 'role'] });
      if (!user) return next({ statusCode: 401, message: 'User not found' });
      req.user = { id: user.id, role: user.role, plan: plan || 'freemium' };
    } else {
      req.user = { id, role, plan: plan || 'freemium' };
    }

    return next();
  } catch (err) {
    return next({ statusCode: 401, message: 'Invalid or expired token' });
  }
}

