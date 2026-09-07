const fs = require('fs');
const file = 'D:/HelpVerse Projects/Portal HelpVerse/src/components/SettingsPortal.tsx';
let content = fs.readFileSync(file, 'utf8');

if (!content.includes('getResetRequestsAction')) {
  content = content.replace(
    /import \{ getLockedAccountsAction, unlockAccountAction \} from '@\/app\/actions\/auth';/,
    `import { getLockedAccountsAction, unlockAccountAction, getResetRequestsAction, approveResetRequestAction } from '@/app/actions/auth';`
  );
  
  content = content.replace(
    /const \[lockedAccounts, setLockedAccounts\] = useState<any\[\]>\(\[\]\);/,
    `const [lockedAccounts, setLockedAccounts] = useState<any[]>([]);\n  const [resetRequests, setResetRequests] = useState<any[]>([]);\n  const [approvingReq, setApprovingReq] = useState<string | null>(null);`
  );

  const fetchRepl = `const [lockedRes, resetRes] = await Promise.all([
        getLockedAccountsAction(),
        getResetRequestsAction()
      ]);`;
  content = content.replace(/const lockedRes = await getLockedAccountsAction\(\);/, fetchRepl);

  const setRepl = `if (lockedRes.success) setLockedAccounts(lockedRes.accounts || []);
      if (resetRes.success) setResetRequests(resetRes.requests || []);`;
  content = content.replace(/if \(lockedRes\.success\) setLockedAccounts\(lockedRes\.accounts || \[\]\);/, setRepl);
  
  const approveFunc = `
  const handleApproveReset = async (id: string) => {
    setApprovingReq(id);
    try {
      const res = await approveResetRequestAction(id);
      if (res.success) {
        setSuccessMsg('Password reset request approved.');
        fetchData();
      } else {
        setErrorMsg(res.error || 'Failed to approve request.');
      }
    } catch (e: any) {
      setErrorMsg(e.message);
    } finally {
      setApprovingReq(null);
    }
  };
  `;
  content = content.replace(/const handleUnlockAccount = async \(userId: string\) => \{/, approveFunc + '\n  const handleUnlockAccount = async (userId: string) => {');

  const uiAddition = `
          {/* Password Reset Requests */}
          {user.role === 'super_admin' && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mb-6">
              <div className="p-4 border-b border-slate-100 bg-amber-50 font-bold text-amber-700 flex items-center gap-2">
                <ShieldCheck className="h-4 w-4" />
                Password Reset Requests
                <span className="ml-auto text-xs font-normal text-amber-600">Pending approvals for password resets</span>
              </div>
              {resetRequests.length === 0 ? (
                <div className="p-8 text-center">
                  <ShieldCheck className="h-8 w-8 text-emerald-400 mx-auto mb-2" />
                  <p className="text-slate-500 text-sm">No pending password reset requests.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm text-slate-600">
                    <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 text-xs uppercase tracking-wider font-semibold">
                      <tr>
                        <th className="p-4">Employee</th>
                        <th className="p-4">Email</th>
                        <th className="p-4">Requested At</th>
                        <th className="p-4">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {resetRequests.map((req: any) => (
                        <tr key={req.id} className="hover:bg-slate-50 transition-colors">
                          <td className="p-4 font-bold text-slate-800">{req.users?.full_name}</td>
                          <td className="p-4 text-slate-500">{req.users?.email}</td>
                          <td className="p-4 text-xs font-mono text-slate-500">
                            {new Date(req.created_at).toLocaleString()}
                          </td>
                          <td className="p-4">
                            <button
                              onClick={() => handleApproveReset(req.id)}
                              disabled={approvingReq === req.id}
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-lg transition-colors disabled:opacity-50 cursor-pointer"
                            >
                              {approvingReq === req.id ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <ShieldCheck className="h-3.5 w-3.5" />
                              )}
                              Approve
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
  `;
  content = content.replace(/\{user\.role === 'super_admin' && \(\s*<div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">\s*<div className="p-4 border-b border-slate-100 bg-red-50/, uiAddition + "\n          {user.role === 'super_admin' && (\n            <div className=\"bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden\">\n              <div className=\"p-4 border-b border-slate-100 bg-red-50");

  fs.writeFileSync(file, content);
  console.log('Successfully updated SettingsPortal.tsx');
} else {
  console.log('Already updated or regex mismatch');
}
