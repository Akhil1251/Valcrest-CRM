const fs = require('fs');
const path = 'D:/HelpVerse Projects/Portal HelpVerse/src/app/login/page.tsx';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(
  /href="\/forgot-password"/,
  `href="/forgot-password?bypass=true"`
);

fs.writeFileSync(path, content);
console.log('Fixed forgot-password link in login/page.tsx');
