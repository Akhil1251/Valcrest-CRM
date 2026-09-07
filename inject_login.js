const fs = require('fs');
const path = 'D:/HelpVerse Projects/Portal HelpVerse/src/app/login/page.tsx';
let content = fs.readFileSync(path, 'utf8');

// 1. Add forgotPasswordAction to imports
if (!content.includes('forgotPasswordAction')) {
  content = content.replace(
    /import \{ loginAction, checkResetStatusAction, resetPasswordSecureAction \} from '\.\.\/actions\/auth';/,
    `import { loginAction, checkResetStatusAction, resetPasswordSecureAction, forgotPasswordAction } from '../actions/auth';`
  );
}

// 2. Add 'forgot_password' to step state
content = content.replace(
  /useState\<'credentials' \| 'otp' \| 'intercept_otp' \| 'intercept_password'\>\('credentials'\);/,
  `useState<'credentials' | 'otp' | 'intercept_otp' | 'intercept_password' | 'forgot_password'>('credentials');`
);

// 3. Add Forgot Password state variables (if not present)
if (!content.includes('forgotSuccess')) {
  content = content.replace(
    /const \[isTyping, setIsTyping\] = useState\(false\);/,
    `const [isTyping, setIsTyping] = useState(false);\n  const [forgotSuccess, setForgotSuccess] = useState(false);`
  );
}

