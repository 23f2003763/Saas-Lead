import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// We use the admin client because this webhook will likely be called by a third-party service (Apify)
// and won't have the user's browser session cookies.
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://mock.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'mock_key'
)

export async function POST(request: Request) {
  try {
    // Basic API Key protection for the webhook
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.WEBHOOK_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized webhook call' }, { status: 401 })
    }

    const body = await request.json()
    
    // Support either a single lead or an array of leads
    const leads = Array.isArray(body) ? body : [body]

    if (leads.length === 0) {
      return NextResponse.json({ error: 'No leads provided' }, { status: 400 })
    }

    // Format leads for insertion
    const recordsToInsert = leads.map(lead => ({
      user_id: lead.user_id, // Required to tie to a user
      source: lead.source || 'Unknown',
      content: lead.content,
      prospect_username: lead.prospect_username,
      prospect_contact: lead.prospect_contact,
      status: 'pending' // Initial status before AI scoring
    }))

    // Validate we have user_ids
    if (recordsToInsert.some(r => !r.user_id || !r.content)) {
      return NextResponse.json({ error: 'Missing user_id or content in one or more leads' }, { status: 400 })
    }

    const { data, error } = await supabaseAdmin
      .from('leads')
      .insert(recordsToInsert)
      .select()

    if (error) {
      console.error('Webhook insert error:', error)
      return NextResponse.json({ error: 'Failed to insert leads' }, { status: 500 })
    }

    // Optionally: Here we could asynchronously trigger the AI scoring endpoint for each lead.
    // For now, they sit as 'pending' for the user to review or bulk-score in the UI.

    return NextResponse.json({ success: true, count: data.length, leads: data })
  } catch (error) {
    console.error('Webhook processing error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
