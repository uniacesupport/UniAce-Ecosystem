const fs = require('fs');
let content = fs.readFileSync('src/components/PWAInstallPrompt.tsx', 'utf8');

// The banner currently is not visible by default on mobile unless a prompt event happens. 
// However if Safari or iOS is used, the event never fires. 
// We will simply display it aggressively for non-installed users on the landing page for demonstration.

content = content.replace(/const handleBeforeInstallPrompt = \(e: any\) => {[\s\S]*?return \(\) => clearTimeout\(timer\);\n    };/m, `const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      const hasDeclined = localStorage.getItem('pwa_prompt_declined') === 'true';
      if (hasDeclined) return;
      setDeferredPrompt(e);
      const timer = setTimeout(() => {
        if (!isStandalone) {
          setIsVisible(true);
        }
      }, user ? 5000 : 2000);
      return () => clearTimeout(timer);
    };
    
    // Check if we are on iOS/Safari which doesn't support beforeinstallprompt easily
    const isIos = () => {
      const userAgent = window.navigator.userAgent.toLowerCase();
      return /iphone|ipad|ipod/.test(userAgent);
    };
    
    // Aggressive fallback for unauthenticated users (Landing page) if they haven't declined
    if (!user && !isStandalone && localStorage.getItem('pwa_prompt_declined') !== 'true') {
      setTimeout(() => setIsVisible(true), 1500);
    }`);

fs.writeFileSync('src/components/PWAInstallPrompt.tsx', content);
console.log('Fixed iOS display');
