import 'server-only';
import Stripe from 'stripe';
import { checkoutConfig } from './config';

let stripeClient: Stripe | undefined;

export const getStripeClient = (): Stripe => {
  stripeClient ??= new Stripe(checkoutConfig.stripeSecretKey);
  return stripeClient;
};