#!/bin/bash
# Update Sidebar.tsx
sed -i 's|<div className={`${theme.bg} w-9 h-9 rounded-xl shadow-lg ${theme.shadow} flex items-center justify-center text-xl`}>\s*🎓\s*</div>|<img src="/logo.jpg" alt="UniAce Logo" className="w-9 h-9 rounded-xl object-cover shadow-lg" />|g' src/components/Sidebar.tsx

# Update LandingPage.tsx
sed -i 's|<div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-200 dark:shadow-none text-2xl">\s*🎓\s*</div>|<img src="/logo.jpg" alt="UniAce Logo" className="w-10 h-10 rounded-xl shadow-lg shadow-emerald-200 dark:shadow-none object-cover" />|g' src/components/LandingPage.tsx
sed -i 's|<div className="w-8 h-8 bg-slate-900 dark:bg-zinc-800 rounded-lg flex items-center justify-center text-xl">\s*🎓\s*</div>|<img src="/logo.jpg" alt="UniAce Logo" className="w-8 h-8 rounded-lg object-cover" />|g' src/components/LandingPage.tsx
sed -i 's|<div className="w-12 h-12 bg-emerald-500 rounded-2xl flex items-center justify-center text-2xl mx-auto mb-4">\s*🎓\s*</div>|<img src="/logo.jpg" alt="UniAce Logo" className="w-12 h-12 rounded-2xl mx-auto mb-4 object-cover" />|g' src/components/LandingPage.tsx

# Update Dashboard.tsx
sed -i 's|🎓 Hi {user?.displayName?.split('\'' '\'')[0] || '\''Scholar'\''}|<img src="/logo.jpg" alt="UniAce Logo" className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl object-cover inline-block" /> Hi {user?.displayName?.split('\'' '\'')[0] || '\''Scholar'\''}|g' src/components/Dashboard.tsx

# Update AdminDashboard.tsx
sed -i 's|🎓 Admin Dashboard|<img src="/logo.jpg" alt="UniAce Logo" className="w-8 h-8 rounded-lg inline-block object-cover mr-2" /> Admin Dashboard|g' src/components/AdminDashboard.tsx
sed -i 's|<div className="text-3xl mb-1">🎓</div>|<img src="/logo.jpg" alt="UniAce Logo" className="w-12 h-12 object-cover rounded-xl mb-1 mx-auto" />|g' src/components/AdminDashboard.tsx
sed -i 's|welcome to the future of studying! 🎓|welcome to the future of studying!|g' src/components/AdminDashboard.tsx

# Update PaywallManager.tsx
sed -i 's|Your Premium Trial has Ended 🎓|Your Premium Trial has Ended|g' src/components/PaywallManager.tsx
