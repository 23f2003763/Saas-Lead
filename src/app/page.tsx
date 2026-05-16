import { createClient } from '@/utils/supabase/server'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ArrowRight, Bot, Target, Zap } from 'lucide-react'

export default async function Home() {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()

  // If already logged in, redirect to dashboard
  if (session) {
    redirect('/dashboard')
  }

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <header className="px-6 py-4 border-b border-border/50 flex items-center justify-between glass sticky top-0 z-50">
        <div className="flex items-center gap-2 font-bold text-xl tracking-tight">
          <Bot className="w-6 h-6 text-primary" />
          <span>Intent<span className="text-primary">Agent</span></span>
        </div>
        <Link 
          href="/login" 
          className="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-full hover:bg-primary/90 transition-colors"
        >
          Sign In
        </Link>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center text-center px-6 py-24 relative overflow-hidden">
        {/* Background glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/20 rounded-full blur-[120px] pointer-events-none" />
        
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight max-w-4xl mb-6 relative z-10">
          Find clients on autopilot with <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">AI intent scoring</span>
        </h1>
        
        <p className="text-xl text-muted-foreground max-w-2xl mb-10 relative z-10">
          Stop manually searching for leads. Our autonomous agent scrapes Reddit and X, scores prospects based on purchase intent, and drafts personalized outreach.
        </p>
        
        <Link 
          href="/login" 
          className="inline-flex items-center gap-2 px-8 py-4 text-lg font-semibold bg-foreground text-background rounded-full hover:scale-105 transition-transform shadow-2xl relative z-10"
        >
          Get Started for Free <ArrowRight className="w-5 h-5" />
        </Link>

        <div className="grid md:grid-cols-3 gap-8 mt-24 max-w-5xl w-full relative z-10">
          <div className="glass p-8 rounded-2xl flex flex-col items-center text-center border border-border/50 hover:border-primary/50 transition-colors">
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
              <Target className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-xl font-bold mb-2">Intent Detection</h3>
            <p className="text-muted-foreground text-sm">Monitors social media for users explicitly asking for solutions like yours.</p>
          </div>
          <div className="glass p-8 rounded-2xl flex flex-col items-center text-center border border-border/50 hover:border-primary/50 transition-colors">
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
              <Bot className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-xl font-bold mb-2">AI Scoring & Drafting</h3>
            <p className="text-muted-foreground text-sm">Ranks leads from 0-100 and automatically drafts highly personalized DMs.</p>
          </div>
          <div className="glass p-8 rounded-2xl flex flex-col items-center text-center border border-border/50 hover:border-primary/50 transition-colors">
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
              <Zap className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-xl font-bold mb-2">Automated Outreach</h3>
            <p className="text-muted-foreground text-sm">Send your drafted messages directly to prospects with a single click.</p>
          </div>
        </div>
      </main>
    </div>
  )
}
