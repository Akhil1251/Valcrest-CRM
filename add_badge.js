const fs = require('fs');
const path = 'D:/HelpVerse Projects/Portal HelpVerse/src/components/DashboardShell.tsx';
let content = fs.readFileSync(path, 'utf8');

if (!content.includes('getPendingResetRequestsCountAction')) {
  // 1. Add import
  content = content.replace(
    /import \{ logoutAction \} from '@\/app\/actions\/auth';/,
    "import { logoutAction, getPendingResetRequestsCountAction } from '@/app/actions/auth';"
  );
  
  // 2. Add state
  content = content.replace(
    /const \[unreadCount, setUnreadCount\] = useState\(0\);/,
    "const [unreadCount, setUnreadCount] = useState(0);\n  const [pendingResetCount, setPendingResetCount] = useState(0);"
  );
  
  // 3. Add to polling block
  const pollBlockRegex = /useEffect\(\(\) => \{\s*const fetchNotifs = async \(\) => \{\s*const notifs = await getNotificationsAction\(\);\s*setUnreadCount\(notifs\.filter\(\(n: any\) => !n\.is_read\)\.length\);\s*\};\s*fetchNotifs\(\);/s;
  
  const newPollBlock = `useEffect(() => {
    const fetchNotifs = async () => {
      const notifs = await getNotificationsAction();
      setUnreadCount(notifs.filter((n: any) => !n.is_read).length);
      
      if (user.role === 'super_admin') {
        const resetCount = await getPendingResetRequestsCountAction();
        setPendingResetCount(resetCount);
      }
    };
    fetchNotifs();`;
    
  content = content.replace(pollBlockRegex, newPollBlock);
  
  // 4. Render badge next to 'System Settings'
  const navItemRegex = /<Icon className=\{\`h-5 w-5 mr-3 \$\{isActive \? 'text-purple-600' : 'text-slate-400'\}\`\} \/>\s*\{item\.name\}\s*<\/Link>/s;
  const newNavItem = `<Icon className={\`h-5 w-5 mr-3 \${isActive ? 'text-purple-600' : 'text-slate-400'}\`} />
                  {item.name}
                  {item.id === 'settings' && pendingResetCount > 0 && (
                    <span className="ml-auto bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm shadow-red-500/30 animate-pulse">
                      {pendingResetCount}
                    </span>
                  )}
                </Link>`;
                
  content = content.replace(navItemRegex, newNavItem);
  
  fs.writeFileSync(path, content);
  console.log("Injected pending reset count to Sidebar");
}
