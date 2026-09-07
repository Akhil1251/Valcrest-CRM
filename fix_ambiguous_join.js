const fs = require('fs');
const path = 'D:/HelpVerse Projects/Portal HelpVerse/src/app/actions/auth.ts';
let content = fs.readFileSync(path, 'utf8');

const targetQuery = `.select('*, users(email, full_name)')`;
const replaceQuery = `.select('*, users:user_id(email, full_name)')`;

if (content.includes(targetQuery)) {
  content = content.replace(targetQuery, replaceQuery);
  fs.writeFileSync(path, content);
  console.log("Successfully fixed ambiguous foreign key relationship in auth.ts!");
} else {
  console.log("Failed to find target query in auth.ts");
}
