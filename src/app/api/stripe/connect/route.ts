import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_mock', {
  apiVersion: '2024-04-10' as any,
})

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user already has an affiliate record
    let { data: affiliate } = await supabase
      .from('affiliates')
      .select('*')
      .eq('user_id', user.id)
      .single()

    let accountId = affiliate?.stripe_account_id

    if (!accountId) {
      // Create a Stripe Connect Express account
      const account = await stripe.accounts.create({
        type: 'express',
        email: user.email,
      })
      accountId = account.id

      // Generate a simple referral code
      const referralCode = `REF-${user.id.substring(0, 8).toUpperCase()}`

      // Save to database
      const { data: newAffiliate, error } = await supabase
        .from('affiliates')
        .insert({
          user_id: user.id,
          stripe_account_id: accountId,
          referral_code: referralCode
        })
        .select()
        .single()
      
      if (error) throw error
      affiliate = newAffiliate
    }

    // Create an account link for onboarding
    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard/affiliate`,
      return_url: `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard/affiliate?onboarded=true`,
      type: 'account_onboarding',
    })

    return NextResponse.json({ url: accountLink.url })
  } catch (error) {
    console.error('Error creating connect account:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
