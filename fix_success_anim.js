const fs = require('fs');
const path = 'D:/HelpVerse Projects/Portal HelpVerse/src/app/login/page.tsx';
let content = fs.readFileSync(path, 'utf8');

// Update PANE 2
content = content.replace(
  /\{\/\* PANE 2: Logo Animation \(50vw\) \*\/\}\s*<div className=\{\`w-\[50vw\] h-full relative flex items-center justify-center bg-black overflow-hidden transition-all duration-\[2000ms\] ease-in-out \\\$\{isSuccessAnimating \? 'opacity-0 scale-95' : 'opacity-100 scale-100'\}\`\}>/s,
  `{/* PANE 2: Logo Animation */}
        <div className={\`h-full relative flex items-center justify-center bg-black overflow-hidden transition-all duration-[2000ms] ease-in-out \${isSuccessAnimating ? 'w-[100vw]' : 'w-[50vw]'}\`}>`
);

// Update PANE 3
content = content.replace(
  /\{\/\* PANE 3: Login Form \(50vw\) \*\/\}\s*<div className=\{\`w-\[50vw\] h-full relative flex flex-col items-center justify-center px-4 py-4 lg:py-8 bg-black overflow-y-auto transition-all duration-\[2000ms\] ease-in-out \\\$\{isSuccessAnimating \? 'opacity-0 translate-x-full' : 'opacity-100 translate-x-0'\}\`\}>/s,
  `{/* PANE 3: Login Form */}
        <div className={\`h-full relative flex flex-col items-center justify-center px-4 py-4 lg:py-8 bg-black overflow-y-auto transition-all duration-[2000ms] ease-in-out \${isSuccessAnimating ? 'w-0 opacity-0 translate-x-full' : 'w-[50vw] opacity-100 translate-x-0'}\`}>`
);

fs.writeFileSync(path, content);
console.log('Restored Success Animation in Reel Layout');
