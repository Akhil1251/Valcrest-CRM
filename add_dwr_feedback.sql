-- Add feedback column to daily_work_reports
ALTER TABLE public.daily_work_reports 
ADD COLUMN IF NOT EXISTS feedback TEXT;
