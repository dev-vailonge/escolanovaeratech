'use client'

import { getStripe } from '@/lib/stripe'

export function useStripeCheckout() {
  const handleCheckout = async (priceId: string) => {
    try {
      const stripe = await getStripe()
      if (!stripe) {
        console.warn('Stripe is not configured')
        return
      }

      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ priceId }),
      })

      const { sessionId } = await response.json()

      const { error } = await stripe.redirectToCheckout({ sessionId })
      if (error) {
        throw error
      }
    } catch (error) {
      console.error('Error:', error)
      throw error
    }
  }

  return {
    handleCheckout,
  }
} 