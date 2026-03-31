import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

import { User, Lawyer } from '../models/index.js';

function accessTokenSign(user) {
  return jwt.sign(
    {
      id: user.id,
      role: user.role,
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m' },
  );
}
function refreshTokenSign(user) {
  return jwt.sign(
    {
      id: user.id,
      role: user.role,
      tokenType: 'refresh',
    },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d' },
  );
}

function getCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    path: '/api/auth',
  };
}

function getClearCookieOptions() {
  const { maxAge, ...opts } = getCookieOptions();
  return opts;
}


export async function register(req, res, next) {
  try {
    const { email, password, full_name, phone, role, specialization, rate_per_hour } = req.body;
    const normalizedRole = role || 'citizen';

    const exists = await User.findOne({ where: { email } });
    if (exists) {
      return next({ statusCode: 409, message: 'Email already in use' });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await User.sequelize.transaction(async (tx) => {
      const createdUser = await User.create(
        {
          email,
          password_hash: passwordHash,
          full_name,
          phone: phone || null,
          role: normalizedRole,
          aadhaar_verified: false,
          preferred_lang: 'en',
          google_id: null,
        },
        { transaction: tx },
      );

      if (normalizedRole === 'lawyer') {
        const specializationArr = Array.isArray(specialization)
          ? specialization.map((s) => String(s).trim()).filter(Boolean)
          : [];

        await Lawyer.create(
          {
            user_id: createdUser.id,
            bar_council_id: `PENDING-${String(createdUser.id).slice(0, 8)}-${Date.now()}`,
            specialization: specializationArr,
            languages: [],
            state: 'Pending',
            city: 'Pending',
            rate_per_hour: Number(rate_per_hour),
            bio: null,
            verified: true,
          },
          { transaction: tx },
        );
      }

      return createdUser;
    });

    const accessToken = accessTokenSign(user);
    const refreshToken = refreshTokenSign(user);

    res.cookie('refreshToken', refreshToken, getCookieOptions());

    return res.status(201).json({
      success: true,
      data: {
        accessToken,
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          full_name: user.full_name,
          subscription_tier: user.subscription_tier || 'business',
        },
      },
    });
  } catch (err) {
    return next(err);
  }
}

export async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ where: { email } });
    if (!user) return next({ statusCode: 401, message: 'Invalid credentials' });
    if (!user.password_hash) return next({ statusCode: 401, message: 'Password auth not available for this account' });

    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) return next({ statusCode: 401, message: 'Invalid credentials' });

    const accessToken = accessTokenSign(user);
    const refreshToken = refreshTokenSign(user);
    res.cookie('refreshToken', refreshToken, getCookieOptions());

    return res.json({
      success: true,
      data: {
        accessToken,
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          full_name: user.full_name,
          subscription_tier: user.subscription_tier || 'business',
        },
      },
    });
  } catch (err) {
    return next(err);
  }
}

export async function refresh(req, res, next) {
  try {
    const { refreshToken } = req.cookies || {};
    if (!refreshToken) return next({ statusCode: 401, message: 'Missing refresh token' });

    const payload = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    if (!payload?.id || payload?.tokenType !== 'refresh') {
      return next({ statusCode: 401, message: 'Invalid refresh token' });
    }

    const user = await User.findByPk(payload.id);
    if (!user) return next({ statusCode: 401, message: 'User not found' });

    const accessToken = accessTokenSign(user);

    return res.json({ success: true, data: { accessToken } });
  } catch (err) {
    return next({ statusCode: 401, message: 'Invalid or expired refresh token' });
  }
}

export async function logout(req, res, next) {
  try {
    res.clearCookie('refreshToken', getClearCookieOptions());
    return res.json({ success: true, data: { message: 'Logged out' } });
  } catch (err) {
    return next(err);
  }
}

export async function me(req, res, next) {
  try {
    const userId = req.user?.id;
    if (!userId) return next({ statusCode: 401, message: 'Unauthorized' });

    const user = await User.findByPk(userId, {
      include: [
        { model: Lawyer, as: 'lawyer' }
      ]
    });

    if (!user) return next({ statusCode: 401, message: 'User not found' });

    let lawyerProfile = undefined;
    if (user.role === 'lawyer' && user.lawyer) {
      lawyerProfile = {
        kyc_status: user.lawyer.kyc_status,
        payout_balance_paise: user.lawyer.payout_balance_paise,
        total_earned_paise: user.lawyer.total_earned_paise,
        bank_account_verified: user.lawyer.bank_account_verified,
        commission_rate: user.lawyer.commission_rate
      };
    }

    return res.json({
      success: true,
      data: {
        id: user.id,
        email: user.email,
        role: user.role,
        full_name: user.full_name,
        subscription_tier: user.subscription_tier || 'business',
        ...(lawyerProfile && { lawyer: lawyerProfile })
      },
    });
  } catch (err) {
    return next(err);
  }
}

