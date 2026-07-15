const fs = require('fs');
let content = fs.readFileSync('src/components/PWAInstallPrompt.tsx', 'utf8');

content = content.replace(/if \(!isStandalone && !hasDeclined\) {[\s\S]*?}/m, `if (!isStandalone && !hasDeclined) {
      aggressiveTimer = setTimeout(() => {
        setIsVisible(true);
      }, user ? 3000 : 1500);
    }`);

fs.writeFileSync('src/components/PWAInstallPrompt.tsx', content);
console.log('Fixed PWA prompt final');
