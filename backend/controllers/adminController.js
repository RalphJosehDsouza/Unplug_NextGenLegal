import { Booking, Lawyer, User, ActivityLog } from '../models/index.js';
import { razorpay } from '../services/razorpay.js';
import { releaseEscrow } from '../services/paymentService.js';
import { sendEmail } from '../services/notificationService.js';

export async function listDisputes(req, res, next) {
  try {
    const disputes = await Booking.findAll({
      where: { payout_status: 'disputed' },
      include: [
        { model: User, as: 'user', attributes: ['id', 'full_name', 'email'] },
        { 
          model: Lawyer, 
          as: 'lawyer', 
          include: [{ model: User, as: 'user', attributes: ['id', 'full_name', 'email'] }] 
        }
      ],
      order: [['disputed_at', 'ASC']],
    });

    return res.json({ success: true, data: { disputes } });
  } catch (err) {
    return next(err);
  }
}

export async function resolveDispute(req, res, next) {
  try {
    const { id } = req.params;
    const { decision, refund_amount_paise } = req.body; // 'release' | 'refund' | 'partial'
    
    const booking = await Booking.findByPk(id, {
      include: [
        { model: User, as: 'user' },
        { model: Lawyer, as: 'lawyer', include: ['user'] }
      ]
    });

    if (!booking) return next({ statusCode: 404, message: 'Booking not found' });
    if (booking.payout_status !== 'disputed') {
      return next({ statusCode: 400, message: 'Booking is not currently disputed' });
    }

    const clientEmail = booking.user?.email;
    const lawyerEmail = booking.lawyer?.user?.email;

    if (decision === 'release') {
      // Revert status to in_escrow temporarily so releaseEscrow works unmodified
      booking.payout_status = 'in_escrow';
      await releaseEscrow(booking); // Also handles the lawyer notification + activity logging native to releaseEscrow
      
      if (clientEmail) {
        await sendEmail(clientEmail, 'NextGenLegal: Dispute Resolution', `Your dispute for booking ${booking.id} was resolved. The funds were released to the lawyer.`);
      }

    } else if (decision === 'refund') {
      const refundResp = await razorpay.payments.refund(booking.razorpay_payment_id, {
        amount: booking.amount_paise,
        speed: 'normal'
      });

      if (booking.razorpay_transfer_id) {
        // Halt payout transfer manually, preventing Razorpay Route from transferring scheduled escrow
        await razorpay.transfers.edit(booking.razorpay_transfer_id, { on_hold: 1 });
        await razorpay.transfers.reverse(booking.razorpay_transfer_id, {
          amount: booking.lawyer_payout_paise,
        });
      }

      booking.payout_status = 'refunded';
      booking.status = 'cancelled';
      await booking.save();

      const formatRupees = Math.round(booking.amount_paise / 100);
      if (clientEmail) {
         await sendEmail(clientEmail, 'NextGenLegal: Dispute Resolved', `Your dispute was upheld. A full refund of ₹${formatRupees} has been processed and will arrive in 5-7 business days.`);
      }
      if (lawyerEmail) {
         await sendEmail(lawyerEmail, 'NextGenLegal: Dispute Resolved', `The dispute for booking ${booking.id} resulted in a client refund. No payout will be released.`);
      }

    } else if (decision === 'partial') {
      const refundAmount = Number(refund_amount_paise);
      if (!refundAmount || refundAmount >= booking.lawyer_payout_paise || refundAmount <= 0) {
        return next({ statusCode: 400, message: 'Invalid partial refund amount (must be > 0 and < lawyer remaining payout)' });
      }

      await razorpay.payments.refund(booking.razorpay_payment_id, {
        amount: refundAmount,
        speed: 'normal'
      });

      if (booking.razorpay_transfer_id) {
        // Reverse partial transfer block
        await razorpay.transfers.reverse(booking.razorpay_transfer_id, {
          amount: refundAmount,
        });

        const newLawyerPayout = booking.lawyer_payout_paise - refundAmount;
        
        // Push the mutated lawyer payout downstream and execute release
        booking.lawyer_payout_paise = newLawyerPayout;
        booking.payout_status = 'in_escrow';
        await releaseEscrow(booking);
      }

      const clientRupees = Math.round(refundAmount / 100);
      if (clientEmail) {
         await sendEmail(clientEmail, 'NextGenLegal: Dispute Resolved', `Your dispute was partially upheld. A partial refund of ₹${clientRupees} has been processed.`);
      }

      // Notify the lawyer as well (releaseEscrow will already send a generic "funds released" email).
      if (lawyerEmail) {
        const remainingRupees = Math.round((booking.lawyer_payout_paise || 0) / 100);
        await sendEmail(
          lawyerEmail,
          'NextGenLegal: Dispute Resolved',
          `Your dispute was partially upheld. A partial refund of ₹${clientRupees} was processed to the client, and the remaining ₹${remainingRupees} has been released to you.`
        );
      }

    } else {
      return next({ statusCode: 400, message: "Invalid 'decision' provided (release, refund, partial)" });
    }

    return res.json({ success: true, message: `Dispute resolved with decision: ${decision}` });
  } catch (err) {
    console.error('[adminController] Dispute Resolution fault:', err);
    return next({ statusCode: 502, message: 'Payment provider error during refund process.' });
  }
}
