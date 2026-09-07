const fs = require('fs');
const path = 'D:/HelpVerse Projects/Portal HelpVerse/src/app/login/page.tsx';
let content = fs.readFileSync(path, 'utf8');

// Ensure AlertTriangle and Info are imported
if (!content.includes('AlertTriangle')) {
  content = content.replace(
    /import \{ Shield, Mail, Lock, Eye, EyeOff, Loader2, ArrowRight, Smartphone, ArrowLeft \}/,
    'import { Shield, Mail, Lock, Eye, EyeOff, Loader2, ArrowRight, Smartphone, ArrowLeft, AlertTriangle, Info }'
  );
}

// Replace the error spans in login/page.tsx
content = content.replace(
  /<span className="font-bold shrink-0">?<\/span>/g,
  '<AlertTriangle className="h-4 w-4 shrink-0 text-red-400" />'
);

// Replace the info spans in login/page.tsx
content = content.replace(
  /<span className="font-bold shrink-0">?<\/span>/g,
  '<Info className="h-4 w-4 shrink-0 text-blue-400" />'
);

fs.writeFileSync(path, content);
console.log('Fixed icons');
