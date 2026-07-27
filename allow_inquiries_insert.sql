-- Allow anyone (including anonymous users submitting from your website) to insert new inquiries
-- They will NOT be able to view, edit, or delete existing inquiries. Only admins can do that.
CREATE POLICY "Anyone can submit inquiries" ON public.inquiries FOR INSERT WITH CHECK (true);
