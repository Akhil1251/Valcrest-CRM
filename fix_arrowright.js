const fs = require('fs');
const path = 'D:/HelpVerse Projects/Portal HelpVerse/src/app/forgot-password/page.tsx';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(
  /import \{ Mail, ArrowLeft, Loader2, Send, ShieldCheck, KeyRound \} from 'lucide-react';/,
  `import { Mail, ArrowLeft, ArrowRight, Loader2, Send, ShieldCheck, KeyRound } from 'lucide-react';`
);

fs.writeFileSync(path, content);
console.log('Fixed missing ArrowRight import');
