import { createClient } from '@/utils/supabase/server'
import Link from 'next/link'
import { Search, Filter } from 'lucide-react'
import { redirect } from 'next/navigation'

export default async function LeadsPage() {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    redirect('/login')
  }

  // Fetch real leads from Supabase
  const { data: leads, error } = await supabase
    .from('leads')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'pending': return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'
      case 'drafted': return 'bg-blue-500/10 text-blue-500 border-blue-500/20'
      case 'sent': return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
      case 'converted': return 'bg-purple-500/10 text-purple-500 border-purple-500/20'
      default: return 'bg-secondary text-muted-foreground border-border'
    }
  }

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-1">Leads Pipeline</h1>
          <p className="text-muted-foreground">Manage and review your AI-scored prospects.</p>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input 
              type="text" 
              placeholder="Search leads..." 
              className="pl-9 pr-4 py-2 bg-input border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring w-[250px]"
            />
          </div>
          <button className="flex items-center gap-2 px-4 py-2 border border-border rounded-md bg-secondary hover:bg-muted transition-colors text-sm font-medium">
            <Filter className="w-4 h-4" />
            Filter
          </button>
        </div>
      </div>

      <div className="glass rounded-xl overflow-hidden border border-border">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-muted-foreground uppercase bg-secondary/50 border-b border-border">
              <tr>
                <th className="px-6 py-4 font-medium">Prospect</th>
                <th className="px-6 py-4 font-medium">Intent Signal</th>
                <th className="px-6 py-4 font-medium">AI Score</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {leads && leads.length > 0 ? (
                leads.map((lead) => (
                  <tr key={lead.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors group">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-foreground">{lead.prospect_username || 'Unknown'}</div>
                      <div className="text-xs text-muted-foreground mt-1">{lead.source}</div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="truncate max-w-[300px] text-muted-foreground" title={lead.content}>
                        {lead.content}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-full bg-secondary h-2 rounded-full max-w-[60px] overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-primary to-accent" 
                            style={{ width: `${lead.ai_score || 0}%` }}
                          />
                        </div>
                        <span className="font-medium">{lead.ai_score || 0}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${getStatusColor(lead.status)} capitalize`}>
                        {lead.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link 
                        href={`/dashboard/leads/${lead.id}`}
                        className="inline-flex items-center justify-center px-3 py-1.5 text-xs font-medium bg-primary hover:bg-primary/90 text-primary-foreground rounded-md transition-colors"
                      >
                        Review
                      </Link>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-muted-foreground">
                    No leads found. Set up your Apify scraper to send leads to the webhook.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
