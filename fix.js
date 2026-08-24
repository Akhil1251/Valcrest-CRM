const fs = require('fs');
const file = 'D:/HelpVerse Projects/Portal HelpVerse/src/app/actions/payroll.ts';
let content = fs.readFileSync(file, 'utf8');

const regex = /total_working_days:\s*payableDays,\s*unpaid_leaves:\s*unpaidLeaves > 0 \? unpaidLeaves : 0,/;
const replacement = `total_working_days: Math.round(payableDays),
        unpaid_leaves: Math.round(unpaidLeaves > 0 ? unpaidLeaves : 0),`;

if (content.match(regex)) {
  content = content.replace(regex, replacement);
  fs.writeFileSync(file, content);
  console.log('Fixed integer bug in payroll.ts');
} else {
  console.log('Regex did not match!');
}
