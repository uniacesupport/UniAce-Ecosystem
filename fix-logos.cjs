const fs = require('fs');

function replaceFile(path, replacer) {
  let content = fs.readFileSync(path, 'utf8');
  content = replacer(content);
  fs.writeFileSync(path, content);
}

replaceFile('src/components/Sidebar.tsx', c => 
  c.replace(/<div className={`\$\{theme\.bg\} w-9 h-9 rounded-xl shadow-lg \$\{theme\.shadow\} flex items-center justify-center text-xl`}>\s*🎓\s*<\/div>/g, 
    '<img src="/logo.jpg" alt="UniAce Logo" className="w-9 h-9 rounded-xl object-cover shadow-lg" />')
);

replaceFile('src/components/LandingPage.tsx', c => {
  let nc = c.replace(/<div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-200 dark:shadow-none text-2xl">\s*🎓\s*<\/div>/g, 
    '<img src="/logo.jpg" alt="UniAce Logo" className="w-10 h-10 rounded-xl shadow-lg shadow-emerald-200 dark:shadow-none object-cover" />');
  nc = nc.replace(/<div className="w-8 h-8 bg-slate-900 dark:bg-zinc-800 rounded-lg flex items-center justify-center text-xl">\s*🎓\s*<\/div>/g, 
    '<img src="/logo.jpg" alt="UniAce Logo" className="w-8 h-8 rounded-lg object-cover" />');
  nc = nc.replace(/<div className="w-12 h-12 bg-emerald-500 rounded-2xl flex items-center justify-center text-2xl mx-auto mb-4">\s*🎓\s*<\/div>/g, 
    '<img src="/logo.jpg" alt="UniAce Logo" className="w-12 h-12 rounded-2xl mx-auto mb-4 object-cover" />');
  return nc;
});

replaceFile('src/components/Dashboard.tsx', c => 
  c.replace(/🎓 Hi \{user\?\.displayName\?\.split\(' '\)\[0\] \|\| 'Scholar'\}/g, 
    '<img src="/logo.jpg" alt="UniAce Logo" className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl object-cover inline-block" /> Hi {user?.displayName?.split(\' \')[0] || \'Scholar\'}')
);

replaceFile('src/components/AdminDashboard.tsx', c => {
  let nc = c.replace(/🎓 Admin Dashboard/g, '<img src="/logo.jpg" alt="UniAce Logo" className="w-8 h-8 rounded-lg inline-block object-cover mr-2" /> Admin Dashboard');
  nc = nc.replace(/<div className="text-3xl mb-1">🎓<\/div>/g, '<img src="/logo.jpg" alt="UniAce Logo" className="w-12 h-12 object-cover rounded-xl mb-1 mx-auto" />');
  nc = nc.replace(/welcome to the future of studying! 🎓/g, 'welcome to the future of studying!');
  return nc;
});

replaceFile('src/components/PaywallManager.tsx', c => 
  c.replace(/Your Premium Trial has Ended 🎓/g, 'Your Premium Trial has Ended')
);

console.log('Replaced successfully');
