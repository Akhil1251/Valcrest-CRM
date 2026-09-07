const fs = require('fs');
const file = 'D:/HelpVerse Projects/Portal HelpVerse/src/app/login/page.tsx';
let content = fs.readFileSync(file, 'utf8');

// We need to add checkResetStatusAction to the imports from auth.ts
if (!content.includes('checkResetStatusAction')) {
  content = content.replace(
    /import \{ loginAction \} from '\.\.\/actions\/auth';/,
    `import { loginAction, checkResetStatusAction, resetPasswordSecureAction } from '../actions/auth';`
  );

  // Add state for reset interception
  content = content.replace(
    /const \[step, setStep\] = useState<'credentials' \| 'otp'>\('credentials'\);/,
    `const [step, setStep] = useState<'credentials' | 'otp' | 'intercept_otp' | 'intercept_password'>('credentials');
  const [resetRequestId, setResetRequestId] = useState<string | null>(null);
  const [resetOtp, setResetOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');`
  );

  // Add onBlur to check email
  const checkEmailFunc = `
  const handleEmailBlur = async () => {
    if (!email || !/\\S+@\\S+\\.\\S+/.test(email)) return;
    try {
      const res = await checkResetStatusAction(email);
      if (res.approved && res.requestId) {
        setResetRequestId(res.requestId);
        setStep('intercept_otp');
        setInfoMsg('Your password reset request was approved! Please verify with your old Authy code.');
      }
    } catch (e) {
      console.error(e);
    }
  };
  `;
  content = content.replace(/const handleLogin = async \(e: React\.FormEvent\) => \{/, checkEmailFunc + '\n  const handleLogin = async (e: React.FormEvent) => {');

  // Add onBlur to email input
  content = content.replace(
    /onChange=\{\(e\) => setEmail\(e\.target\.value\)\}/,
    `onChange={(e) => setEmail(e.target.value)} onBlur={handleEmailBlur}`
  );

  // Add handlers for intercept
  const interceptHandlers = `
  const handleInterceptOtpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetOtp || resetOtp.length !== 6) {
      setErrorMsg('Enter a valid 6-digit Authy code.');
      return;
    }
    setStep('intercept_password');
    setInfoMsg('');
    setErrorMsg('');
  };

  const handleInterceptPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      setErrorMsg('Password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('email', email);
      formData.append('otp', resetOtp);
      formData.append('password', newPassword);
      formData.append('requestId', resetRequestId || '');
      
      const res = await resetPasswordSecureAction(null, formData);
      if (res.success) {
        setInfoMsg('Password securely updated and 2FA wiped. Please log in with your new password to re-enroll in Authy.');
        setStep('credentials');
        setPassword('');
        setResetOtp('');
        setNewPassword('');
        setConfirmNewPassword('');
      } else {
        setErrorMsg(res.error || 'Failed to reset password. The OTP might be invalid.');
      }
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };
  `;
  content = content.replace(/const verifyOtp = async \(e: React\.FormEvent\) => \{/, interceptHandlers + '\n  const verifyOtp = async (e: React.FormEvent) => {');

  // Add UI sections
  const interceptUI = `
            {step === 'intercept_otp' && (
              <form onSubmit={handleInterceptOtpSubmit} className="space-y-6">
                <div className="text-center mb-6">
                  <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 mb-4">
                    <Shield className="h-8 w-8 text-amber-400" />
                  </div>
                  <h3 className="text-xl font-bold text-white">Security Verification</h3>
                  <p className="text-sm text-slate-400 mt-2">Enter your OLD Authy code to authorize this reset.</p>
                </div>
                
                <div className="space-y-1">
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                      <Lock className="h-5 w-5" />
                    </span>
                    <input
                      type="text"
                      required
                      maxLength={6}
                      placeholder="123456"
                      value={resetOtp}
                      onChange={(e) => setResetOtp(e.target.value.replace(/\\D/g, ''))}
                      className="w-full pl-11 form-input text-lg tracking-widest text-center"
                      disabled={loading}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-medium text-sm flex items-center justify-center gap-2 shadow-lg transition-all duration-300"
                >
                  Verify Old Authy Code <ArrowRight className="h-4 w-4" />
                </button>
              </form>
            )}

            {step === 'intercept_password' && (
              <form onSubmit={handleInterceptPasswordSubmit} className="space-y-5">
                <div className="text-center mb-6">
                  <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 mb-4">
                    <Lock className="h-8 w-8 text-emerald-400" />
                  </div>
                  <h3 className="text-xl font-bold text-white">Set New Password</h3>
                  <p className="text-sm text-slate-400 mt-2">Your reset request is approved and authorized.</p>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-300 block">New Password</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      placeholder="••••••••"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full pl-4 pr-10 form-input text-sm"
                      disabled={loading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-300 transition-colors"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-300 block">Confirm New Password</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      placeholder="••••••••"
                      value={confirmNewPassword}
                      onChange={(e) => setConfirmNewPassword(e.target.value)}
                      className="w-full pl-4 pr-10 form-input text-sm"
                      disabled={loading}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-medium text-sm flex items-center justify-center gap-2 shadow-lg transition-all duration-300"
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Confirm & Reset Password'}
                </button>
              </form>
            )}
  `;

  content = content.replace(/\{step === 'credentials' && \(/, interceptUI + "\n            {step === 'credentials' && (");

  fs.writeFileSync(file, content);
  console.log('Successfully updated login page');
} else {
  console.log('Already updated or regex mismatch');
}
