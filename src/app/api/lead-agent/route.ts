import { NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'

type Message = { role: 'user' | 'assistant'; content: string }

const SYSTEM = `You are the AI sales concierge for Meridian Estates, a fictional Kolkata real-estate business used only for an ANS Software product demo.
Your job is to convert an enquiry into a qualified site visit without sounding robotic or pushy.

Rules:
- Be concise, natural, professional, and helpful.
- Ask one useful question at a time unless the user already provided several details.
- Capture: preferred Kolkata area, property type/BHK, budget, purchase timeline, self-use vs investment, and contact number/email.
- Never invent live inventory, exact prices, discounts, legal facts, or availability.
- You may say the demo has potential matches when the requirement looks plausible.
- Once the user clearly wants a visit AND provides a valid Indian mobile number, confirm a DEMO site visit for Saturday at 11:30 AM and say the lead record, sales summary, and WhatsApp confirmation are prepared.
- Do not claim an actual WhatsApp message was sent; this is demo mode.
- If asked what you are, say you are Meridian Estates' AI sales concierge powered by ANS Software.
- No markdown tables. Maximum 80 words.
`

function fallback(messages: Message[]) {
  const last = messages[messages.length - 1]?.content.toLowerCase() || ''
  const full = messages.filter(m => m.role === 'user').map(m => m.content).join(' ').toLowerCase()
  const hasPhone = /(?:\+?91[-\s]?)?[6-9]\d{9}/.test(full)
  const wantsBooking = /book|visit|appointment|site visit|saturday|tomorrow|yes/.test(full)
  if (hasPhone && wantsBooking) return { reply: 'Perfect. In this demo I’ve reserved Saturday at 11:30 AM, created the lead record, prepared the sales summary and queued a WhatsApp confirmation for the customer.', booked: true }
  if (/3\s*bhk|flat|apartment|villa/.test(last)) return { reply: 'Absolutely. What location, approximate budget and purchase timeline are you working with?', booked: false }
  if (/crore|lakh|budget|new town|rajarhat|salt lake/.test(last)) return { reply: 'That gives me enough to narrow the requirement. Is this for self-use or investment, and would you like to arrange a site visit this week?', booked: false }
  if (/yes|visit|book|appointment|saturday|tomorrow/.test(last)) return { reply: 'Great. I can prepare a demo site visit for Saturday at 11:30 AM. Please share a mobile number so I can create the lead and confirmation workflow.', booked: false }
  return { reply: 'I can help with that. What location, budget and type of property are you considering?', booked: false }
}

export async function POST(req: Request) {
  try {
    const { messages = [] } = (await req.json()) as { messages?: Message[] }
    if (!Array.isArray(messages) || messages.length === 0) return NextResponse.json({ error: 'messages required' }, { status: 400 })

    const key = process.env.GEMINI_API_KEY
    if (!key) return NextResponse.json(fallback(messages))

    const genAI = new GoogleGenerativeAI(key)
    const model = genAI.getGenerativeModel({ model: process.env.GEMINI_MODEL || 'gemini-2.5-flash', systemInstruction: SYSTEM })
    const history = messages.slice(0, -1).map(m => ({ role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: m.content }] }))
    const last = messages[messages.length - 1]?.content || ''
    const chat = model.startChat({ history })
    const result = await chat.sendMessage(last)
    const reply = result.response.text().trim()
    const full = messages.filter(m => m.role === 'user').map(m => m.content).join(' ').toLowerCase()
    const booked = /(?:\+?91[-\s]?)?[6-9]\d{9}/.test(full) && /book|visit|appointment|site visit|saturday|tomorrow|yes/.test(full) && /reserved|booked|11:30|confirmation/i.test(reply)
    return NextResponse.json({ reply, booked })
  } catch (error) {
    console.error('lead-agent error', error)
    return NextResponse.json({ reply: 'I can still help. What location, budget and property type are you considering?', booked: false })
  }
}
