'use client'

import { FormEvent, useMemo, useRef, useState } from 'react'
import { Activity, Bot, CalendarCheck, CheckCircle2, CircleDollarSign, Database, Gauge, MessageCircle, RefreshCcw, Send, Sparkles, UserRoundCheck, Users, Zap } from 'lucide-react'

type Message = { role: 'user' | 'assistant'; content: string }
type Lead = {
  name?: string
  phone?: string
  email?: string
  city?: string
  budget?: string
  propertyType?: string
  bedrooms?: string
  timeline?: string
  preferredSlot?: string
}
type Action = { label: string; detail: string; done: boolean }

const intro: Message = {
  role: 'assistant',
  content: "Hi — I’m the AI sales concierge for Meridian Estates. Tell me what you're looking for and I’ll help you shortlist, qualify your requirement and book a site visit.",
}

function extractLead(messages: Message[]): Lead {
  const text = messages.filter(m => m.role === 'user').map(m => m.content).join(' ')
  const lead: Lead = {}
  const phone = text.match(/(?:\+?91[-\s]?)?[6-9]\d{9}/)
  const email = text.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)
  const budget = text.match(/(?:₹|rs\.?|inr)?\s*([0-9.]+)\s*(cr|crore|lakh|lac|l)/i)
  const bhk = text.match(/\b([1-6])\s*bhk\b/i)
  if (phone) lead.phone = phone[0]
  if (email) lead.email = email[0]
  if (budget) lead.budget = budget[0]
  if (bhk) lead.bedrooms = `${bhk[1]} BHK`
  if (/kolkata|new town|rajarhat|salt lake/i.test(text)) lead.city = /new town/i.test(text) ? 'New Town, Kolkata' : 'Kolkata'
  if (/flat|apartment/i.test(text)) lead.propertyType = 'Apartment'
  if (/villa/i.test(text)) lead.propertyType = 'Villa'
  if (/week|month|immediately|urgent|soon|days/i.test(text)) lead.timeline = 'Near-term intent'
  return lead
}

function scoreLead(lead: Lead, count: number) {
  let score = 24 + Math.min(count * 7, 21)
  if (lead.phone || lead.email) score += 18
  if (lead.budget) score += 14
  if (lead.bedrooms) score += 8
  if (lead.city) score += 8
  if (lead.timeline) score += 7
  return Math.min(score, 98)
}

