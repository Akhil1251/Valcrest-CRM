const fs = require('fs');
const path = 'D:/HelpVerse Projects/Portal HelpVerse/src/components/DashboardShell.tsx';
let content = fs.readFileSync(path, 'utf8');

if (!content.includes('SessionGuard')) {
  content = content.replace(
    /import \{ logoutAction \} from '@\/app\/actions\/auth';/,
    `import { logoutAction } from '@/app/actions/auth';\nimport SessionGuard from './SessionGuard';`
  );

  content = content.replace(
    /return \(\s*<div className="flex h-screen/,
    `return (\n    <SessionGuard>\n      <div className="flex h-screen`
  );

  content = content.replace(
    /<\/div>\s*\);\s*\}\s*$/,
    `      </div>\n    </SessionGuard>\n  );\n}`
  );
  
  // If the last replace missed it, try a broader one:
  if (!content.includes('</SessionGuard>')) {
     const lastDivIdx = content.lastIndexOf('</div>');
     if (lastDivIdx !== -1) {
         content = content.substring(0, lastDivIdx + 6) + '\n    </SessionGuard>' + content.substring(lastDivIdx + 6);
     }
  }

  fs.writeFileSync(path, content);
  console.log('Wrapped DashboardShell in SessionGuard');
} else {
  console.log('Already wrapped');
}
