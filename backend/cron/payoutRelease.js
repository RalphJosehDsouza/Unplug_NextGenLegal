import { CronJob } from 'cron';
import { Op } from 'sequelize';
import { Booking } from '../models/index.js';
import { releaseEscrow } from '../services/paymentService.js';

async function autoReleaseEscrows() {
  try {
    const twentySixHoursAgo = new Date(Date.now() - 26 * 60 * 60 * 1000);

    const pendingBookings = await Booking.findAll({
      where: {
        payout_status: 'in_escrow',
        slot_time: {
          [Op.lt]: twentySixHoursAgo,
        },
        disputed_at: null,
      },
    });

    for (const booking of pendingBookings) {
      if (!booking.consultation_confirmed_client || !booking.consultation_confirmed_lawyer) {
        try {
          // Both parties haven't explicitly confirmed but the timeline surpassed 26 hours without a dispute. Release it.
          await releaseEscrow(booking);
          console.log(`[autoReleaseEscrows] Auto-released escrow for booking ${booking.id} after 26hr timeout.`);
        } catch (err) {
          console.error(`[autoReleaseEscrows] Failed to auto-release booking ${booking.id}:`, err);
        }
      }
    }
  } catch (err) {
    console.error('[autoReleaseEscrows] Cron failure:', err);
  }
}

export function startPayoutReleaseCron() {
  // Run every 2 hours: '0 */2 * * *'
  const job = new CronJob('0 */2 * * *', autoReleaseEscrows, null, true, 'Asia/Kolkata');
  job.start();
  console.log('[cron] PayoutRelease scheduler initiated (Asia/Kolkata)');
}
