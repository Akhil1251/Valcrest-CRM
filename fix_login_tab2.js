const fs = require('fs');
const file = 'D:/HelpVerse Projects/Portal HelpVerse/src/app/login/page.tsx';
let content = fs.readFileSync(file, 'utf8');

const regex = /if \(res && res\.success && res\.redirect\) \{/s;
if (content.match(regex)) {
  content = content.replace(regex, `if (res && res.success && res.redirect) {\n            if (typeof window !== 'undefined') sessionStorage.setItem('hv_tab_session', 'true');`);
  fs.writeFileSync(file, content);
  console.log('Updated login/page.tsx to set hv_tab_session');
} else {
  console.log('Failed to match regex in login/page.tsx');
}
