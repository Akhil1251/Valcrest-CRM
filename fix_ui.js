const fs = require('fs');
const file = 'D:/HelpVerse Projects/Portal HelpVerse/src/components/CRMPortal.tsx';
let content = fs.readFileSync(file, 'utf8');

const regex = /<div className="flex items-center gap-4">\s*<div className="text-sm font-bold text-slate-500">Pipeline Stage:<\/div>/;
const replacement = `<div className="flex items-center gap-4">
              {user?.role === 'super_admin' && (
                <div className="flex items-center gap-2 mr-2 border-r border-slate-200 pr-4">
                  <button onClick={() => setActivePane('edit')} className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-xs font-bold transition-colors">Edit</button>
                  <button onClick={() => handleDeleteLead(lead.id)} className="px-3 py-1.5 bg-red-100 hover:bg-red-200 text-red-700 rounded text-xs font-bold transition-colors">Delete</button>
                </div>
              )}
              <div className="text-sm font-bold text-slate-500">Pipeline Stage:</div>`;

if (content.match(regex)) {
  content = content.replace(regex, replacement);
  fs.writeFileSync(file, content);
  console.log('UI updated successfully.');
} else {
  console.log('Regex did not match!');
}
