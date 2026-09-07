const fs = require('fs');
const file = 'D:/HelpVerse Projects/Portal HelpVerse/src/app/actions/auth.ts';
let content = fs.readFileSync(file, 'utf8');

// Find the dangling block starting with `// Generate a mock reset token` and ending just before `export async function resetPasswordAction`
const startStr = "  // Generate a mock reset token valid for 15 minutes";
const endStr = "export async function resetPasswordAction";

const startIndex = content.indexOf(startStr);
const endIndex = content.indexOf(endStr);

if (startIndex !== -1 && endIndex !== -1) {
  content = content.substring(0, startIndex) + content.substring(endIndex);
  fs.writeFileSync(file, content);
  console.log('Fixed dangling code in auth.ts');
} else {
  console.log('Could not find indices to fix auth.ts');
}
