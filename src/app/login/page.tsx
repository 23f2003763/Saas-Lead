import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function Login({
  searchParams,
}: {
  searchParams: Promise<{ message: string }>
}) {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()

  if (session) {
    redirect('/dashboard')
  }

  const awaitedSearchParams = await searchParams;

  const signIn = async (formData: FormData) => {
    'use server'

    const email = formData.get('email') as string
    const password = formData.get('password') as string
    const supabase = await createClient()

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      return redirect('/login?message=Could not authenticate user')
    }

    return redirect('/dashboard')
  }

  const signUp = async (formData: FormData) => {
    'use server'

    const email = formData.get('email') as string
    const password = formData.get('password') as string
    const supabase = await createClient()

    const { error } = await supabase.auth.signUp({
      email,
      password,
    })

    if (error) {
      return redirect('/login?message=Could not authenticate user')
    }

    return redirect('/login?message=Check email to continue sign in process')
  }

  return (
    <div className="flex-1 flex flex-col w-full px-8 sm:max-w-md justify-center gap-2 min-h-screen mx-auto">
      <Link
        href="/"
        className="absolute left-8 top-8 py-2 px-4 rounded-md no-underline text-foreground bg-secondary hover:bg-muted flex items-center group text-sm transition-all"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="mr-2 h-4 w-4 transition-transform group-hover:-translate-x-1"
        >
          <polyline points="15 18 9 12 15 6" />
        </svg>{" "}
        Back
      </Link>

      <form className="animate-in flex-1 flex flex-col w-full justify-center gap-2 text-foreground relative z-10" action={signIn}>
        <div className="glass p-8 rounded-2xl shadow-2xl flex flex-col gap-4">
          <div className="flex flex-col space-y-2 text-center mb-4">
            <h1 className="text-3xl font-semibold tracking-tight text-gradient">
              Welcome back
            </h1>
            <p className="text-sm text-muted-foreground">
              Enter your email below to log into your account
            </p>
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-sm text-muted-foreground font-medium" htmlFor="email">
              Email
            </label>
            <input
              className="rounded-md px-4 py-2 bg-input border border-border mb-4 focus:outline-none focus:ring-2 focus:ring-ring transition-all"
              name="email"
              placeholder="you@example.com"
              required
            />
            <label className="text-sm text-muted-foreground font-medium" htmlFor="password">
              Password
            </label>
            <input
              className="rounded-md px-4 py-2 bg-input border border-border mb-6 focus:outline-none focus:ring-2 focus:ring-ring transition-all"
              type="password"
              name="password"
              placeholder="••••••••"
              required
            />
          </div>
          <button className="bg-primary hover:bg-primary/90 text-primary-foreground font-medium rounded-md px-4 py-2 text-sm mb-2 transition-all">
            Sign In
          </button>
          <button
            formAction={signUp}
            className="bg-secondary hover:bg-muted text-secondary-foreground font-medium rounded-md px-4 py-2 text-sm transition-all border border-border"
          >
            Sign Up
          </button>
          {awaitedSearchParams?.message && (
            <p className="mt-4 p-4 bg-muted/50 text-foreground text-center text-sm rounded-md border border-border">
              {awaitedSearchParams.message}
            </p>
          )}
        </div>
      </form>
      
      {/* Background decoration */}
      <div className="fixed inset-0 z-0 flex items-center justify-center pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 -left-1/4 w-96 h-96 bg-primary/20 rounded-full mix-blend-screen filter blur-[100px] animate-blob" />
        <div className="absolute top-1/3 -right-1/4 w-96 h-96 bg-accent/20 rounded-full mix-blend-screen filter blur-[100px] animate-blob animation-delay-2000" />
        <div className="absolute -bottom-1/4 left-1/3 w-96 h-96 bg-primary/20 rounded-full mix-blend-screen filter blur-[100px] animate-blob animation-delay-4000" />
      </div>
    </div>
  )
}
