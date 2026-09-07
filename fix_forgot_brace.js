const fs = require('fs');
const path = 'D:/HelpVerse Projects/Portal HelpVerse/src/app/forgot-password/page.tsx';
let content = fs.readFileSync(path, 'utf8');

if (!content.trim().endsWith('}')) {
  content += '\n}\n';
  fs.writeFileSync(path, content);
  console.log('Appended missing closing brace');
} else {
  console.log('File already ends with brace');
}
