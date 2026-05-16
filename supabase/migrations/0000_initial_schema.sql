-- Create tables for Autonomous Intent-Signal Outreach Agent

-- Leads Table
CREATE TABLE public.leads (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    source TEXT NOT NULL, -- 'reddit', 'x', etc.
    content TEXT NOT NULL, -- the post or comment text
    prospect_username TEXT,
    prospect_contact TEXT,
    ai_score INTEGER CHECK (ai_score >= 0 AND ai_score <= 100),
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'drafted', 'sent', 'converted')),
    draft_message TEXT
);

-- Affiliates Table
CREATE TABLE public.affiliates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    stripe_account_id TEXT,
    referral_code TEXT UNIQUE,
    total_referrals INTEGER DEFAULT 0,
    total_commissions_earned DECIMAL DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Subscriptions Table
CREATE TABLE public.subscriptions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    stripe_customer_id TEXT,
    stripe_subscription_id TEXT,
    status TEXT,
    referred_by UUID REFERENCES public.affiliates(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS Policies
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own leads" ON public.leads FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own leads" ON public.leads FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own leads" ON public.leads FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own affiliate profile" ON public.affiliates FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can view their own subscription" ON public.subscriptions FOR SELECT USING (auth.uid() = user_id);
