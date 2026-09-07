const fs = require('fs');
const path = 'D:/HelpVerse Projects/Portal HelpVerse/src/components/DashboardShell.tsx';
let content = fs.readFileSync(path, 'utf8');

// Remove trailing </SessionGuard>
content = content.replace(/    <\/SessionGuard>\r?\n/g, '');

// If it's already wrapped, don't do it again
if (!content.includes('<SessionGuard>')) {
  // Wrap return (
  content = content.replace(
    /return \(\s*<div className="min-h-screen flex bg-slate-50 text-slate-900">/,
    `return (\n    <SessionGuard>\n      <div className="min-h-screen flex bg-slate-50 text-slate-900">`
  );

  // Wrap the ending
  content = content.replace(
    /<\/div>\s*\);\s*\}\s*$/,
    `      </div>\n    </SessionGuard>\n  );\n}`
  );
}

fs.writeFileSync(path, content);
console.log('Fixed DashboardShell wrapper');
