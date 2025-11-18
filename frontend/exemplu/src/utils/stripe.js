import { loadStripe } from '@stripe/stripe-js';

// This is your Stripe publishable key from environment variables
let stripePromise;

export const getStripe = () => {
  if (!stripePromise) {
    stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY);
  }
  return stripePromise;
};