const fs = require('fs');
const path = 'D:/HelpVerse Projects/Portal HelpVerse/src/app/login/page.tsx';
let content = fs.readFileSync(path, 'utf8');

// 1. Fix PANE 2 (Logo) so it ONLY expands on isSuccessAnimating, not forgotSuccess
content = content.replace(
  /className=\{\`h-full shrink-0 relative flex items-center justify-center bg-black overflow-hidden transition-all duration-\[2000ms\] ease-in-out \\\$\{\(isSuccessAnimating \|\| forgotSuccess\) \? 'w-\[100vw\]' : 'w-\[50vw\]'\}\`\}/g,
  `className={\`h-full shrink-0 relative flex items-center justify-center bg-black overflow-hidden transition-all duration-[2000ms] ease-in-out \${isSuccessAnimating ? 'w-[100vw]' : 'w-[50vw]'}\`}`
);

// 2. Remove the success overlay from PANE 2
const pane2StartToRemove = `{forgotSuccess && (
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/60 backdrop-blur-md animate-in fade-in duration-1000" style={{ animationDelay: '1000ms', animationFillMode: 'both' }}>`;
const pane2EndToRemove = `</button>
            </div>
          )}`;
          
const overlayRegex = /\{forgotSuccess && \(\s*<div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black\/60 backdrop-blur-md animate-in fade-in duration-1000" style=\{\{ animationDelay: '1000ms', animationFillMode: 'both' \}\}>[\s\S]*?<\/button>\s*<\/div>\s*\)\}/;

content = content.replace(overlayRegex, '');

// 3. Prevent PANE 1 from shrinking when forgotSuccess is true, keep it 50vw so it can show the overlay!
content = content.replace(
  /className=\{\`shrink-0 h-full relative flex flex-col items-center justify-center px-4 py-4 lg:py-8 bg-black overflow-y-auto transition-all duration-\[2000ms\] ease-in-out \\\$\{forgotSuccess \? 'w-0 opacity-0 -translate-x-full' : 'w-\[50vw\] opacity-100 translate-x-0'\}\`\}/g,
  `className="w-[50vw] shrink-0 h-full relative flex flex-col items-center justify-center px-4 py-4 lg:py-8 bg-black overflow-y-auto"`
);

// 4. Inject the success overlay INTO PANE 1's Form Card area
const oldForgotFormArea = `<div className="mt-4 flex-1 flex flex-col">
                    {errorMsg && step === 'forgot_password' && (`;
                    
const newForgotFormArea = `{forgotSuccess ? (
                  <div className="flex-1 flex flex-col items-center justify-center space-y-6 text-center animate-in fade-in duration-1000">
                    <style dangerouslySetInnerHTML={{__html: \`
                      @keyframes fillLine {
                        0% { width: 0%; }
                        100% { width: 100%; }
                      }
                    \`}} />
                    
                    <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-2 shadow-[0_0_30px_rgba(255,255,255,0.1)]">
                      <Shield className="h-8 w-8 text-white/80 animate-pulse" />
                    </div>
                    
                    <div className="flex flex-col items-center space-y-4 w-full">
                      <div className="flex items-center gap-3">
                        <h3 className="text-xl font-bold text-white tracking-[0.2em] uppercase">Request Sent</h3>
                        <div className="relative px-2 py-0.5 rounded flex items-center justify-center border border-green-500/30 overflow-hidden bg-white/5">
                          <div className="absolute top-0 left-0 h-full bg-green-500/80" style={{ animation: 'fillLine 3s ease-in-out forwards' }} />
                          <span className="relative z-10 text-[9px] font-bold tracking-widest text-green-100 drop-shadow-md">LIVE</span>
                        </div>
                      </div>
                      
                      <div className="w-48 h-[2px] bg-white/10 overflow-hidden relative rounded-full">
                        <div className="absolute top-0 left-0 h-full bg-green-500" style={{ animation: 'fillLine 3s ease-in-out forwards' }} />
                      </div>
                      
                      <p className="text-sm text-white/60 leading-relaxed max-w-sm mx-auto">
                        Your password reset request has been securely dispatched to the Super Admin for approval.
                      </p>
                      <p className="text-xs text-white/40 leading-relaxed max-w-sm mx-auto mt-2">
                        Once approved, return to the login screen with your email to set a new password.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => { setStep('credentials'); setForgotSuccess(false); }}
                      className="inline-flex items-center text-[11px] uppercase tracking-wider font-semibold text-white/50 hover:text-white transition-colors mt-6"
                    >
                      <ArrowLeft className="h-3.5 w-3.5 mr-2" />
                      Return to Sign In
                    </button>
                  </div>
                ) : (
                  <div className="mt-4 flex-1 flex flex-col">
                    {errorMsg && step === 'forgot_password' && (`;

content = content.replace(oldForgotFormArea, newForgotFormArea);

// Close the forgotSuccess ternary inside PANE 1
content = content.replace(
  /<\/button>\s*<\/div>\s*<\/div>\s*<\/form>\s*<\/div>\s*\)\}\s*<\/div>\s*<\/div>\s*<div className="mt-8 text-center">/,
  `                      </button>
                        </div>
                      </div>
                    </form>
                  </div>
                )}
              </div>
            </div>
            <div className="mt-8 text-center">`
);

fs.writeFileSync(path, content);
console.log('Fixed overlay and LIVE badge');
