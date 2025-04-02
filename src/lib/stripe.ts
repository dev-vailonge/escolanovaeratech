import { loadStripe } from '@stripe/stripe-js'
import Stripe from 'stripe'

// Client-side Stripe instance
export const getStripe = async () => {
  const stripePublicKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY

  if (!stripePublicKey) {
    console.warn('Stripe publishable key is not set')
    return null
  }

  return loadStripe(stripePublicKey)
}

// Server-side Stripe instance
const stripeSecretKey = process.env.STRIPE_SECRET_KEY

let stripe: Stripe | null = null

if (stripeSecretKey) {
  stripe = new Stripe(stripeSecretKey, {
    apiVersion: '2025-02-24.acacia',
    typescript: true,
  })
} else {
  console.warn('Stripe secret key is not set in environment variables')
}

export { stripe } 