const fs = require('fs');
const path = 'D:/HelpVerse Projects/Portal HelpVerse/src/app/login/page.tsx';
let content = fs.readFileSync(path, 'utf8');

// Replace the shrinking logic in Pane 1
const pane1ShrinkStr = "className={`shrink-0 h-full relative flex flex-col items-center justify-center px-4 py-4 lg:py-8 \nbg-black overflow-y-auto transition-all duration-[2000ms] ease-in-out ${forgotSuccess ? 'w-0 opacity-0 \n-translate-x-full' : 'w-[50vw] opacity-100 translate-x-0'}`}";

// We will just use regex to replace it robustly regardless of line breaks
content = content.replace(
  /className=\{\`shrink-0 h-full relative flex flex-col items-center justify-center px-4 py-4 lg:py-8[\s\S]*?bg-black overflow-y-auto transition-all duration-\[2000ms\] ease-in-out \$\{forgotSuccess \? 'w-0 opacity-0[\s\S]*?-translate-x-full' : 'w-\[50vw\] opacity-100 translate-x-0'\}\`\}/g,
  'className="w-[50vw] shrink-0 h-full relative flex flex-col items-center justify-center px-4 py-4 lg:py-8 bg-black overflow-y-auto"'
);

fs.writeFileSync(path, content);
console.log('Fixed Pane 1 width');
