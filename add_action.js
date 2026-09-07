const fs = require('fs');
const path = 'D:/HelpVerse Projects/Portal HelpVerse/src/app/actions/auth.ts';
let content = fs.readFileSync(path, 'utf8');

if (!content.includes('getPendingResetRequestsCountAction')) {
  const newFunction = `
export async function getPendingResetRequestsCountAction() {
  const cookieStore = cookies();
  const token = cookieStore.get('hv_session_token')?.value;
  if (!token) return 0;
  
  try {
    const decoded: any = jwt.verify(token, JWT_SECRET);
    if (decoded.role !== 'super_admin') return 0;
    
    const { count } = await supabase
      .from('password_reset_requests')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending');
      
    return count || 0;
  } catch (e) {
    return 0;
  }
}
`;
  content += newFunction;
  fs.writeFileSync(path, content);
  console.log("Added getPendingResetRequestsCountAction");
}
