const fs = require('fs');
let content = fs.readFileSync('src/components/PWAInstallPrompt.tsx', 'utf8');

content = content.replace(/let aggressiveTimer: any;[\s\S]*?window.addEventListener\('appinstalled'/m, `let aggressiveTimer: any;
    if (!isStandalone && !hasDeclined) {
      aggressiveTimer = setTimeout(() => {
        setIsVisible(true);
      }, user ? 3000 : 1500);
    }

    window.addEventListener('appinstalled'`);

fs.writeFileSync('src/components/PWAInstallPrompt.tsx', content);
