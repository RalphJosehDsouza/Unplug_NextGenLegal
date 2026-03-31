import { Lawyer, ActivityLog, Booking, User } from '../models/index.js';
import { razorpay } from '../services/razorpay.js';
import { Op } from 'sequelize';

export async function withdrawPayout(req, res, next) {
  try {
    const userId = req.user.id;
    
    const lawyer = await Lawyer.findOne({ where: { user_id: userId } });
    if (!lawyer) {
      return next({ statusCode: 404, message: 'Lawyer profile not found' });
    }

    if (!lawyer.razorpay_fund_account_id) {
      return next({ statusCode: 400, message: 'BankAccount missing KYC processing. Action aborted.' });
    }

    const { payout_balance_paise } = lawyer;

    // Minimum withdrawal stringently capped at ₹100
    if (payout_balance_paise < 10000) {
      return next({ statusCode: 400, message: 'Minimum withdrawal is ₹100' });
    }

    // Attempt Razorpay transaction creation
    try {
      if (!process.env.RAZORPAY_ACCOUNT_NUMBER) {
        throw new Error('Platform Bank Source Missing in Env (RAZORPAY_ACCOUNT_NUMBER)');
      }

      const payoutResp = await razorpay.payouts.create({
        account_number: process.env.RAZORPAY_ACCOUNT_NUMBER,
        fund_account_id: lawyer.razorpay_fund_account_id,
        amount: payout_balance_paise,
        currency: 'INR',
        mode: 'NEFT',
        purpose: 'payout',
        queue_if_low_balance: true
      });

      if (!payoutResp || !payoutResp.id) {
        throw new Error('Failure establishing Razorpay payout chain.');
      }
    } catch (razorerr) {
      console.error('[payoutController] withdrawal attempt failed dynamically:', razorerr);
      return next({ statusCode: 502, message: 'Payment gateway error preventing payout withdrawal. Please try again later.' });
    }

    // Success loop — empty internal wallet ledger
    lawyer.payout_balance_paise = 0;
    await lawyer.save();

    if (ActivityLog) {
      await ActivityLog.create({
        user_id: userId,
        action: 'payout_withdrawn',
        metadata: { amount_withdrawn: payout_balance_paise }
      });
    }

    return res.json({
      success: true,
      data: {
        amount_withdrawn: payout_balance_paise,
      }
    });
  } catch (err) {
    return next(err);
  }
}

export async function getPayoutHistory(req, res, next) {
  try {
    const userId = req.user.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    
    const { count, rows: logs } = await ActivityLog.findAndCountAll({
      where: {
        user_id: userId,
        action: {
          [Op.in]: ['payout_released', 'payout_withdrawn', 'payout_disputed']
        }
      },
      include: [
        {
          model: Booking,
          as: 'booking',
          required: false,
          include: [
            {
              model: User,
              as: 'user',
              attributes: ['full_name']
            }
          ]
        }
      ],
      order: [['created_at', 'DESC']],
      limit,
      offset
    });

    return res.json({
      success: true,
      data: {
        history: logs,
        total: count,
        page,
        totalPages: Math.ceil(count / limit)
      }
    });

  } catch (err) {
    return next(err);
  }
}

export async function getPayoutStats(req, res, next) {
  try {
    const userId = req.user.id;
    const lawyer = await Lawyer.findOne({ where: { user_id: userId } });
    if (!lawyer) return next({ statusCode: 404, message: 'Lawyer profile not found' });

    // Aggregate In Escrow sum
    const inEscrowSumPaise = await Booking.sum('lawyer_payout_paise', {
      where: {
        lawyer_id: lawyer.id,
        payout_status: 'in_escrow'
      }
    });

    // Aggregate Released This Month sum — use JS reduce instead of Sequelize .sum() on JSONB
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    let thisMonthSumPaise = 0;
    try {
      const releasedLogs = await ActivityLog.findAll({
        where: {
          user_id: userId,
          action: 'payout_released',
          created_at: { [Op.gte]: startOfMonth }
        },
        attributes: ['metadata'],
        raw: true,
      });

      thisMonthSumPaise = releasedLogs.reduce((sum, log) => {
        const amt = Number(log?.metadata?.amount_paise || 0);
        return sum + (Number.isFinite(amt) ? amt : 0);
      }, 0);
    } catch {
      // If metadata column doesn't exist or any other issue, default to 0
      thisMonthSumPaise = 0;
    }

    return res.json({
      success: true,
      data: {
        in_escrow_paise: Number(inEscrowSumPaise) || 0,
        this_month_released_paise: thisMonthSumPaise,
        available_balance_paise: Number(lawyer.payout_balance_paise) || 0,
      }
    });
  } catch (err) {
    return next(err);
  }
}

export async function getEarningsBookings(req, res, next) {
  try {
    const userId = req.user.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const lawyer = await Lawyer.findOne({ where: { user_id: userId } });
    if (!lawyer) return next({ statusCode: 404, message: 'Lawyer profile not found' });

    const { count, rows } = await Booking.findAndCountAll({
      where: {
        lawyer_id: lawyer.id,
        payout_status: { [Op.in]: ['in_escrow', 'released', 'disputed', 'refunded'] },
      },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'full_name'],
        },
      ],
      order: [['slot_time', 'DESC']],
      limit,
      offset,
    });

    return res.json({
      success: true,
      data: {
        bookings: rows.map((b) => ({
          id: b.id,
          slot_time: b.slot_time,
          duration_mins: b.duration_mins,
          amount_paise: b.amount_paise,
          platform_commission_paise: b.platform_commission_paise,
          lawyer_payout_paise: b.lawyer_payout_paise,
          payout_status: b.payout_status,
          client_full_name: b.user?.full_name || null,
        })),
        total: count,
        page,
        totalPages: Math.ceil(count / limit),
      },
    });
  } catch (err) {
    return next(err);
  }
}