// 4. Inject handleForgotPassword function
const handleForgotPasswordStr = `
  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setForgotSuccess(false);

    if (!email) {
      setErrorMsg('Email address is required.');
      return;
    }
    if (!/\\S+@\\S+\\.\\S+/.test(email)) {
      setErrorMsg('Please enter a valid email address.');
      return;
    }
    if (!otp || otp.length !== 6) {
      setErrorMsg('A valid 6-digit Authy code is required.');
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('email', email);
      formData.append('otp', otp);

      const res = await forgotPasswordAction(null, formData);
      if (res.success) {
        setForgotSuccess(true);
      } else {
        setErrorMsg(res.error || 'Failed to send request.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };
`;
if (!content.includes('handleForgotPassword')) {
  content = content.replace(
    /const handleLogin = async \(e: React\.FormEvent\) => \{/,
    handleForgotPasswordStr + '\n  const handleLogin = async (e: React.FormEvent) => {'
  );
}

// 5. Update Left Column animation
// Replace: ${isSuccessAnimating ? 'w-full' : 'w-1/2'}
// With: ${isSuccessAnimating ? 'w-full' : 'w-1/2'} ${step === 'forgot_password' && !isSuccessAnimating ? 'translate-x-full' : 'translate-x-0'}
content = content.replace(
  /className=\{`hidden lg:flex relative items-center justify-center bg-black overflow-hidden transition-all duration-\[2000ms\] ease-in-out \$\{isSuccessAnimating \? 'w-full' : 'w-1\/2'\}`\}/g,
  "className={`hidden lg:flex relative items-center justify-center bg-black overflow-hidden transition-all duration-[2000ms] ease-in-out z-10 ${isSuccessAnimating ? 'w-full' : 'w-1/2'} ${step === 'forgot_password' && !isSuccessAnimating ? 'translate-x-full' : 'translate-x-0'}`}"
);

// 6. Update Right Column animation
// Replace: ${isSuccessAnimating ? 'lg:w-0 opacity-0 translate-x-full' : 'lg:w-1/2 translate-x-0'}
// With: ${isSuccessAnimating ? 'lg:w-0 opacity-0 translate-x-full' : `lg:w-1/2 ${step === 'forgot_password' ? '-translate-x-full' : 'translate-x-0'}`}
content = content.replace(
  /className=\{`w-full relative flex flex-col items-center justify-center px-4 py-4 lg:py-8 bg-black overflow-y-auto max-h-screen transition-all duration-\[2000ms\] ease-in-out \$\{isSuccessAnimating \? 'lg:w-0 opacity-0 translate-x-full' : 'lg:w-1\/2 translate-x-0'\}`\}/g,
  "className={`w-full relative flex flex-col items-center justify-center px-4 py-4 lg:py-8 bg-black overflow-y-auto max-h-screen transition-all duration-[2000ms] ease-in-out z-20 ${isSuccessAnimating ? 'lg:w-0 opacity-0 translate-x-full' : `lg:w-1/2 ${step === 'forgot_password' ? '-translate-x-full' : 'translate-x-0'}`}`}"
);

// 7. Swap the link href for Forgot Password
content = content.replace(
  /<Link\s*href="\/forgot-password\?bypass=true"\s*className="text-\[11px\] font-medium text-white\/60 hover:text-white transition-colors"\s*>\s*Forgot password\?\s*<\/Link>/s,
  `<button
                      type="button"
                      onClick={() => { setStep('forgot_password'); setErrorMsg(''); setForgotSuccess(false); }}
                      className="text-[11px] font-medium text-white/60 hover:text-white transition-colors"
                    >
                      Forgot password?
                    </button>`
);

// 8. Add Forgot Password Form UI inside the form card
// Right before {step === 'credentials' ? ( ... )}
const forgotPasswordJSX = `
            {step === 'forgot_password' ? (
              <div className="flex-1 flex flex-col justify-center">
                <h2 className="text-lg font-semibold text-white mb-2 text-center">
                  Reset Request
                </h2>

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
                    <p className="text-[11px] text-white/50 leading-relaxed mb-6 text-center">
                      To prevent unauthorized resets, you must verify your identity with your current Authy token. 
                      Once verified, the Super Admin must approve your request before you can change your password.
                    </p>

                    <form onSubmit={handleForgotPassword} className="space-y-4 flex-1 flex flex-col justify-between">
                      <div className="space-y-4">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-white/60 tracking-wider uppercase block">
                            Email Address
                          </label>
                          <div className="relative">
                            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-white/50">
                              <Mail className="h-4 w-4" />
                            </span>
                            <input
                              type="email"
                              required
                              placeholder="name@company.com"
                              value={email}
                              onChange={(e) => setEmail(e.target.value)}
                              className="w-full pl-10 py-2.5 bg-white/5 border border-white/20 rounded-xl text-white placeholder-white/30 focus:border-white/50 focus:ring-1 focus:ring-white/50 transition-all text-sm outline-none"
                              disabled={loading}
                            />
                          </div>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-white/60 tracking-wider uppercase block">
                            Authy Authenticator Code
                          </label>
                          <div className="relative">
                            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-white/50">
                              <Shield className="h-4 w-4" />
                            </span>
                            <input
                              type="text"
                              required
                              maxLength={6}
                              placeholder="123456"
                              value={otp}
                              onChange={(e) => setOtp(e.target.value.replace(/\\D/g, ''))}
                              className="w-full pl-10 py-2.5 bg-white/5 border border-white/20 rounded-xl text-white placeholder-white/30 focus:border-white/50 focus:ring-1 focus:ring-white/50 transition-all text-sm outline-none tracking-[0.3em] font-mono"
                              disabled={loading}
                            />
                          </div>
                        </div>
                      </div>

                      <div className="mt-8 space-y-4">
                        <button
                          type="submit"
                          disabled={loading}
                          className="w-full py-2.5 px-4 mt-2 rounded-xl bg-white/10 hover:bg-white/20 backdrop-blur-md text-white font-medium text-sm flex items-center justify-center gap-2 shadow-xl shadow-black/20 transition-all duration-300 active:scale-[0.98] disabled:opacity-70 disabled:pointer-events-none cursor-pointer border border-white/10"
                        >
                          {loading ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin" />
                              Verifying...
                            </>
                          ) : (
                            <>
                              Submit Request
                              <ArrowRight className="h-4 w-4 ml-1" />
                            </>
                          )}
                        </button>

                        <div className="text-center">
                          <button
                            type="button"
                            onClick={() => setStep('credentials')}
                            className="inline-flex items-center text-[10px] font-medium tracking-wide text-white/40 hover:text-white transition-colors"
                          >
                            <ArrowLeft className="h-3 w-3 mr-1" />
                            Return to Sign In
                          </button>
                        </div>
                      </div>
                    </form>
                  </div>
                )}
              </div>
            ) : `;

if (!content.includes("step === 'forgot_password'")) {
  content = content.replace(
    /\{step === 'credentials' \? \(/,
    forgotPasswordJSX + "{step === 'credentials' ? ("
  );
}

// Ensure Sign In text hides when forgot_password
content = content.replace(
  /<h2 className="text-lg font-semibold text-white mb-2 text-center">\s*Sign In to your Account\s*<\/h2>/,
  `{step !== 'forgot_password' && <h2 className="text-lg font-semibold text-white mb-2 text-center">Sign In to your Account</h2>}`
);

fs.writeFileSync(path, content);
console.log('Successfully injected forgot_password step and sliding animations into login/page.tsx');
