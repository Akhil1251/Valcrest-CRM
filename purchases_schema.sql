-- Create Purchases Table
CREATE TABLE public.purchases (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  plan_name TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  customer_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  neet_score TEXT,
  rank TEXT,
  category TEXT,
  sub_category TEXT,
  college_pref TEXT,
  state_pref TEXT,
  father_name TEXT,
  father_phone TEXT,
  father_email TEXT,
  payment_id TEXT UNIQUE NOT NULL,
  status TEXT DEFAULT 'success',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.purchases ENABLE ROW LEVEL SECURITY;

-- Allow public inserts (so the API can insert without admin token)
CREATE POLICY "Anyone can insert purchases" ON public.purchases FOR INSERT WITH CHECK (true);

-- Only admins can select (view) purchases
CREATE POLICY "Admins can view purchases" ON public.purchases FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Only admins can update purchases
CREATE POLICY "Admins can update purchases" ON public.purchases FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);
