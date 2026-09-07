const fs = require('fs');
const file = 'D:/HelpVerse Projects/Portal HelpVerse/src/components/CRMPortal.tsx';
let content = fs.readFileSync(file, 'utf8');

const regex = /useState<'board' \| 'create' \| 'details'>\('board'\)/;
const replacement = `useState<'board' | 'create' | 'details' | 'edit'>('board')`;

if (content.match(regex)) {
  content = content.replace(regex, replacement);
  fs.writeFileSync(file, content);
  console.log('Fixed TypeScript error for activePane');
} else {
  console.log('Regex did not match!');
}
