-- Enable Realtime for Dashboard relevant tables
-- inquiries is already enabled via inquiries_upgrade.sql, but we can do it safely via DO block or just run the alters.

DO $$
BEGIN
  -- Add leads
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'leads'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE leads;
  END IF;

  -- Add daily_work_reports
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'daily_work_reports'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE daily_work_reports;
  END IF;

  -- Add leaves
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'leaves'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE leaves;
  END IF;

  -- Add inquiries just in case
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'inquiries'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE inquiries;
  END IF;
END $$;
