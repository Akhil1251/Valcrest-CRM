const fs = require('fs');
const path = 'D:/HelpVerse Projects/Portal HelpVerse/src/app/forgot-password/page.tsx';
let content = fs.readFileSync(path, 'utf8');

// Replace input classes
content = content.replace(/className="form-input text-xs w-full pl-9 py-2\.5 bg-white\/5 border border-white\/10 rounded-lg text-white placeholder:text-white\/20 focus:border-white\/30 focus:ring-1 focus:ring-white\/30 transition-all"/g, 
  'className="w-full pl-10 py-2.5 bg-white/5 border border-white/20 rounded-xl text-white placeholder-white/30 focus:border-white/50 focus:ring-1 focus:ring-white/50 transition-all text-sm outline-none"');

// Replace button classes
content = content.replace(/className="w-full py-2\.5 px-4 bg-white\/5 hover:bg-white\/10 border border-white\/10 rounded-lg text-white text-xs font-semibold flex items-center justify-center gap-2 shadow-\[0_0_15px_rgba\(255,255,255,0\.05\)\] hover:shadow-\[0_0_20px_rgba\(255,255,255,0\.1\)\] transition-all disabled:opacity-50"/g,
  'className="w-full py-2.5 px-4 mt-2 rounded-xl bg-white/10 hover:bg-white/20 backdrop-blur-md text-white font-medium text-sm flex items-center justify-center gap-2 shadow-xl shadow-black/20 transition-all duration-300 active:scale-[0.98] disabled:opacity-70 disabled:pointer-events-none cursor-pointer border border-white/10"');

fs.writeFileSync(path, content);
console.log('Polished forgot-password classes');
