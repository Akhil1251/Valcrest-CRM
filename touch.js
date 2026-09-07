const fs = require('fs');
const file = 'D:/HelpVerse Projects/Portal HelpVerse/src/components/CRMPortal.tsx';
let content = fs.readFileSync(file, 'utf8');
content = content.replace(/'use client';/, "'use client';\n// Force turbopack recompile");
fs.writeFileSync(file, content);
console.log('Touched file');
