const fs = require('fs');
const path = 'D:/HelpVerse Projects/Portal HelpVerse/src/components/SessionGuard.tsx';
let content = fs.readFileSync(path, 'utf8');

// Replace the red screen with just a return null or minimal loader while redirecting
const redScreenRegex = /if \(isRestricted\) \{\s*return \(\s*<div className="min-h-screen flex items-center justify-center bg-slate-950 text-white">.*?<\/div>\s*\);\s*\}/s;
content = content.replace(redScreenRegex, `if (isRestricted) {
    return null; // Don't render anything, just wait for the redirect to login
  }`);

// Also change the router.push to router.replace to avoid messing up history
content = content.replace(/router\.push\('\/login\?error=unauthorized_tab'\);/, `router.replace('/login?error=session_expired');`);

fs.writeFileSync(path, content);
console.log('Removed red screen from SessionGuard');
