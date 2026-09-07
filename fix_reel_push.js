const fs = require('fs');
const path = 'D:/HelpVerse Projects/Portal HelpVerse/src/app/login/page.tsx';
let content = fs.readFileSync(path, 'utf8');

// Update the Reel Container
// Remove style={{ width: '150vw' }} and add w-max or just let children dictate
content = content.replace(
  /<div \s*className="flex h-full absolute top-0 left-0 transition-transform duration-\[1500ms\] ease-in-out"\s*style=\{\{ \s*width: '150vw',\s*transform: step === 'forgot_password' \? 'translateX\(0\)' : 'translateX\(-50vw\)'\s*\}\}\s*>/s,
  `<div 
        className="flex h-full absolute top-0 left-0 transition-transform duration-[1500ms] ease-in-out"
        style={{ 
          width: 'max-content',
          transform: step === 'forgot_password' ? 'translateX(0)' : 'translateX(-50vw)'
        }}
      >`
);

// PANE 1
content = content.replace(
  /className="w-\[50vw\] h-full relative flex flex-col items-center/g,
  'className="w-[50vw] shrink-0 h-full relative flex flex-col items-center'
);

// PANE 2
content = content.replace(
  /className=\{\`h-full relative flex items-center justify-center bg-black overflow-hidden transition-all duration-\[2000ms\] ease-in-out \\\$\{isSuccessAnimating \? 'w-\[100vw\]' : 'w-\[50vw\]'\}\`\}/g,
  `className={\`h-full shrink-0 relative flex items-center justify-center bg-black overflow-hidden transition-all duration-[2000ms] ease-in-out \${isSuccessAnimating ? 'w-[100vw]' : 'w-[50vw]'}\`}`
);

// PANE 3
content = content.replace(
  /className=\{\`h-full relative flex flex-col items-center justify-center px-4 py-4 lg:py-8 bg-black overflow-y-auto transition-all duration-\[2000ms\] ease-in-out \\\$\{isSuccessAnimating \? 'w-0 opacity-0 translate-x-full' : 'w-\[50vw\] opacity-100 translate-x-0'\}\`\}/g,
  `className="w-[50vw] shrink-0 h-full relative flex flex-col items-center justify-center px-4 py-4 lg:py-8 bg-black overflow-y-auto transition-all duration-[2000ms] ease-in-out"`
);

fs.writeFileSync(path, content);
console.log('Fixed reel layout to push panes instead of squishing');
