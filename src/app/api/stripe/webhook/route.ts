import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_mock', {
  apiVersion: '2024-04-10' as Stripe.LatestApiVersion,
})

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://mock.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'mock_key'
)

export async function POST(req: Request) {
  const body = await req.text()
  const sig = req.headers.get('stripe-signature') as string

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch (err: Error | unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: `Webhook Error: ${errorMessage}` }, { status: 400 })
  }

  // Handle the event
  switch (event.type) {
    case 'checkout.session.completed':
      const session = event.data.object as Stripe.Checkout.Session
      
      if (session.mode === 'subscription') {
        const userId = session.metadata?.userId
        const referredBy = session.metadata?.referredBy

        // Register subscription in DB
        if (userId) {
          await supabaseAdmin.from('subscriptions').insert({
            user_id: userId,
            stripe_customer_id: session.customer as string,
            stripe_subscription_id: session.subscription as string,
            status: 'active',
            referred_by: referredBy || null
          })

          // If referred by someone, increment their total_referrals
          if (referredBy) {
            const { data: affiliate } = await supabaseAdmin
              .from('affiliates')
              .select('total_referrals')
              .eq('id', referredBy)
              .single()

            if (affiliate) {
              await supabaseAdmin
                .from('affiliates')
                .update({ total_referrals: affiliate.total_referrals + 1 })
                .eq('id', referredBy)
            }
          }
        }
      }
      break
    case 'invoice.paid':
      const invoice = event.data.object as Stripe.Invoice
      // Here we would handle commission payouts for referrals.
      // E.g., lookup subscription, find referring affiliate, create a Stripe Transfer to their Connect account for 50%
      break
    default:
      console.log(`Unhandled event type ${event.type}`)
  }

  return NextResponse.json({ received: true })
}
