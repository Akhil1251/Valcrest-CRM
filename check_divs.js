const fs = require('fs');
const content = fs.readFileSync('D:/HelpVerse Projects/Portal HelpVerse/src/components/DashboardShell.tsx', 'utf8');

// Match everything from <SessionGuard> to </SessionGuard>
const match = content.match(/<SessionGuard>([\s\S]*)<\/SessionGuard>/);
if (match) {
  const jsx = match[1];
  const opens = (jsx.match(/<div/g) || []).length;
  const closes = (jsx.match(/<\/div>/g) || []).length;
  console.log(`Opens: ${opens}, Closes: ${closes}`);
} else {
  console.log('No SessionGuard block found');
}
