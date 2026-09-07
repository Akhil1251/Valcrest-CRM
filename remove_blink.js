const fs = require('fs');
const path = 'D:/HelpVerse Projects/Portal HelpVerse/src/components/DashboardShell.tsx';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(
  /className="ml-auto bg-red-500 text-white text-\[10px\] font-bold px-2 py-0\.5 rounded-full shadow-sm shadow-red-500\/30 animate-pulse"/,
  'className="ml-auto bg-red-400 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm shadow-red-400/30"'
);

fs.writeFileSync(path, content);
console.log("Removed blink animation from badge");
