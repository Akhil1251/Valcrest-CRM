const fs = require('fs');
const path = 'D:/HelpVerse Projects/Portal HelpVerse/src/proxy.ts';
let content = fs.readFileSync(path, 'utf8');

// If user IS logged in and trying to access auth pages
const authRouteRegex = /if \(sessionToken && isAuthRoute\) \{[\s\S]*?return NextResponse\.redirect\(url\);\s*\}/s;

if (content.match(authRouteRegex)) {
  const newLogic = `if (sessionToken && isAuthRoute) {
    // If the URL specifically indicates a session restriction check (like a copied tab),
    // allow them to see the login page so they can re-authenticate for this tab.
    if (url.searchParams.has('error')) {
      return NextResponse.next();
    }
    
    // We don't decode the JWT here (Edge runtime doesn't support jsonwebtoken well).
    // Just send them to a default dashboard. The Server Components will correctly route them.
    url.pathname = '/employee/dashboard'; // Default fallback, Server Component will redirect to correct dashboard
    return NextResponse.redirect(url);
  }`;
  content = content.replace(authRouteRegex, newLogic);
  fs.writeFileSync(path, content);
  console.log('Fixed proxy.ts to allow login page when error param is present');
} else {
  console.log('Failed to match proxy.ts auth route logic');
}
