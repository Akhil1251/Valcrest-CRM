-- 1. Alter the status column from ENUM to TEXT to support dynamic custom statuses
ALTER TABLE public.inquiries ALTER COLUMN status TYPE TEXT USING status::TEXT;
-- Optional: We can drop the old enum if we want, but it's fine to leave it.
-- DROP TYPE IF EXISTS inquiry_status;

-- 2. Create the inquiry_notes table
CREATE TABLE public.inquiry_notes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  inquiry_id UUID REFERENCES public.inquiries(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS on notes
ALTER TABLE public.inquiry_notes ENABLE ROW LEVEL SECURITY;

-- Admins can do everything with notes
CREATE POLICY "Admins full access inquiry_notes" ON public.inquiry_notes FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Users can view notes for inquiries they are assigned to
CREATE POLICY "Users view assigned notes" ON public.inquiry_notes FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.inquiries WHERE id = inquiry_notes.inquiry_id AND assigned_to = auth.uid())
);

-- Users can insert notes for inquiries they are assigned to
CREATE POLICY "Users insert assigned notes" ON public.inquiry_notes FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.inquiries WHERE id = inquiry_notes.inquiry_id AND assigned_to = auth.uid())
);

-- 3. Enable Realtime on the inquiries table
-- By default, publication 'supabase_realtime' exists in Supabase. We just add the table to it.
ALTER PUBLICATION supabase_realtime ADD TABLE inquiries;
