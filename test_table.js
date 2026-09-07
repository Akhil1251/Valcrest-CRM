const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  'https://budvbirmrjhlmzjvaqly.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ1ZHZiaXJtcmpobG16anZhcWx5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MTE3MjQ0OCwiZXhwIjoyMDk2NzQ4NDQ4fQ.48ywq42dCQltteoESYYnx2tIKHYjnYukVUW0TpP3skw'
);
async function test() {
  const { data, error } = await supabase.from('password_reset_requests').select('*').limit(1);
  if (error) {
    console.error("SUPABASE ERROR:", error.message, error.code);
  } else {
    console.log("TABLE EXISTS. DATA:", data);
  }
}
test();
