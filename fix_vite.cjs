const fs = require('fs');
let content = fs.readFileSync('vite.config.ts', 'utf8');

content = content.replace(/includeAssets: \['icon.svg'\]/, "includeAssets: ['logo192.png', 'logo512.png']");
content = content.replace(/icons: \[[\s\S]*?\]\s*\},/m, `icons: [
            {
              src: 'logo192.png',
              sizes: '192x192',
              type: 'image/png',
              purpose: 'any maskable'
            },
            {
              src: 'logo512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any maskable'
            }
          ]
        },`);

fs.writeFileSync('vite.config.ts', content);
console.log('Fixed vite.config.ts');
