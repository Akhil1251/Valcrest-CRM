-- Add is_read column to daily_work_reports table
ALTER TABLE public.daily_work_reports 
ADD COLUMN IF NOT EXISTS is_read BOOLEAN DEFAULT false;
