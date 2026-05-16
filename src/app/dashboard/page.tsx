import { createClient } from '@/utils/supabase/server'
import { Activity, MousePointerClick, TrendingUp, Users } from 'lucide-react'
import Link from 'next/link'
import { redirect } from 'next/navigation'

export default async function DashboardOverview() {
  const supabase = await createClient()
  
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    redirect('/login')
  }

  // Fetch real statistics
  const { count: totalLeads } = await supabase
    .from('leads')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)

  const { count: draftsGenerated } = await supabase
    .from('leads')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .neq('draft_message', null)

  const { count: outreachSent } = await supabase
    .from('leads')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('status', 'sent')

  const { count: converted } = await supabase
    .from('leads')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('status', 'converted')

  const conversionRate = outreachSent && outreachSent > 0 
    ? ((converted || 0) / outreachSent * 100).toFixed(1) 
    : '0.0'

  const stats = [
    { name: 'Total Leads Found', value: totalLeads || 0, change: '--', icon: Users },
    { name: 'AI Drafts Generated', value: draftsGenerated || 0, change: '--', icon: Activity },
    { name: 'Outreach Sent', value: outreachSent || 0, change: '--', icon: MousePointerClick },
    { name: 'Conversion Rate', value: `${conversionRate}%`, change: '--', icon: TrendingUp },
  ]

  // Fetch recent high intent leads
  const { data: recentLeads } = await supabase
    .from('leads')
    .select('*')
    .eq('user_id', user.id)
    .order('ai_score', { ascending: false })
    .limit(5)

  return (
    <div className="flex flex-col gap-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-2">Overview</h1>
        <p className="text-muted-foreground">Welcome to your Autonomous Outreach Agent. Here's what's happening.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, i) => {
          const Icon = stat.icon
          return (
            <div key={i} className="glass p-6 rounded-xl flex flex-col gap-4 relative overflow-hidden group">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">{stat.name}</span>
                <Icon className="w-4 h-4 text-primary opacity-70 group-hover:opacity-100 transition-opacity" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold">{stat.value}</span>
                <span className="text-xs font-medium text-emerald-400">{stat.change}</span>
              </div>
              
              {/* Subtle hover effect */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
            </div>
          )
        })}
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        <div className="glass p-6 rounded-xl lg:col-span-4 flex flex-col min-h-[400px]">
          <h2 className="text-lg font-semibold mb-4">Outreach Activity</h2>
          <div className="flex-1 flex items-center justify-center border border-dashed border-border rounded-lg bg-background/50">
            <p className="text-muted-foreground text-sm">Activity Chart Placeholder</p>
          </div>
        </div>
        
        <div className="glass p-6 rounded-xl lg:col-span-3 flex flex-col">
          <h2 className="text-lg font-semibold mb-4">Recent High-Intent Leads</h2>
          <div className="flex-1 space-y-4">
            {recentLeads && recentLeads.length > 0 ? (
              recentLeads.map((lead) => (
                <div key={lead.id} className="flex items-center gap-4 p-3 rounded-lg hover:bg-muted/50 transition-colors border border-transparent hover:border-border">
                  <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-primary font-bold text-sm shadow-inner">
                    {lead.ai_score || 0}
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <p className="text-sm font-medium truncate">{lead.content}</p>
                    <p className="text-xs text-muted-foreground">Source: {lead.source} • {new Date(lead.created_at).toLocaleDateString()}</p>
                  </div>
                  <Link href={`/dashboard/leads/${lead.id}`} className="px-3 py-1 text-xs font-medium bg-primary/10 text-primary rounded-full hover:bg-primary/20 transition-colors">
                    View
                  </Link>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground text-sm">
                No leads found. Waiting for data ingestion.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
