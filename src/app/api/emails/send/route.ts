import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { Resend } from 'resend'

// Initialize Resend
const resend = new Resend(process.env.RESEND_API_KEY || 're_mock_key')

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { lead_id, to_email, subject, message } = body

    if (!lead_id || !to_email || !message) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Verify the lead belongs to the user
    const { data: lead, error: leadError } = await supabase
      .from('leads')
      .select('id, status')
      .eq('id', lead_id)
      .eq('user_id', user.id)
      .single()

    if (leadError || !lead) {
      return NextResponse.json({ error: 'Lead not found or unauthorized' }, { status: 404 })
    }

    let emailResult = { id: 'mock_email_id' }

    if (process.env.RESEND_API_KEY) {
      try {
        const { data, error } = await resend.emails.send({
          from: 'Outreach Agent <onboarding@resend.dev>', // In production, use your verified domain
          to: [to_email],
          subject: subject || 'Exploring a potential fit',
          text: message,
          replyTo: user.email // Replies go back to the user
        })

        if (error) {
          console.error('Resend API Error:', error)
          return NextResponse.json({ error: 'Failed to send email' }, { status: 500 })
        }
        
        if (data) {
          emailResult = { id: data.id }
        }
      } catch (e) {
        console.error('Email sending failed:', e)
        return NextResponse.json({ error: 'Internal email service error' }, { status: 500 })
      }
    } else {
      console.log('MOCK EMAIL SEND:', { to: to_email, message })
    }

    // Update lead status to 'sent'
    const { error: updateError } = await supabase
      .from('leads')
      .update({ status: 'sent', draft_message: message }) // save the final message sent
      .eq('id', lead_id)

    if (updateError) {
      console.error('Failed to update lead status:', updateError)
      // Even though email sent, DB update failed
    }

    return NextResponse.json({ success: true, email_id: emailResult.id })
  } catch (error) {
    console.error('Email route error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
