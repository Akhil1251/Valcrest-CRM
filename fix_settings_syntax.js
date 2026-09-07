const fs = require('fs');
const file = 'D:/HelpVerse Projects/Portal HelpVerse/src/components/SettingsPortal.tsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Remove the weird broken lines at the very top.
if (content.startsWith('if (lockedRes.success)')) {
  content = content.replace(/^.*'use client';\r?\n/s, "'use client';\n");
}

// 2. Fix the fetchData function
const oldFetch = `    const [sets, usrs, logs, locked] = await Promise.all([
      getSystemSettingsAction(),
      getEmployeesListAction(),
      getAuditLogsAction(),
      getLockedAccountsAction()
    ]);
    setSettings(sets);
    setUsersList(Array.isArray(usrs) ? usrs : []);
    setAuditLogs(logs || []);
    setLockedAccounts(locked?.accounts || []);`;

const newFetch = `    const [sets, usrs, logs, locked, resets] = await Promise.all([
      getSystemSettingsAction(),
      getEmployeesListAction(),
      getAuditLogsAction(),
      getLockedAccountsAction(),
      getResetRequestsAction()
    ]);
    setSettings(sets);
    setUsersList(Array.isArray(usrs) ? usrs : []);
    setAuditLogs(logs || []);
    setLockedAccounts(locked?.accounts || []);
    if (resets && resets.success) {
      setResetRequests(resets.requests || []);
    }`;

content = content.replace(oldFetch, newFetch);

fs.writeFileSync(file, content);
console.log('Fixed SettingsPortal.tsx');
