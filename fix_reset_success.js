const fs = require('fs');
const path = 'D:/HelpVerse Projects/Portal HelpVerse/src/app/login/page.tsx';
let content = fs.readFileSync(path, 'utf8');

// 1. Update PANE 1 classes to shrink when forgotSuccess is true
content = content.replace(
  /\{\/\* PANE 1: Forgot Password Form \(50vw\) \*\/\}\s*<div className="w-\[50vw\] shrink-0 h-full relative flex flex-col items-center justify-center px-4 py-4 lg:py-8 bg-black overflow-y-auto">/g,
  `{/* PANE 1: Forgot Password Form */}
        <div className={\`shrink-0 h-full relative flex flex-col items-center justify-center px-4 py-4 lg:py-8 bg-black overflow-y-auto transition-all duration-[2000ms] ease-in-out \${forgotSuccess ? 'w-0 opacity-0 -translate-x-full' : 'w-[50vw] opacity-100 translate-x-0'}\`}>`
);

// 2. Update PANE 2 classes to expand when forgotSuccess is true
content = content.replace(
  /\{\/\* PANE 2: Logo Animation \*\/\}\s*<div className=\{\`h-full shrink-0 relative flex items-center justify-center bg-black overflow-hidden transition-all duration-\[2000ms\] ease-in-out \\\$\{isSuccessAnimating \? 'w-\[100vw\]' : 'w-\[50vw\]'\}\`\}>/g,
  `{/* PANE 2: Logo Animation */}
        <div className={\`h-full shrink-0 relative flex items-center justify-center bg-black overflow-hidden transition-all duration-[2000ms] ease-in-out \${(isSuccessAnimating || forgotSuccess) ? 'w-[100vw]' : 'w-[50vw]'}\`}>`
);

// 3. Remove the old forgotSuccess block from inside PANE 1
const oldForgotSuccessBlock = `
                {forgotSuccess ? (
                  <div className="flex-1 flex flex-col items-center justify-center space-y-6 text-center animate-in fade-in duration-1000">
                    <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-2 shadow-[0_0_30px_rgba(255,255,255,0.1)]">
                      <Shield className="h-8 w-8 text-white/80" />
                    </div>
                    
                    <div className="space-y-3">
                      <h3 className="text-xl font-bold text-white tracking-tight">Request Submitted</h3>
                      <p className="text-sm text-white/60 leading-relaxed max-w-sm mx-auto">
                        Your password reset request has been securely dispatched to the Super Admin for approval.
                      </p>
                      <p className="text-xs text-white/40 leading-relaxed max-w-sm mx-auto mt-2">
                        Once approved, return to the login screen with your email to set a new password.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => setStep('credentials')}
                      className="inline-flex items-center text-xs font-semibold text-white/60 hover:text-white transition-colors mt-4"
                    >
                      <ArrowLeft className="h-3.5 w-3.5 mr-1.5" />
                      Return to Sign In
                    </button>
                  </div>
                ) : (
                  <div className="mt-4 flex-1 flex flex-col">
`;
const oldForgotSuccessEnd = `                  </div>
                )}
`;
// Replace the start
content = content.replace(oldForgotSuccessBlock, `                  <div className="mt-4 flex-1 flex flex-col">`);
// Replace the end
content = content.replace(oldForgotSuccessEnd, `                  </div>\n`);


// 4. Inject the new success overlay into PANE 2
const pane2InnerEnd = `          <div className="absolute bottom-10 left-10 z-10 text-white/40 text-[10px] font-semibold tracking-[2px] text-left">
            HELPVERSE OPERATIONAL UNIT<br />
            GLOBAL ACCESS TERMINAL 01
          </div>`;
          
const successOverlay = `          <div className="absolute bottom-10 left-10 z-10 text-white/40 text-[10px] font-semibold tracking-[2px] text-left">
            HELPVERSE OPERATIONAL UNIT<br />
            GLOBAL ACCESS TERMINAL 01
          </div>
          
          {forgotSuccess && (
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/60 backdrop-blur-md animate-in fade-in duration-1000" style={{ animationDelay: '1000ms', animationFillMode: 'both' }}>
              <style dangerouslySetInnerHTML={{__html: \`
                @keyframes fillLine {
                  0% { width: 0%; }
                  100% { width: 100%; }
                }
              \`}} />
              <Shield className="h-10 w-10 text-white/80 mb-6 animate-pulse" />
              <h2 className="text-2xl font-bold text-white tracking-[0.2em] uppercase mb-4">Request Sent</h2>
              
              <div className="w-48 h-[2px] bg-white/10 overflow-hidden mb-6 relative">
                <div className="absolute top-0 left-0 h-full bg-white" style={{ animation: 'fillLine 3s ease-in-out forwards' }} />
              </div>
              
              <p className="text-sm text-white/60 text-center max-w-sm px-4 mb-10 leading-relaxed font-medium">
                Your password reset request has been securely dispatched to the Super Admin for approval.
              </p>
              
              <button
                type="button"
                onClick={() => { setStep('credentials'); setForgotSuccess(false); }}
                className="inline-flex items-center text-[11px] uppercase tracking-wider font-semibold text-white/50 hover:text-white transition-colors"
              >
                <ArrowLeft className="h-3.5 w-3.5 mr-2" />
                Return to Sign In
              </button>
            </div>
          )}`;

content = content.replace(pane2InnerEnd, successOverlay);

fs.writeFileSync(path, content);
console.log('Successfully injected reset success reel animation');
