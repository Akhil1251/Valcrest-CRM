-- 1. Add full_name to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS full_name TEXT;

-- 2. Add assigned_to to leads
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS assigned_to UUID REFERENCES public.profiles(id) ON DELETE SET NULL;

-- 3. Enable RLS on leads
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies
DROP POLICY IF EXISTS "Admins have full access to leads" ON public.leads;
DROP POLICY IF EXISTS "Users can view assigned leads" ON public.leads;
DROP POLICY IF EXISTS "Users can update assigned leads" ON public.leads;
DROP POLICY IF EXISTS "Users can insert leads" ON public.leads;

-- Admins have full access to everything
CREATE POLICY "Admins have full access to leads" ON public.leads FOR ALL USING (public.is_admin());

-- Users can only see leads assigned to them
CREATE POLICY "Users can view assigned leads" ON public.leads FOR SELECT USING (assigned_to = auth.uid());

-- Users can update leads assigned to them
CREATE POLICY "Users can update assigned leads" ON public.leads FOR UPDATE USING (assigned_to = auth.uid());

-- Users can insert leads and assign them to themselves
CREATE POLICY "Users can insert leads" ON public.leads FOR INSERT WITH CHECK (assigned_to = auth.uid() OR assigned_to IS NULL);
