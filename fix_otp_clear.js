const fs = require('fs');
const path = 'D:/HelpVerse Projects/Portal HelpVerse/src/app/login/page.tsx';
let content = fs.readFileSync(path, 'utf8');

// 1. Clear OTP on "Forgot password?" button click
content = content.replace(
  /onClick=\{\(\) => \{ setStep\('forgot_password'\); setErrorMsg\(''\); setForgotSuccess\(false\); \}\}/,
  "onClick={() => { setStep('forgot_password'); setErrorMsg(''); setForgotSuccess(false); setOtp(''); }}"
);

// 2. Clear OTP on failed forgotPasswordAction
content = content.replace(
  /setErrorMsg\(res\.error \|\| 'Failed to send request\.'\);\s*\}/,
  "setErrorMsg(res.error || 'Failed to send request.');\n          setOtp('');\n        }"
);

// 3. Clear OTP on catch block in handleForgotPassword
content = content.replace(
  /setErrorMsg\(err\.message \|\| 'An unexpected error occurred\.'\);\s*\}/,
  "setErrorMsg(err.message || 'An unexpected error occurred.');\n        setOtp('');\n      }"
);

// 4. (Optional) Also clear OTP when returning to sign in from the success screen, just in case
content = content.replace(
  /onClick=\{\(\) => \{ setStep\('credentials'\); setForgotSuccess\(false\); \}\}/,
  "onClick={() => { setStep('credentials'); setForgotSuccess(false); setOtp(''); }}"
);


fs.writeFileSync(path, content);
console.log('Fixed OTP clearing logic');
