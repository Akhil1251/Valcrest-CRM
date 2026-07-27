-- 1. Create a secure function to check for admin status without triggering RLS recursion
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Drop the old policies that caused the infinite loop
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins have full access to leads" ON public.leads;
DROP POLICY IF EXISTS "Admins have full access to inquiries" ON public.inquiries;
DROP POLICY IF EXISTS "Admins full access DWR" ON public.daily_work_reports;
DROP POLICY IF EXISTS "Admins full access leaves" ON public.leaves;

-- 3. Re-create the policies using the new secure function
CREATE POLICY "Admins can view all profiles" ON public.profiles FOR SELECT USING (public.is_admin());
CREATE POLICY "Admins can update profiles" ON public.profiles FOR UPDATE USING (public.is_admin());

CREATE POLICY "Admins have full access to leads" ON public.leads FOR ALL USING (public.is_admin());
CREATE POLICY "Admins have full access to inquiries" ON public.inquiries FOR ALL USING (public.is_admin());
CREATE POLICY "Admins full access DWR" ON public.daily_work_reports FOR ALL USING (public.is_admin());
CREATE POLICY "Admins full access leaves" ON public.leaves FOR ALL USING (public.is_admin());
