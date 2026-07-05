const fs = require('fs');

const path = 'src/components/ContentArea.tsx';
let content = fs.readFileSync(path, 'utf8');

// The original line:
// const isAdmin = profile?.role === 'admin' || user?.email === 'olalekan4565@gmail.com' || user?.email === 'uniace.support@gmail.com';
content = content.replace(
  /const isAdmin = profile\?\.role === 'admin' \|\| user\?\.email === 'olalekan4565@gmail\.com' \|\| user\?\.email === 'uniace\.support@gmail\.com';/g,
  `const adminEmails = (import.meta.env.VITE_ADMIN_EMAILS || '').split(',').map((e: string) => e.trim().toLowerCase());
  const isAdmin = profile?.role === 'admin' || (user?.email && adminEmails.includes(user.email.toLowerCase()));`
);

fs.writeFileSync(path, content);
console.log("Done");
