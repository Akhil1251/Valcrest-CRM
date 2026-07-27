-- This script will make all currently registered accounts an Admin.
-- Run this in your Supabase SQL Editor.
UPDATE public.profiles SET role = 'admin'::user_role;
