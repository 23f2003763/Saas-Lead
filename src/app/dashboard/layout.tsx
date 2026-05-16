import Link from 'next/link'
import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { LayoutDashboard, Users, UserPlus, LogOut } from 'lucide-react'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const signOut = async () => {
    'use server'
    const supabase = await createClient()
    await supabase.auth.signOut()
    redirect('/login')
  }

  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 border-r border-border glass hidden md:flex flex-col relative z-20">
        <div className="h-16 flex items-center px-6 border-b border-border">
          <span className="font-bold text-lg text-gradient">AgenticSaaS</span>
        </div>
        
        <nav className="flex-1 py-6 px-3 flex flex-col gap-1 overflow-y-auto">
          <Link href="/dashboard" className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-muted text-sm font-medium transition-colors">
            <LayoutDashboard className="w-4 h-4 text-primary" />
            Overview
          </Link>
          <Link href="/dashboard/leads" className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-muted text-sm font-medium transition-colors">
            <Users className="w-4 h-4 text-accent" />
            Leads pipeline
          </Link>
          <Link href="/dashboard/affiliate" className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-muted text-sm font-medium transition-colors">
            <UserPlus className="w-4 h-4 text-primary" />
            Affiliate Program
          </Link>
        </nav>

        <div className="p-4 border-t border-border">
          <div className="flex items-center gap-3 mb-4 px-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-primary to-accent flex items-center justify-center text-xs font-bold text-white shadow-lg">
              {user.email?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div className="flex flex-col overflow-hidden">
              <span className="text-sm font-medium truncate">{user.email}</span>
              <span className="text-xs text-muted-foreground">Pro Plan</span>
            </div>
          </div>
          <form action={signOut}>
            <button className="flex w-full items-center gap-3 px-3 py-2 rounded-md hover:bg-destructive/10 hover:text-red-500 text-sm font-medium transition-colors">
              <LogOut className="w-4 h-4" />
              Sign out
            </button>
          </form>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto relative z-10">
        <div className="container mx-auto p-6 md:p-8 max-w-6xl">
          {children}
        </div>
        
        {/* Background ambient light */}
        <div className="fixed inset-0 pointer-events-none z-[-1] overflow-hidden">
          <div className="absolute -top-[10%] -right-[5%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[120px] mix-blend-screen" />
          <div className="absolute bottom-[10%] -left-[10%] w-[50%] h-[50%] bg-accent/10 rounded-full blur-[120px] mix-blend-screen" />
        </div>
      </main>
    </div>
  )
}
