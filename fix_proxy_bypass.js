const fs = require('fs');
const path = 'D:/HelpVerse Projects/Portal HelpVerse/src/proxy.ts';
let content = fs.readFileSync(path, 'utf8');

const regex = /if \(url\.searchParams\.has\('error'\)\) \{\s*return NextResponse\.next\(\);\s*\}/s;
if (content.match(regex)) {
  const newLogic = `if (url.searchParams.has('error') || url.searchParams.has('bypass')) {
      return NextResponse.next();
    }`;
  content = content.replace(regex, newLogic);
  fs.writeFileSync(path, content);
  console.log('Fixed proxy.ts to allow bypass param');
} else {
  console.log('Regex match failed in proxy.ts');
}