export default function LeadAgentDemo() {
  const [messages, setMessages] = useState<Message[]>([intro])
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const [booked, setBooked] = useState(false)
  const endRef = useRef<HTMLDivElement>(null)
  const lead = useMemo(() => extractLead(messages), [messages])
  const userCount = messages.filter(m => m.role === 'user').length
  const score = scoreLead(lead, userCount)
  const hot = score >= 72

  const actions: Action[] = [
    { label: 'Lead captured', detail: lead.phone || lead.email || userCount > 0 ? 'Contact record created' : 'Waiting for first message', done: userCount > 0 },
    { label: 'Requirement qualified', detail: lead.budget || lead.bedrooms ? 'Intent and fit detected' : 'Gathering budget + requirement', done: Boolean(lead.budget || lead.bedrooms) },
    { label: 'CRM synchronized', detail: hot ? 'Lead + summary pushed to CRM' : 'Triggers at qualified stage', done: hot },
    { label: 'Sales rep alerted', detail: hot ? 'Hot-lead alert prepared' : 'No alert yet', done: hot },
    { label: 'WhatsApp follow-up', detail: booked ? 'Confirmation queued' : 'Ready after consent / booking', done: booked },
    { label: 'Site visit booked', detail: booked ? 'Saturday · 11:30 AM' : 'Waiting for customer confirmation', done: booked },
  ]

  async function sendMessage(e: FormEvent) {
    e.preventDefault()
    const value = input.trim()
    if (!value || busy) return
    const next = [...messages, { role: 'user' as const, content: value }]
    setMessages(next)
    setInput('')
    setBusy(true)

    try {
      const res = await fetch('/api/lead-agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: next }),
      })
      const data = await res.json()
      setMessages(m => [...m, { role: 'assistant', content: data.reply || 'I can help with that. What budget and preferred location should I work with?' }])
      if (data.booked) setBooked(true)
    } catch {
      setMessages(m => [...m, { role: 'assistant', content: fallbackReply(next) }])
    } finally {
      setBusy(false)
      setTimeout(() => endRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)
    }
  }

  function reset() {
    setMessages([intro])
    setBooked(false)
    setInput('')
  }

  return (
    <main className="min-h-screen bg-[#07111f] text-slate-100">
      <div className="mx-auto max-w-[1500px] px-4 py-5 md:px-8 md:py-8">
        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-xs font-semibold text-cyan-200">
              <Sparkles className="h-3.5 w-3.5" /> ANS Lead Agent · Buyer Demo
            </div>
            <h1 className="max-w-4xl text-3xl font-semibold tracking-tight md:text-5xl">Turn enquiries into <span className="text-cyan-300">booked revenue</span>, automatically.</h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-400 md:text-base">This demo shows the complete customer journey: conversation → qualification → lead score → CRM → salesperson alert → WhatsApp follow-up → appointment.</p>
          </div>
          <button onClick={reset} className="inline-flex w-fit items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-300 hover:bg-white/10"><RefreshCcw className="h-4 w-4" /> Reset demo</button>
        </div>

        <section className="grid gap-4 xl:grid-cols-[1.2fr_.8fr]">
          <div className="overflow-hidden rounded-3xl border border-white/10 bg-[#0a1727] shadow-2xl shadow-black/20">
            <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
              <div className="flex items-center gap-3"><div className="grid h-10 w-10 place-items-center rounded-xl bg-cyan-400/10 text-cyan-300"><Bot className="h-5 w-5" /></div><div><div className="font-semibold">Meridian Estates AI Concierge</div><div className="flex items-center gap-2 text-xs text-emerald-300"><span className="h-2 w-2 rounded-full bg-emerald-400" /> online · replies instantly</div></div></div>
              <div className="hidden rounded-full bg-white/5 px-3 py-1 text-xs text-slate-400 sm:block">Demo business · Kolkata</div>
            </div>

            <div className="h-[520px] overflow-y-auto p-5 md:p-7">
              <div className="mx-auto max-w-3xl space-y-4">
                {messages.map((m, i) => (
                  <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[86%] rounded-2xl px-4 py-3 text-sm leading-6 ${m.role === 'user' ? 'rounded-br-md bg-cyan-300 text-slate-950' : 'rounded-bl-md border border-white/10 bg-white/[0.055] text-slate-200'}`}>{m.content}</div>
                  </div>
                ))}
                {busy && <div className="flex justify-start"><div className="rounded-2xl rounded-bl-md border border-white/10 bg-white/[0.055] px-4 py-3 text-sm text-slate-400">Thinking…</div></div>}
                <div ref={endRef} />
              </div>
            </div>

            <div className="border-t border-white/10 p-4 md:p-5">
              <form onSubmit={sendMessage} className="mx-auto flex max-w-3xl gap-2 rounded-2xl border border-white/10 bg-[#081321] p-2 focus-within:border-cyan-400/40">
                <input value={input} onChange={e => setInput(e.target.value)} placeholder="Try: I need a 3 BHK in New Town around ₹1.5 crore…" className="min-w-0 flex-1 bg-transparent px-3 py-2 text-sm outline-none placeholder:text-slate-600" />
                <button disabled={busy} className="grid h-10 w-10 place-items-center rounded-xl bg-cyan-300 text-slate-950 disabled:opacity-50"><Send className="h-4 w-4" /></button>
              </form>
              <div className="mx-auto mt-2 max-w-3xl text-center text-[11px] text-slate-600">Demo conversations use synthetic data. Production integrations run under client-approved permissions.</div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <Metric icon={<Gauge className="h-4 w-4" />} label="Lead score" value={`${score}/100`} note={hot ? 'HOT' : score >= 50 ? 'WARM' : 'DISCOVERY'} />
              <Metric icon={<CircleDollarSign className="h-4 w-4" />} label="Revenue intent" value={lead.budget || 'Detecting'} note="from conversation" />
              <Metric icon={<Zap className="h-4 w-4" />} label="Response" value="< 10 sec" note="24/7 coverage" />
              <Metric icon={<Users className="h-4 w-4" />} label="Human effort" value={hot ? 'Handoff' : '0 min'} note={hot ? 'qualified lead only' : 'AI handling'} />
            </div>

            <div className="rounded-3xl border border-white/10 bg-[#0a1727] p-5">
              <div className="mb-4 flex items-center justify-between"><div><div className="text-sm font-semibold">Live lead record</div><div className="mt-1 text-xs text-slate-500">Structured automatically from chat</div></div><Database className="h-5 w-5 text-cyan-300" /></div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
                <Field label="Location" value={lead.city} />
                <Field label="Requirement" value={lead.bedrooms || lead.propertyType} />
                <Field label="Budget" value={lead.budget} />
                <Field label="Timeline" value={lead.timeline} />
                <Field label="Phone" value={lead.phone} />
                <Field label="Email" value={lead.email} />
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-[#0a1727] p-5">
              <div className="mb-4 flex items-center justify-between"><div><div className="text-sm font-semibold">Agent activity</div><div className="mt-1 text-xs text-slate-500">What the business sees happening behind the chat</div></div><Activity className="h-5 w-5 text-cyan-300" /></div>
              <div className="space-y-3">
                {actions.map(a => <div key={a.label} className="flex items-start gap-3"><div className={`mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-lg ${a.done ? 'bg-emerald-400/10 text-emerald-300' : 'bg-white/5 text-slate-600'}`}>{a.done ? <CheckCircle2 className="h-4 w-4" /> : <span className="h-1.5 w-1.5 rounded-full bg-current" />}</div><div><div className={`text-sm ${a.done ? 'text-slate-200' : 'text-slate-500'}`}>{a.label}</div><div className="text-xs text-slate-600">{a.detail}</div></div></div>)}
              </div>
            </div>

            <div className="rounded-3xl border border-cyan-400/20 bg-cyan-400/[0.06] p-5">
              <div className="flex items-start gap-3"><UserRoundCheck className="mt-0.5 h-5 w-5 text-cyan-300" /><div><div className="text-sm font-semibold">The USP</div><p className="mt-1 text-xs leading-5 text-slate-400">Not “another chatbot.” ANS recovers enquiries, understands intent, qualifies fit, books the next step and gives salespeople a clean summary only when human attention is worth it.</p></div></div>
            </div>
          </div>
        </section>

        <section className="mt-4 grid gap-3 md:grid-cols-3">
          <Proof icon={<MessageCircle className="h-5 w-5" />} title="Recover lost leads" text="Respond immediately when the office is closed or the sales team is busy." />
          <Proof icon={<CalendarCheck className="h-5 w-5" />} title="Book, don't just chat" text="Move qualified prospects to a real appointment instead of another contact form." />
          <Proof icon={<Database className="h-5 w-5" />} title="Integrate with the stack" text="Calendar, CRM, WhatsApp and internal alerts are connectors — the customer does not replace their system." />
        </section>
      </div>
    </main>
  )
}

function fallbackReply(messages: Message[]) {
  const last = messages[messages.length - 1]?.content.toLowerCase() || ''
  if (/3\s*bhk|flat|apartment|villa/.test(last)) return 'Absolutely. I can narrow this down quickly. What location, approximate budget and purchase timeline are you working with?'
  if (/crore|lakh|budget|new town|rajarhat/.test(last)) return 'That fits several options in our current demo inventory. Are you buying for self-use or investment, and would you like me to arrange a site visit this week?'
  if (/yes|visit|book|appointment|saturday|tomorrow/.test(last)) return 'Great — I can reserve Saturday at 11:30 AM. Please share a mobile number so I can create the visit and send the confirmation.'
  if (/[6-9]\d{9}/.test(last)) return 'Done. I’ve created the lead record, prepared the sales summary and reserved Saturday at 11:30 AM. A confirmation will be sent on WhatsApp.'
  return 'I can help with that. What location, budget and type of property are you considering?'
}

function Metric({ icon, label, value, note }: { icon: React.ReactNode; label: string; value: string; note: string }) {
  return <div className="rounded-2xl border border-white/10 bg-[#0a1727] p-4"><div className="mb-3 flex items-center gap-2 text-xs text-slate-500">{icon}{label}</div><div className="truncate text-lg font-semibold text-slate-100">{value}</div><div className="mt-1 text-[11px] uppercase tracking-wider text-slate-600">{note}</div></div>
}

function Field({ label, value }: { label: string; value?: string }) {
  return <div><div className="text-[10px] uppercase tracking-widest text-slate-600">{label}</div><div className={`mt-1 truncate ${value ? 'text-slate-300' : 'text-slate-600'}`}>{value || 'Not captured yet'}</div></div>
}

function Proof({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
  return <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-5"><div className="mb-3 text-cyan-300">{icon}</div><div className="font-semibold">{title}</div><p className="mt-2 text-sm leading-6 text-slate-500">{text}</p></div>
}
