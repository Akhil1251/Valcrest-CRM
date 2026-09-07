const fs = require('fs');
const path = 'D:/HelpVerse Projects/Portal HelpVerse/src/app/forgot-password/page.tsx';
let content = fs.readFileSync(path, 'utf8');

// Use a regex that just replaces the entire className for both inputs
// First input (email)
content = content.replace(
  /<input\s+type="email"[\s\S]*?className="[^"]*"[\s\S]*?disabled=\{loading\}\s*\/>/,
  `<input
                            type="email"
                            required
                            placeholder="name@company.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full pl-10 py-2.5 bg-white/5 border border-white/20 rounded-xl text-white placeholder-white/30 focus:border-white/50 focus:ring-1 focus:ring-white/50 transition-all text-sm outline-none"
                            disabled={loading}
                          />`
);

// Second input (otp)
content = content.replace(
  /<input\s+type="text"[\s\S]*?maxLength=\{6\}[\s\S]*?className="[^"]*"[\s\S]*?disabled=\{loading\}\s*\/>/,
  `<input
                            type="text"
                            required
                            maxLength={6}
                            placeholder="123456"
                            value={otp}
                            onChange={(e) => setOtp(e.target.value.replace(/\\D/g, ''))}
                            className="w-full pl-10 py-2.5 bg-white/5 border border-white/20 rounded-xl text-white placeholder-white/30 focus:border-white/50 focus:ring-1 focus:ring-white/50 transition-all text-sm outline-none tracking-[0.3em] font-mono"
                            disabled={loading}
                          />`
);

fs.writeFileSync(path, content);
console.log('Force replaced input classes');
