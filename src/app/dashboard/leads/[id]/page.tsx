import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { createClient } from '@/utils/supabase/server'
import { redirect, notFound } from 'next/navigation'
import LeadDetailClient from './LeadDetailClient'

export default async function LeadDetailPage({ params }: { params: { id: string } }) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    redirect('/login')
  }

  // Fetch real lead from Supabase
  const { data: lead, error } = await supabase
    .from('leads')
    .select('*')
    .eq('id', params.id)
    .eq('user_id', user.id)
    .single()

  if (error || !lead) {
    console.error('Error fetching lead:', error)
    notFound()
  }

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-500 max-w-4xl mx-auto">
      <div>
        <Link href="/dashboard/leads" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Leads
        </Link>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight mb-1">Review Prospect</h1>
            <p className="text-muted-foreground">Analyze the intent signal and review the AI-drafted message.</p>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-xs text-muted-foreground mb-1">AI Score</span>
            <div className="flex items-center gap-2 bg-secondary/50 px-3 py-1 rounded-full border border-border">
              <span className="font-bold text-gradient text-lg">{lead.ai_score || 0}</span>
              <span className="text-muted-foreground">/100</span>
            </div>
          </div>
        </div>
      </div>

      <LeadDetailClient lead={lead} />
    </div>
  )
}
