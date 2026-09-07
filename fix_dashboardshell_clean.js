const fs = require('fs');
const path = 'D:/HelpVerse Projects/Portal HelpVerse/src/components/DashboardShell.tsx';
let content = fs.readFileSync(path, 'utf8');

// Add import
if (!content.includes('import SessionGuard')) {
  content = content.replace(
    /import \{ logoutAction \} from '@\/app\/actions\/auth';/,
    `import { logoutAction } from '@/app/actions/auth';\nimport SessionGuard from './SessionGuard';`
  );
}

// Wrap the return block
if (!content.includes('<SessionGuard>')) {
  // It should be exactly:
  //   return (
  //     <div className="min-h-screen flex bg-slate-50 text-slate-900">
  
  content = content.replace(
    /return \(\s*<div className="min-h-screen flex bg-slate-50 text-slate-900">/,
    `return (\n    <SessionGuard>\n      <div className="min-h-screen flex bg-slate-50 text-slate-900">`
  );

  // At the bottom of the file, it looks like:
  //       )}
  //     </div>
  //   );
  // }
  
  // We'll replace the VERY LAST occurrence of </div>\n  );\n}
  const lastIndex = content.lastIndexOf('</div>');
  if (lastIndex !== -1) {
    const start = content.substring(0, lastIndex);
    const end = content.substring(lastIndex);
    const replacedEnd = end.replace(/<\/div>\s*\);\s*\}\s*$/, '</div>\n    </SessionGuard>\n  );\n}\n');
    content = start + replacedEnd;
  }
}

fs.writeFileSync(path, content);
console.log('Fixed DashboardShell wrapper cleanly');
