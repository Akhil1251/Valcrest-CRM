const fs = require('fs');
const path = 'D:/HelpVerse Projects/Portal HelpVerse/src/components/SessionGuard.tsx';
let content = fs.readFileSync(path, 'utf8');

// Replace router.replace with window.location.href
content = content.replace(
  /router\.replace\('\/login\?error=session_expired'\);/g,
  `window.location.href = '/login?error=session_expired';`
);

fs.writeFileSync(path, content);
console.log('Fixed SessionGuard routing using window.location');
