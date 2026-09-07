const fs = require('fs');
const file = 'D:/HelpVerse Projects/Portal HelpVerse/src/app/login/page.tsx';
let content = fs.readFileSync(file, 'utf8');

// Inject sessionStorage set upon successful login (verifyOtp or interceptPassword)
content = content.replace(
  /if \(res\.success\) \{/,
  `if (res.success) {
        if (typeof window !== 'undefined') sessionStorage.setItem('hv_tab_session', 'true');`
);

content = content.replace(
  /if \(res\.success\) \{/, // Do it again for the interceptPasswordSubmit which also logs them in... wait, interceptPasswordSubmit redirects them to credentials to re-enroll in Authy. The actual login is verifyOtp.
  `if (res.success) {`
);

// We should use a regex that matches verifyOtp specifically
const verifyOtpRegex = /const res = await verifyTOTPAction\(null, formData\);\s*if \(res\.success\) \{/s;
if (content.match(verifyOtpRegex)) {
  content = content.replace(verifyOtpRegex, `const res = await verifyTOTPAction(null, formData);
      if (res.success) {
        if (typeof window !== 'undefined') sessionStorage.setItem('hv_tab_session', 'true');`);
  fs.writeFileSync(file, content);
  console.log('Updated login/page.tsx to set hv_tab_session');
} else {
  console.log('Failed to match verifyTOTPAction in login/page.tsx');
}
