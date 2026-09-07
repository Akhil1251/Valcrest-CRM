const fs = require('fs');
const file = 'D:/HelpVerse Projects/Portal HelpVerse/src/app/actions/auth.ts';
let content = fs.readFileSync(file, 'utf8');

const regex = /export async function approveResetRequestAction/;
const newAction = `export async function getResetRequestsAction() {
  const currentUser = await getSessionUser();
  if (!currentUser || currentUser.role !== 'super_admin') {
    return { success: false, error: 'Unauthorized', requests: [] };
  }
  const { data, error } = await supabase.from('password_reset_requests')
    .select('*, users(email, full_name)')
    .eq('status', 'pending')
    .order('created_at', { ascending: false });
  if (error) return { success: false, error: error.message, requests: [] };
  return { success: true, requests: data || [] };
}

export async function approveResetRequestAction`;

if (content.match(regex)) {
  content = content.replace(regex, newAction);
  fs.writeFileSync(file, content);
  console.log('Successfully updated auth.ts with getResetRequestsAction');
} else {
  console.log('Failed to match approveResetRequestAction');
}
