import jwt from 'jsonwebtoken';

import { User } from '../models/index.js';

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

    // Optional: ensure the user exists (and normalized role).
    if (id) {
      const user = await User.findByPk(id, { attributes: ['id', 'role', 'full_name'] });
      if (!user) return next({ statusCode: 401, message: 'User not found' });
      req.user = { id: user.id, role: user.role, full_name: user.full_name };
    } else {
      req.user = { id, role };
    }

    return next();
  } catch (err) {
    return next({ statusCode: 401, message: 'Invalid or expired token' });
  }
}

