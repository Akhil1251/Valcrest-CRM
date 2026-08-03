require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDb() {
  const { data: logs, error: logsError } = await supabase.from('activity_logs').select('*').limit(5);
  if (logsError) {
    console.log('Activity Logs Error:', logsError.message);
  } else {
    console.log('Activity Logs Found:', logs.length);
  }

  const { data: leads, error: leadsError } = await supabase.from('leads').select('id, name, pipeline_id, stage_id, created_at').order('created_at', { ascending: false }).limit(5);
  if (leadsError) {
    console.log('Leads Error:', leadsError.message);
  } else {
    console.log('Recent Leads:', leads);
  }
}

checkDb();
