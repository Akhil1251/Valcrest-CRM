const fs = require('fs');
const path = 'D:/HelpVerse Projects/Portal HelpVerse/src/components/SessionGuard.tsx';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(
  /import \{ logoutAction \} from '@\/app\/actions\/auth';/,
  `import { logoutAction, checkIdleStatusAction } from '@/app/actions/auth';`
);

const fetchRepl = `          // We use the server action to verify attendance status
          const res = await checkIdleStatusAction();
          if (res.success && res.isActive) {
            // User is clocked in. Do NOT log them out.
            return;
          }`;

content = content.replace(
  /const today = new Date\(\)\.toISOString\(\)\.split\('T'\)\[0\];.*?catch \(e\) \{/s,
  fetchRepl + "\n        } catch (e) {"
);

fs.writeFileSync(path, content);
console.log('Fixed SessionGuard to use checkIdleStatusAction');
