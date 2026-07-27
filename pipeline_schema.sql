-- 1. Create Pipelines Table
CREATE TABLE public.pipelines (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Create Pipeline Stages Table
CREATE TABLE public.pipeline_stages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  pipeline_id UUID REFERENCES public.pipelines(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  order_index INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Modify Leads Table
-- Drop the old status enum constraint by removing the column
ALTER TABLE public.leads DROP COLUMN status;

-- Add pipeline_id and stage_id
ALTER TABLE public.leads 
  ADD COLUMN pipeline_id UUID REFERENCES public.pipelines(id) ON DELETE CASCADE,
  ADD COLUMN stage_id UUID REFERENCES public.pipeline_stages(id) ON DELETE SET NULL;

-- 4. Enable RLS
ALTER TABLE public.pipelines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pipeline_stages ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies for Pipelines and Stages
CREATE POLICY "Admins have full access to pipelines" ON public.pipelines FOR ALL USING (public.is_admin());
CREATE POLICY "Users can view pipelines" ON public.pipelines FOR SELECT USING (true);

CREATE POLICY "Admins have full access to pipeline stages" ON public.pipeline_stages FOR ALL USING (public.is_admin());
CREATE POLICY "Users can view pipeline stages" ON public.pipeline_stages FOR SELECT USING (true);

-- 6. Create Initial Data
DO $$
DECLARE
  v_pipeline_id UUID;
  v_stage_id UUID;
BEGIN
  -- Insert default pipeline
  INSERT INTO public.pipelines (name) VALUES ('Main Sales Pipeline') RETURNING id INTO v_pipeline_id;
  
  -- Insert default stages
  INSERT INTO public.pipeline_stages (pipeline_id, name, order_index) VALUES (v_pipeline_id, 'New Lead', 1) RETURNING id INTO v_stage_id;
  INSERT INTO public.pipeline_stages (pipeline_id, name, order_index) VALUES (v_pipeline_id, 'Interesting', 2);
  INSERT INTO public.pipeline_stages (pipeline_id, name, order_index) VALUES (v_pipeline_id, 'Service Pitched', 3);
  INSERT INTO public.pipeline_stages (pipeline_id, name, order_index) VALUES (v_pipeline_id, 'Negotiation', 4);
  INSERT INTO public.pipeline_stages (pipeline_id, name, order_index) VALUES (v_pipeline_id, 'Closed Won', 5);
  INSERT INTO public.pipeline_stages (pipeline_id, name, order_index) VALUES (v_pipeline_id, 'Closed Lost', 6);
  
  -- Re-assign any existing leads to the first stage of the new pipeline
  UPDATE public.leads SET pipeline_id = v_pipeline_id, stage_id = v_stage_id;
END $$;

-- 7. Make columns NOT NULL now that data is populated
ALTER TABLE public.leads ALTER COLUMN pipeline_id SET NOT NULL;
ALTER TABLE public.leads ALTER COLUMN stage_id SET NOT NULL;
