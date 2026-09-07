const fs = require('fs');
const path = 'D:/HelpVerse Projects/Portal HelpVerse/src/proxy.ts';
let content = fs.readFileSync(path, 'utf8');

// If they hit /forgot-password, redirect to login
const forgotRedirect = `
  // Deprecated route redirect
  if (path.startsWith('/forgot-password')) {
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }
`;

if (!content.includes('Deprecated route redirect')) {
  content = content.replace(
    /const sessionToken = request\.cookies\.get\('hv_session_token'\);/,
    forgotRedirect + '\n  const sessionToken = request.cookies.get(\'hv_session_token\');'
  );
  fs.writeFileSync(path, content);
  console.log('Added forgot-password redirect to proxy.ts');
}
