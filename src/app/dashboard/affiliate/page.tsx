import { createClient } from '@/utils/supabase/server'
import { DollarSign, Link as LinkIcon, Users, ArrowRight } from 'lucide-react'

export default async function AffiliateDashboard() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // In a real app, fetch from Supabase
  // const { data: affiliate } = await supabase.from('affiliates').select('*').eq('user_id', user.id).single()
  
  // Mock data for Phase 1 preview
  const mockAffiliate = {
    stripe_account_id: 'acct_123456789',
    referral_code: `REF-${user?.id?.substring(0, 8).toUpperCase() || 'ABCDEFGH'}`,
    total_referrals: 12,
    total_commissions_earned: 294.00,
    onboarded: false // Toggle to true to see dashboard
  }

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-500 max-w-5xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-1">Affiliate Program</h1>
        <p className="text-muted-foreground">Earn 50% recurring lifetime commissions for every user you refer.</p>
      </div>

      {!mockAffiliate.onboarded ? (
        <div className="glass p-8 rounded-xl border border-border flex flex-col items-center text-center max-w-2xl mx-auto mt-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-accent/10 rounded-full blur-[80px]" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-primary/10 rounded-full blur-[80px]" />
          
          <div className="w-16 h-16 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center mb-6 shadow-lg shadow-primary/20 relative z-10">
            <DollarSign className="w-8 h-8 text-white" />
          </div>
          
          <h2 className="text-2xl font-bold mb-4 relative z-10">Join the Pay-to-Earn Program</h2>
          <p className="text-muted-foreground mb-8 relative z-10">
            Connect your Stripe account to receive payouts. You'll get a unique referral link. 
            When someone signs up for the $49/mo Pro plan using your link, you earn $24.50/mo for as long as they stay subscribed.
          </p>
          
          <form action="/api/stripe/connect" method="POST" className="relative z-10">
            <button className="flex items-center gap-2 px-6 py-3 rounded-md bg-primary hover:bg-primary/90 text-primary-foreground font-medium transition-all shadow-lg hover:shadow-primary/25 hover:-translate-y-0.5">
              Connect with Stripe
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>
      ) : (
        <div className="flex flex-col gap-8">
          <div className="grid gap-6 md:grid-cols-3">
            <div className="glass p-6 rounded-xl border border-border flex flex-col gap-2">
              <span className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Users className="w-4 h-4 text-primary" />
                Active Referrals
              </span>
              <span className="text-3xl font-bold">{mockAffiliate.total_referrals}</span>
            </div>
            <div className="glass p-6 rounded-xl border border-border flex flex-col gap-2 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent pointer-events-none" />
              <span className="text-sm font-medium text-muted-foreground flex items-center gap-2 relative z-10">
                <DollarSign className="w-4 h-4 text-emerald-500" />
                Monthly Recurring Revenue
              </span>
              <span className="text-3xl font-bold text-emerald-400 relative z-10">${(mockAffiliate.total_referrals * 24.50).toFixed(2)}</span>
            </div>
            <div className="glass p-6 rounded-xl border border-border flex flex-col gap-2">
              <span className="text-sm font-medium text-muted-foreground">Total Payouts</span>
              <span className="text-3xl font-bold">${mockAffiliate.total_commissions_earned.toFixed(2)}</span>
            </div>
          </div>

          <div className="glass p-6 rounded-xl border border-border">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <LinkIcon className="w-5 h-5 text-accent" />
              Your Referral Link
            </h3>
            <div className="flex flex-col md:flex-row gap-4">
              <input 
                type="text" 
                readOnly 
                value={`https://agenticsaas.com/?ref=${mockAffiliate.referral_code}`}
                className="flex-1 bg-input/50 border border-border rounded-md px-4 py-2 font-mono text-sm text-muted-foreground focus:outline-none"
              />
              <button className="px-4 py-2 bg-secondary hover:bg-muted text-foreground font-medium rounded-md transition-colors border border-border">
                Copy Link
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
