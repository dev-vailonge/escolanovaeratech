import { NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { headers } from 'next/headers'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { priceId } = body

    const headersList = await headers()
    const origin = headersList.get('origin') || process.env.NEXT_PUBLIC_APP_URL

    if (!priceId) {
      return new NextResponse('Price ID is required', { status: 400 })
    }

    // Create Checkout Sessions from body params.
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${origin}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/pricing`,
    })

    return NextResponse.json({ sessionId: session.id })
  } catch (err) {
    console.error('Error:', err)
    return new NextResponse('Internal Error', { status: 500 })
  }
} 