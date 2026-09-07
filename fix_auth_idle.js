const fs = require('fs');
const file = 'D:/HelpVerse Projects/Portal HelpVerse/src/app/actions/auth.ts';
let content = fs.readFileSync(file, 'utf8');

const regex = /export async function getSessionUser/;
const newAction = `export async function checkIdleStatusAction() {
  const user = await getSessionUser();
  if (!user) return { success: false, isActive: false };
  
  // Check attendance
  const today = new Date().toISOString().split('T')[0];
  const { data: log } = await supabase.from('attendance_logs')
    .select('check_in_time, check_out_time')
    .eq('employee_id', user.id)
    .eq('attendance_date', today)
    .single();
    
  if (log && log.check_in_time && !log.check_out_time) {
    return { success: true, isActive: true };
  }
  return { success: true, isActive: false };
}

export async function getSessionUser`;

if (content.match(regex)) {
  content = content.replace(regex, newAction);
  fs.writeFileSync(file, content);
  console.log('Added checkIdleStatusAction to auth.ts');
} else {
  console.log('Failed to match getSessionUser');
}
