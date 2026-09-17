import Razorpay from 'razorpay';

const key_id = process.env.RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
const key_secret = process.env.RAZORPAY_KEY_SECRET;

export const razorpay = key_id && key_secret
  ? new Razorpay({
      key_id,
      key_secret,
    })
  : null;
