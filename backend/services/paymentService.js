import { Booking, Lawyer, ActivityLog } from '../models/index.js';
import { razorpay } from './razorpay.js';
import { sendEmail } from './notificationService.js';

export async function releaseEscrow(booking) {
  try {
    if (booking.payout_status !== 'in_escrow') {
      return { success: false, message: 'Payout is not in escrow status' };
    }

    if (!booking.razorpay_transfer_id) {
       console.error('[releaseEscrow] Missing razorpay_transfer_id for booking:', booking.id);
       return { success: false, message: 'Transfer ID missing' };
    }

    // Call Razorpay API to release the held transfer
    await razorpay.transfers.edit(booking.razorpay_transfer_id, {
      on_hold: 0
    });

    // Update booking state
    booking.payout_status = 'released';
    booking.confirmed_at = new Date();
    booking.status = 'completed';
    await booking.save();

    // Update lawyer balance
    const lawyer = await Lawyer.findByPk(booking.lawyer_id, { include: ['user'] });
    if (lawyer) {
      lawyer.payout_balance_paise = (lawyer.payout_balance_paise || 0) + booking.lawyer_payout_paise;
      await lawyer.save();

      // Log to ActivityLog
      if (ActivityLog) {
        await ActivityLog.create({
          user_id: lawyer.user_id,
          action: 'payout_released',
          resource_id: booking.id,
          metadata: { amount_paise: booking.lawyer_payout_paise }
        });
      }

      // Notification
      const amountRupees = Math.round(booking.lawyer_payout_paise / 100);
      if (typeof sendEmail === 'function' && lawyer.user?.email) {
        await sendEmail(
          lawyer.user.email,
          'NextGenLegal: Funds Released',
          `₹${amountRupees} has been released to your account for booking ${booking.id}.`
        );
      }
    }

    return { success: true };
  } catch (err) {
    console.error('[releaseEscrow] Error:', err);
    throw err;
  }
}
