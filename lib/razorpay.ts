import Razorpay from 'razorpay';

const getRazorpayInstance = () => {
  const env = process.env.RAZORPAY_ENV || 'test';
  
  const keyId = env === 'production' 
    ? process.env.RAZORPAY_LIVE_KEY_ID 
    : process.env.RAZORPAY_TEST_KEY_ID;
    
  const keySecret = env === 'production'
    ? process.env.RAZORPAY_LIVE_KEY_SECRET
    : process.env.RAZORPAY_TEST_KEY_SECRET;

  if (!keyId || !keySecret) {
    throw new Error('Razorpay credentials not configured');
  }

  return new Razorpay({
    key_id: keyId,
    key_secret: keySecret,
  });
};

export const razorpay = getRazorpayInstance();

export const getRazorpayKeyId = () => {
  const env = process.env.RAZORPAY_ENV || 'test';
  return env === 'production' 
    ? process.env.RAZORPAY_LIVE_KEY_ID 
    : process.env.RAZORPAY_TEST_KEY_ID;
};
