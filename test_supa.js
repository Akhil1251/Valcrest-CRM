const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: 'D:/HelpVerse Projects/Portal HelpVerse/.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function test() {
  const { data, error } = await supabase.from('password_reset_requests').select('*, users(email, full_name)');
  if (error) {
    console.error("Join Query Error:", error.message);
  } else {
    console.log("Join Query Success. Rows:", data.length);
  }
  
  const { data: d2, error: e2 } = await supabase.from('password_reset_requests').select('*');
  if (e2) {
    console.error("Simple Query Error:", e2.message);
  } else {
    console.log("Simple Query Success. Rows:", d2.length);
    if (d2.length > 0) console.log(d2);
  }
}

test();
