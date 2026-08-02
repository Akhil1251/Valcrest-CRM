-- Add is_read column to leaves table
ALTER TABLE public.leaves 
ADD COLUMN IF NOT EXISTS is_read BOOLEAN DEFAULT false;
