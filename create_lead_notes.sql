-- Create Lead Notes Table
CREATE TABLE public.lead_notes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    lead_id UUID REFERENCES public.leads(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.lead_notes ENABLE ROW LEVEL SECURITY;

-- Admins can view and insert all notes
CREATE POLICY "Admins can view all notes" ON public.lead_notes FOR SELECT USING (public.is_admin());
CREATE POLICY "Admins can insert all notes" ON public.lead_notes FOR INSERT WITH CHECK (public.is_admin());

-- Users can view and insert notes only for leads assigned to them
CREATE POLICY "Users can view notes of assigned leads" ON public.lead_notes FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.leads WHERE id = lead_id AND assigned_to = auth.uid())
);
CREATE POLICY "Users can insert notes for assigned leads" ON public.lead_notes FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.leads WHERE id = lead_id AND assigned_to = auth.uid())
);
