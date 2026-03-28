import Razorpay from 'razorpay';

const keyId = process.env.RAZORPAY_KEY_ID;
const keySecret = process.env.RAZORPAY_KEY_SECRET;

if (!keyId || !keySecret) {
  // Delay failure until endpoints are hit; most dev workflows don’t need Razorpay immediately.
  // eslint-disable-next-line no-console
  console.warn('[razorpay] RAZORPAY_KEY_ID/RAZORPAY_KEY_SECRET not configured');
}

export const razorpay =
  keyId && keySecret
    ? new Razorpay({
        key_id: keyId,
        key_secret: keySecret,
      })
    : null;

