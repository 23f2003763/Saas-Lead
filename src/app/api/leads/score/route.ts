import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'

// Initialize Gemini SDK
// If the key is not set, we'll gracefully fallback or error out.
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || 'MOCK_KEY')

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { source, content, prospect_username, prospect_contact } = body

    if (!content || !source) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    let score = 50
    let draft_message = `Hey ${prospect_username || 'there'},\n\nI saw your post on ${source}...`

    if (process.env.GEMINI_API_KEY) {
      try {
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })
        
        const prompt = `
        You are an expert sales AI. Review the following social media post from a prospect on ${source}.
        Prospect Username: ${prospect_username || 'Unknown'}
        Post Content: "${content}"
        
        Your SaaS product is the "Autonomous Intent-Signal Outreach Agent", which helps users automatically find leads on Reddit/X and auto-draft personalized emails.
        
        Task 1: Score the lead's intent on a scale of 0 to 100, where 100 means they desperately need a tool for automating cold outreach or finding leads.
        Task 2: Draft a short, highly personalized, casual outreach message to this prospect pitching the tool. Keep it under 4 sentences. Sign off with the sender's email: ${user.email}.
        
        Respond ONLY in the following JSON format:
        {
          "intent_score": number,
          "draft_message": "string"
        }
        `
        
        const result = await model.generateContent(prompt)
        const text = result.response.text()
        
        // Strip markdown formatting if any
        const jsonStr = text.replace(/```json\n?/g, '').replace(/```/g, '').trim()
        const aiResponse = JSON.parse(jsonStr)
        
        score = aiResponse.intent_score || 50
        draft_message = aiResponse.draft_message || draft_message
      } catch (aiError) {
        console.error('Gemini API Error:', aiError)
        // Fallback to mock logic if AI fails
        score = 65
        draft_message += '\n\n(Note: AI generation failed, using fallback message)'
      }
    } else {
      // MOCK LOGIC for when API key is missing
      const lowerContent = content.toLowerCase()
      if (lowerContent.includes('need help') || lowerContent.includes('looking for') || lowerContent.includes('tired of')) {
        score += 20
      }
      if (lowerContent.includes('lead gen') || lowerContent.includes('outreach') || lowerContent.includes('sales')) {
        score += 25
      }
      score = Math.min(score, 100)
      draft_message = `Hey ${prospect_username || 'there'},\n\nI saw your post on ${source} about "${content.substring(0, 30)}...". \n\nI built an autonomous outreach agent that might solve exactly what you're dealing with. It handles finding prospects and drafting personalized emails on autopilot.\n\nWould you be open to checking it out? Happy to give you free access to see if it works for you.\n\nCheers,\n${user.email}`
    }

    // Insert into database
    const { data: lead, error: dbError } = await supabase
      .from('leads')
      .insert({
        user_id: user.id,
        source,
        content,
        prospect_username,
        prospect_contact,
        ai_score: score,
        status: 'drafted',
        draft_message
      })
      .select()
      .single()

    if (dbError) {
      console.error('Database error:', dbError)
      return NextResponse.json({ error: 'Failed to save lead' }, { status: 500 })
    }

    return NextResponse.json({ success: true, lead })
  } catch (error) {
    console.error('Error scoring lead:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
