import { Op } from 'sequelize';

import { Lawyer, User, Booking, Review } from '../models/index.js';

import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

function parseCsv(param) {
  if (!param) return [];
  if (Array.isArray(param)) return param.flatMap((p) => parseCsv(p));
  return String(param)
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

function parseIntSafe(v) {
  const n = Number(v);
  return Number.isFinite(n) ? Math.trunc(n) : undefined;
}

const s3 = new S3Client({
  region: process.env.S3_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

export async function listLawyers(req, res, next) {
  try {
    const {
      specialization,
      language,
      state,
      min_rate,
      max_rate,
      verified_only,
      sort = 'rate_asc',
      page = '1',
      limit = '12',
    } = req.query;

    const pageNum = Math.max(parseIntSafe(page) || 1, 1);
    const limitNum = Math.min(Math.max(parseIntSafe(limit) || 12, 1), 50);

    const verified = verified_only === undefined ? true : String(verified_only) !== 'false';

    const specializationArr = parseCsv(specialization);
    const languageArr = parseCsv(language);

    const where = {};
    if (verified) where.verified = true;
    if (state) where.state = String(state);

    if (specializationArr.length > 0) {
      where.specialization = { [Op.contains]: specializationArr };
    }

    if (languageArr.length > 0) {
      where.languages = { [Op.contains]: languageArr };
    }

    const minRateInt = parseIntSafe(min_rate);
    const maxRateInt = parseIntSafe(max_rate);
    if (minRateInt !== undefined || maxRateInt !== undefined) {
      where.rate_per_hour = {};
      if (minRateInt !== undefined) where.rate_per_hour[Op.gte] = minRateInt;
      if (maxRateInt !== undefined) where.rate_per_hour[Op.lte] = maxRateInt;
    }

    const offset = (pageNum - 1) * limitNum;

    const order =
      String(sort) === 'rate_desc'
        ? [['rate_per_hour', 'DESC']]
        : [['rate_per_hour', 'ASC']];

    const { count, rows } = await Lawyer.findAndCountAll({
      where,
      include: [{ model: User, as: 'user', attributes: ['full_name', 'email'] }],
      order,
      offset,
      limit: limitNum,
    });

    // Add avg rating and review count for each lawyer.
    const lawyerIds = rows.map((r) => r.id);
    let ratingByLawyer = {};
    if (lawyerIds.length > 0) {
      const result = await Lawyer.sequelize.query(
        `SELECT b.lawyer_id AS lawyer_id,
                AVG(r.rating)::float AS avg_rating,
                COUNT(r.id)::int AS review_count
         FROM bookings b
         JOIN reviews r ON r.booking_id = b.id
         WHERE b.lawyer_id = ANY(:ids)
         GROUP BY b.lawyer_id`,
        { replacements: { ids: lawyerIds } },
      );
      // eslint-disable-next-line prefer-destructuring
      const records = result[0] || result;
      ratingByLawyer = records.reduce((acc, rec) => {
        acc[rec.lawyer_id] = {
          avg_rating: rec.avg_rating ? Number(rec.avg_rating) : 0,
          review_count: rec.review_count ? Number(rec.review_count) : 0,
        };
        return acc;
      }, {});
    }

    let lawyers = rows.map((l) => {
      const rating = ratingByLawyer[l.id] || { avg_rating: 0, review_count: 0 };
      return {
        id: l.id,
        bar_council_id: l.bar_council_id,
        specialization: l.specialization,
        languages: l.languages,
        state: l.state,
        city: l.city,
        rate_per_hour: l.rate_per_hour,
        bio: l.bio,
        verified: l.verified,
        calendly_url: l.calendly_url,
        created_at: l.created_at,
        user: {
          full_name: l.user?.full_name || null,
          email: l.user?.email || null,
        },
        avg_rating: rating.avg_rating,
        review_count: rating.review_count,
      };
    });

    if (String(sort) === 'rating') {
      lawyers = lawyers.sort((a, b) => (b.avg_rating || 0) - (a.avg_rating || 0));
    }

    const pages = Math.max(Math.ceil(count / limitNum), 1);
    return res.json({
      success: true,
      data: {
        lawyers,
        total: count,
        page: pageNum,
        pages,
      },
    });
  } catch (err) {
    return next(err);
  }
}

export async function getLawyerProfile(req, res, next) {
  try {
    const lawyerId = req.params.id;

    const lawyer = await Lawyer.findByPk(lawyerId, {
      include: [{ model: User, as: 'user', attributes: ['full_name', 'email', 'phone'] }],
    });

    if (!lawyer) return next({ statusCode: 404, message: 'Lawyer not found' });

    const reviews = await Review.findAll({
      include: [
        { model: Booking, as: 'booking', where: { lawyer_id: lawyerId }, attributes: [] },
        { model: User, as: 'user', attributes: ['full_name'] },
      ],
      order: [['created_at', 'DESC']],
      limit: 10,
    });

    const summaryRows = await Lawyer.sequelize.query(
      `SELECT r.rating::int AS rating, COUNT(r.id)::int AS count
       FROM bookings b
       JOIN reviews r ON r.booking_id = b.id
       WHERE b.lawyer_id = :lawyerId
       GROUP BY r.rating
       ORDER BY r.rating DESC`,
      { replacements: { lawyerId } },
    );
    const summary = (summaryRows[0] || summaryRows || []).reduce((acc, row) => {
      acc[row.rating] = row.count;
      return acc;
    }, {});

    const avgRows = await Lawyer.sequelize.query(
      `SELECT AVG(r.rating)::float AS avg_rating, COUNT(r.id)::int AS review_count
       FROM bookings b
       JOIN reviews r ON r.booking_id = b.id
       WHERE b.lawyer_id = :lawyerId`,
      { replacements: { lawyerId } },
    );
    const avg = (avgRows[0] || [])[0] || { avg_rating: 0, review_count: 0 };

    return res.json({
      success: true,
      data: {
        lawyer: {
          id: lawyer.id,
          bar_council_id: lawyer.bar_council_id,
          specialization: lawyer.specialization,
          languages: lawyer.languages,
          state: lawyer.state,
          city: lawyer.city,
          rate_per_hour: lawyer.rate_per_hour,
          bio: lawyer.bio,
          verified: lawyer.verified,
          calendly_url: lawyer.calendly_url,
          created_at: lawyer.created_at,
          user: {
            full_name: lawyer.user?.full_name || null,
            email: lawyer.user?.email || null,
            phone: lawyer.user?.phone || null,
          },
          working_hours: lawyer.working_hours || {},
        },
        reviews: reviews.map((r) => ({
          id: r.id,
          rating: r.rating,
          comment: r.comment,
          created_at: r.created_at,
          user: { full_name: r.user?.full_name || null },
        })),
        rating_summary: summary,
        avg_rating: avg.avg_rating ? Number(avg.avg_rating) : 0,
        review_count: avg.review_count ? Number(avg.review_count) : 0,
      },
    });
  } catch (err) {
    return next(err);
  }
}

export async function getLawyerSlots(req, res, next) {
  try {
    const lawyerId = req.params.id;
    const lawyer = await Lawyer.findByPk(lawyerId);
    if (!lawyer) return next({ statusCode: 404, message: 'Lawyer not found' });

    const working = lawyer.working_hours || {};
    const daysKeys = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];

    function getISTParts(d) {
      const parts = new Intl.DateTimeFormat('en-US', {
        timeZone: 'Asia/Kolkata',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      }).formatToParts(d);
      const p = {};
      for (const part of parts) {
        if (part.type !== 'literal') p[part.type] = part.value;
      }
      return { year: Number(p.year), month: Number(p.month), day: Number(p.day) };
    }

    const now = new Date();
    const todayParts = getISTParts(now);
    const offsetMs = 5.5 * 60 * 60 * 1000;

    const slots = [];
    const baseYear = todayParts.year;
    const baseMonth = todayParts.month - 1;
    const baseDay = todayParts.day;

    for (let i = 0; i < 14; i++) {
      // Use IST-correct day-of-week by sampling a time safely within the day (12:00 IST).
      const dayDate = new Date(Date.UTC(baseYear, baseMonth, baseDay + i, 12, 0, 0) - offsetMs);
      const jsDay = dayDate.getUTCDay(); // 0..6
      const key = daysKeys[jsDay];

      const times = Array.isArray(working[key]) ? working[key] : [];
      for (const t of times) {
        const [hhStr, mmStr] = String(t).split(':');
        const hh = Number(hhStr);
        const mm = Number(mmStr) || 0;
        if (!Number.isFinite(hh)) continue;

        const slotDate = new Date(Date.UTC(baseYear, baseMonth, baseDay + i, hh, mm, 0) - offsetMs);
        slots.push(slotDate.toISOString());
      }
    }

    const slotMs = slots.map((s) => new Date(s).getTime());
    const start = Math.min(...slotMs);
    const end = Math.max(...slotMs) + 60 * 60 * 1000;

    const booked = await Booking.findAll({
      where: {
        lawyer_id: lawyerId,
        slot_time: {
          [Op.gte]: new Date(start),
          [Op.lt]: new Date(end),
        },
        status: { [Op.ne]: 'cancelled' },
      },
      attributes: ['slot_time'],
    });

    const bookedSet = new Set(booked.map((b) => new Date(b.slot_time).toISOString()));
    const availableSlots = slots.filter((s) => !bookedSet.has(s));

    return res.json({
      success: true,
      data: {
        slots: availableSlots,
      },
    });
  } catch (err) {
    return next(err);
  }
}

export async function registerLawyer(req, res, next) {
  try {
    const userId = req.user.id;
    if (req.user.role !== 'lawyer') {
      return next({ statusCode: 403, message: 'Only lawyers can register' });
    }

    const {
      bar_council_id,
      specialization,
      languages,
      state,
      city,
      rate_per_hour,
      bio,
      calendly_url,
      working_hours,
    } = req.body;

    const file = req.file;
    if (!file) return next({ statusCode: 400, message: 'bar_council_image is required' });

    const s3Key = `lawyers/${userId}/bar-council/${Date.now()}-${file.originalname}`;

    await s3.send(
      new PutObjectCommand({
        Bucket: process.env.S3_BUCKET,
        Key: s3Key,
        Body: file.buffer,
        ContentType: file.mimetype || 'application/octet-stream',
      }),
    );

      // working_hours might be sent as JSON string from multipart clients.
      let workingHoursParsed = working_hours;
      if (typeof working_hours === 'string') {
        try {
          workingHoursParsed = JSON.parse(working_hours);
        } catch {
          workingHoursParsed = {};
        }
      }

      const lawyer = await Lawyer.create({
      user_id: userId,
      bar_council_id,
        specialization: Array.isArray(specialization)
          ? specialization
          : specialization
            ? String(specialization).split(',').map((s) => s.trim()).filter(Boolean)
            : [],
        languages: Array.isArray(languages)
          ? languages
          : languages
            ? String(languages).split(',').map((s) => s.trim()).filter(Boolean)
            : [],
      state,
      city,
      rate_per_hour: rate_per_hour ? Number(rate_per_hour) : null,
      bio: bio || null,
      verified: false,
      calendly_url: calendly_url || null,
      bar_council_image_s3_key: s3Key,
        working_hours: workingHoursParsed || {},
    });

    return res.status(201).json({
      success: true,
      data: {
        lawyer_id: lawyer.id,
      },
    });
  } catch (err) {
    return next(err);
  }
}

