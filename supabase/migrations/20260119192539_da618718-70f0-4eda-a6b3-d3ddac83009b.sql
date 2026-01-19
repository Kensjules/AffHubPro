-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  email TEXT NOT NULL,
  timezone TEXT DEFAULT 'America/New_York',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles RLS policies
CREATE POLICY "Users can view their own profile"
ON public.profiles FOR SELECT
USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
ON public.profiles FOR UPDATE
USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
ON public.profiles FOR INSERT
WITH CHECK (auth.uid() = id);

-- Create shareasale_accounts table
CREATE TABLE public.shareasale_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  merchant_id TEXT NOT NULL,
  api_token_encrypted TEXT NOT NULL,
  api_secret_encrypted TEXT NOT NULL,
  is_connected BOOLEAN DEFAULT false,
  last_sync_at TIMESTAMPTZ,
  sync_status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Enable RLS on shareasale_accounts
ALTER TABLE public.shareasale_accounts ENABLE ROW LEVEL SECURITY;

-- ShareASale accounts RLS policies
CREATE POLICY "Users can view their own shareasale account"
ON public.shareasale_accounts FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own shareasale account"
ON public.shareasale_accounts FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own shareasale account"
ON public.shareasale_accounts FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own shareasale account"
ON public.shareasale_accounts FOR DELETE
USING (auth.uid() = user_id);

-- Create transactions_cache table
CREATE TABLE public.transactions_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  shareasale_account_id UUID REFERENCES public.shareasale_accounts(id) ON DELETE CASCADE NOT NULL,
  transaction_id TEXT NOT NULL,
  merchant_name TEXT,
  amount DECIMAL(10,2) NOT NULL,
  commission DECIMAL(10,2),
  clicks INTEGER DEFAULT 0,
  status TEXT NOT NULL,
  transaction_date TIMESTAMPTZ NOT NULL,
  click_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(shareasale_account_id, transaction_id)
);

-- Enable RLS on transactions_cache
ALTER TABLE public.transactions_cache ENABLE ROW LEVEL SECURITY;

-- Transactions cache RLS policies
CREATE POLICY "Users can view their own transactions"
ON public.transactions_cache FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own transactions"
ON public.transactions_cache FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own transactions"
ON public.transactions_cache FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own transactions"
ON public.transactions_cache FOR DELETE
USING (auth.uid() = user_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Add triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_shareasale_accounts_updated_at
  BEFORE UPDATE ON public.shareasale_accounts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to handle new user signup (auto-create profile)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger to create profile on auth.users insert
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();