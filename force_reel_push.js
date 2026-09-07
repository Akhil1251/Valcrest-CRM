const fs = require('fs');
const path = 'D:/HelpVerse Projects/Portal HelpVerse/src/app/login/page.tsx';
let content = fs.readFileSync(path, 'utf8');

const startIndex = content.indexOf('  return (\n    <div className="flex h-screen bg-black overflow-hidden">');

if (startIndex !== -1) {
  const topPart = content.substring(0, startIndex);
  
  const newReturn = `  return (
    <div className="h-screen bg-black overflow-hidden relative w-full">
      
      {/* The Reel Container (max-content total, 3 panes of 50vw each) */}
      <div 
        className="flex h-full absolute top-0 left-0 transition-transform duration-[1500ms] ease-in-out"
        style={{ 
          width: 'max-content',
          transform: step === 'forgot_password' ? 'translateX(0)' : 'translateX(-50vw)'
        }}
      >
        
        {/* PANE 1: Forgot Password Form (50vw) */}
        <div className="w-[50vw] shrink-0 h-full relative flex flex-col items-center justify-center px-4 py-4 lg:py-8 bg-black overflow-y-auto">
          {/* Grain Overlay */}
          <div
            className="absolute inset-0 z-0 opacity-[0.05] pointer-events-none mix-blend-overlay"
            style={{ backgroundImage: 'url("https://grainy-gradients.vercel.app/noise.svg")' }}
          />

          <div className="w-full max-w-md z-10 relative">
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center mb-4 w-full">
                <img src="/Logo (2).png" alt="Helpverse Logo" className="w-32 md:w-40 h-auto object-contain max-w-full" />
              </div>
              <p className="mt-2 text-sm text-white/70 font-medium tracking-widest uppercase">
                Enterprise Management System
              </p>
            </div>

            <div className={\`rounded-3xl p-6 lg:px-8 lg:py-6 relative bg-black/40 backdrop-blur-2xl border w-full min-h-[400px] flex flex-col transition-all duration-500 \${
              errorMsg && step === 'forgot_password'
                ? 'shadow-[0_0_40px_rgba(239,68,68,0.4)] border-red-500/50' 
                : isTyping 
                  ? 'shadow-[0_0_40px_rgba(255,255,255,0.2)] border-white/40' 
                  : 'shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)] border-white/20'
            }\`}>
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-white/10 via-white/40 to-white/10" />

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
                    {errorMsg && step === 'forgot_password' && (
                      <div className="mb-4 p-2.5 rounded-lg bg-red-500/20 border border-red-500/50 text-red-200 text-xs flex items-center space-x-2 shadow-sm">
                        <span className="font-bold shrink-0">?</span>
                        <span className="leading-tight">{errorMsg}</span>
                      </div>
                    )}

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
            </div>
          </div>
        </div>

        {/* PANE 2: Logo Animation */}
        <div className={\`h-full shrink-0 relative flex items-center justify-center bg-black overflow-hidden transition-all duration-[2000ms] ease-in-out \${isSuccessAnimating ? 'w-[100vw]' : 'w-[50vw]'}\`}>
          <div className="loader-container">
            <div className="bg-glow"></div>
            <div className="h-wrapper">
              <div className="flare"></div>
              <div className="h-lines">
                <div className="line-loader line-left"></div>
                <div className="line-loader line-right"></div>
              </div>
            </div>
          </div>

          <div
            className="absolute inset-0 z-0 opacity-[0.05] pointer-events-none mix-blend-overlay"
            style={{ backgroundImage: 'url("https://grainy-gradients.vercel.app/noise.svg")' }}
          />

          <div className="absolute bottom-10 left-10 z-10 text-white/40 text-[10px] font-semibold tracking-[2px] text-left">
            HELPVERSE OPERATIONAL UNIT<br />
            GLOBAL ACCESS TERMINAL 01
          </div>
        </div>

        {/* PANE 3: Login Form */}
        <div className="w-[50vw] shrink-0 h-full relative flex flex-col items-center justify-center px-4 py-4 lg:py-8 bg-black overflow-y-auto">
          <div
            className="absolute inset-0 z-0 opacity-[0.05] pointer-events-none mix-blend-overlay"
            style={{ backgroundImage: 'url("https://grainy-gradients.vercel.app/noise.svg")' }}
          />

          <div className="w-full max-w-md z-10 relative">
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center mb-4 w-full">
                <img src="/Logo (2).png" alt="Helpverse Logo" className="w-32 md:w-40 h-auto object-contain max-w-full" />
              </div>
              <p className="mt-2 text-sm text-white/70 font-medium tracking-widest uppercase">
                Enterprise Management System
              </p>
            </div>

            <div className={\`rounded-3xl p-6 lg:px-8 lg:py-6 relative bg-black/40 backdrop-blur-2xl border w-full min-h-[400px] flex flex-col transition-all duration-500 \${
              errorMsg && step !== 'forgot_password'
                ? 'shadow-[0_0_40px_rgba(239,68,68,0.4)] border-red-500/50' 
                : isTyping 
                  ? 'shadow-[0_0_40px_rgba(255,255,255,0.2)] border-white/40' 
                  : 'shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)] border-white/20'
            }\`}>
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-white/10 via-white/40 to-white/10" />

              <div className="flex-1 flex flex-col justify-center">
                <h2 className="text-lg font-semibold text-white mb-2 text-center">
                  Sign In to your Account
                </h2>

                {errorMsg && step !== 'forgot_password' && (
                  <div className="mb-3 p-2.5 rounded-lg bg-red-500/20 border border-red-500/50 text-red-200 text-xs flex items-center space-x-2 shadow-sm">
                    <span className="font-bold shrink-0">?</span>
                    <span className="leading-tight">{errorMsg}</span>
                  </div>
                )}

                {infoMsg && (
                  <div className="mb-3 p-2.5 rounded-lg bg-blue-500/20 border border-blue-500/50 text-blue-200 text-xs flex items-center space-x-2 shadow-sm">
                    <span className="font-bold shrink-0">?</span>
                    <span className="leading-tight">{infoMsg}</span>
                  </div>
                )}

                {isEnrollment && qrCodeDataUrl && (
                  <div className="mb-4 text-center">
                    <button
                      type="button"
                      onClick={() => setShowQRModal(true)}
                      className="text-xs text-[#c79d62] hover:text-[#d4af7a] underline transition-colors"
                    >
                      View QR Code Setup Again
                    </button>
                  </div>
                )}

                {!isEnrollment && step === 'otp' && (
                  <div className="mb-4 text-center">
                    <div className="inline-flex items-center justify-center p-2 rounded-full bg-white/10 text-white mb-2 border border-white/20">
                      <Smartphone className="h-5 w-5" />
                    </div>
                    <h3 className="text-sm font-bold text-white">Two-Factor Authentication</h3>
                    <p className="text-xs text-white/70 mt-1">Open your authenticator app to view your code.</p>
                  </div>
                )}

                {(step === 'credentials' || step === 'forgot_password') && (
                  <form onSubmit={handleLogin} className="space-y-3">
                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-white/70 uppercase tracking-wider block">
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
                          onChange={(e) => setEmail(e.target.value)} onBlur={handleEmailBlur}
                          className="w-full pl-10 py-2.5 bg-white/5 border border-white/20 rounded-xl text-white placeholder-white/30 focus:border-white/50 focus:ring-1 focus:ring-white/50 transition-all text-sm outline-none"
                          disabled={loading}
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <label className="text-[11px] font-semibold text-white/70 uppercase tracking-wider block">
                          Password
                        </label>
                        <button
                          type="button"
                          onClick={() => { setStep('forgot_password'); setErrorMsg(''); setForgotSuccess(false); }}
                          className="text-[11px] font-medium text-white/60 hover:text-white transition-colors"
                        >
                          Forgot password?
                        </button>
                      </div>
                      <div className="relative">
                        <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-white/50">
                          <Lock className="h-4 w-4" />
                        </span>
                        <input
                          type={showPassword ? 'text' : 'password'}
                          required
                          placeholder="••••••••"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="w-full pl-10 py-2.5 bg-white/5 border border-white/20 rounded-xl text-white placeholder-white/30 focus:border-white/50 focus:ring-1 focus:ring-white/50 transition-all text-sm outline-none"
                          disabled={loading}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-white/50 hover:text-white transition-colors"
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center mt-2">
                      <input
                        id="remember"
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="h-3 w-3 rounded border-white/30 bg-white/5 text-white focus:ring-white/50"
                      />
                      <label htmlFor="remember" className="ml-2 block text-[11px] text-white/80 select-none">
                        Remember me for 30 days
                      </label>
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full py-2.5 px-4 mt-2 rounded-xl bg-white/10 hover:bg-white/20 backdrop-blur-md text-white font-medium text-sm flex items-center justify-center gap-2 shadow-xl shadow-black/20 transition-all duration-300 active:scale-[0.98] disabled:opacity-70 disabled:pointer-events-none cursor-pointer border border-white/10"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Signing In...
                        </>
                      ) : (
                        <>
                          Log In
                          <ArrowRight className="h-4 w-4 ml-1" />
                        </>
                      )}
                    </button>
                  </form>
                )}

                {step === 'otp' && (
                  <form onSubmit={handleVerifyOTP} className="space-y-4">
                    <div className="space-y-1">
                      <div className="relative">
                        <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-white/50">
                          <Smartphone className="h-5 w-5" />
                        </span>
                        <input
                          type="text"
                          required
                          maxLength={6}
                          placeholder="000000"
                          value={otp}
                          onChange={(e) => setOtp(e.target.value.replace(/\\D/g, ''))}
                          className="w-full pl-10 py-2.5 tracking-[0.3em] font-mono text-center bg-white/5 border border-white/20 rounded-xl text-white placeholder-white/30 focus:border-white/50 focus:ring-1 focus:ring-white/50 transition-all text-sm outline-none"
                          disabled={loading || isSuccessAnimating}
                        />
                      </div>
                    </div>
                    <button
                      type="submit"
                      disabled={loading || isSuccessAnimating || otp.length !== 6}
                      className="w-full py-2.5 px-4 mt-2 rounded-xl bg-white/10 hover:bg-white/20 backdrop-blur-md text-white font-medium text-sm flex items-center justify-center gap-2 shadow-xl shadow-black/20 transition-all duration-300 active:scale-[0.98] disabled:opacity-70 disabled:pointer-events-none cursor-pointer border border-white/10"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Verifying...
                        </>
                      ) : isSuccessAnimating ? (
                        <>
                          <Shield className="h-4 w-4" />
                          Success
                        </>
                      ) : (
                        <>
                          Verify & Log In
                          <ArrowRight className="h-4 w-4 ml-1" />
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => { setStep('credentials'); setOtp(''); setIsEnrollment(false); setOtpauthUrl(''); setSecretText(''); setInfoMsg(''); }}
                      className="w-full py-2 text-[11px] font-medium text-white/50 hover:text-white transition-colors"
                      disabled={loading || isSuccessAnimating}
                    >
                      Use a different account
                    </button>
                  </form>
                )}

                {step === 'intercept_otp' && (
                  <form onSubmit={handleInterceptOTP} className="space-y-4 mt-4">
                    <p className="text-xs text-white/60 text-center mb-4 leading-relaxed">
                      To proceed with changing your password, verify your identity using your original Authy token.
                    </p>
                    <div className="space-y-1">
                      <div className="relative">
                        <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-white/50">
                          <Shield className="h-4 w-4" />
                        </span>
                        <input
                          type="text"
                          required
                          maxLength={6}
                          placeholder="000000"
                          value={resetOtp}
                          onChange={(e) => setResetOtp(e.target.value.replace(/\\D/g, ''))}
                          className="w-full pl-10 py-2.5 tracking-[0.3em] font-mono text-center bg-white/5 border border-white/20 rounded-xl text-white placeholder-white/30 focus:border-white/50 focus:ring-1 focus:ring-white/50 transition-all text-sm outline-none"
                          disabled={loading}
                        />
                      </div>
                    </div>
                    <button
                      type="submit"
                      disabled={loading || resetOtp.length !== 6}
                      className="w-full py-2.5 px-4 mt-2 rounded-xl bg-white/10 hover:bg-white/20 backdrop-blur-md text-white font-medium text-sm flex items-center justify-center gap-2 shadow-xl shadow-black/20 transition-all duration-300 active:scale-[0.98] disabled:opacity-70 disabled:pointer-events-none cursor-pointer border border-white/10"
                    >
                      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Verify Code'}
                    </button>
                  </form>
                )}

                {step === 'intercept_password' && (
                  <form onSubmit={handleSetNewPassword} className="space-y-3 mt-4">
                    <p className="text-xs text-green-400 text-center mb-4 font-medium bg-green-500/10 py-2 rounded-lg border border-green-500/20">
                      Identity verified! Please set a new password.
                    </p>
                    <div className="space-y-1">
                      <div className="relative">
                        <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-white/50">
                          <Lock className="h-4 w-4" />
                        </span>
                        <input
                          type={showPassword ? 'text' : 'password'}
                          required
                          placeholder="New Password"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          className="w-full pl-10 py-2.5 bg-white/5 border border-white/20 rounded-xl text-white placeholder-white/30 focus:border-white/50 focus:ring-1 focus:ring-white/50 transition-all text-sm outline-none"
                          disabled={loading}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-white/50 hover:text-white transition-colors"
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="relative">
                        <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-white/50">
                          <Lock className="h-4 w-4" />
                        </span>
                        <input
                          type={showPassword ? 'text' : 'password'}
                          required
                          placeholder="Confirm New Password"
                          value={confirmNewPassword}
                          onChange={(e) => setConfirmNewPassword(e.target.value)}
                          className="w-full pl-10 py-2.5 bg-white/5 border border-white/20 rounded-xl text-white placeholder-white/30 focus:border-white/50 focus:ring-1 focus:ring-white/50 transition-all text-sm outline-none"
                          disabled={loading}
                        />
                      </div>
                    </div>
                    <button
                      type="submit"
                      disabled={loading || !newPassword || !confirmNewPassword}
                      className="w-full py-2.5 px-4 mt-2 rounded-xl bg-white/10 hover:bg-white/20 backdrop-blur-md text-white font-medium text-sm flex items-center justify-center gap-2 shadow-xl shadow-black/20 transition-all duration-300 active:scale-[0.98] disabled:opacity-70 disabled:pointer-events-none cursor-pointer border border-white/10"
                    >
                      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save New Password'}
                    </button>
                  </form>
                )}

              </div>
            </div>
            
            <div className="mt-8 text-center">
              <p className="text-[9px] text-white/30 font-semibold tracking-widest uppercase">
                &copy; 2026 HELPVERSE SYSTEMS. ALL RIGHTS RESERVED.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
`;
  
  const finalContent = topPart + newReturn + '\n}\n';
  fs.writeFileSync(path, finalContent);
  console.log('Successfully injected exact reel layout properly');
} else {
  console.log('Failed to find start index');
}
