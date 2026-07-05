const fs = require('fs');
const glob = require('glob'); // Not available? I'll use child_process or simple recursive read

const path = require('path');

function walkSync(currentDirPath, callback) {
    fs.readdirSync(currentDirPath).forEach(function (name) {
        var filePath = path.join(currentDirPath, name);
        var stat = fs.statSync(filePath);
        if (stat.isFile()) {
            callback(filePath, stat);
        } else if (stat.isDirectory()) {
            walkSync(filePath, callback);
        }
    });
}

walkSync('src', function(filePath) {
    if (filePath.endsWith('.tsx') || filePath.endsWith('.ts')) {
        let content = fs.readFileSync(filePath, 'utf8');
        let modified = false;

        // Replace direct `olalekan4565@gmail.com` | `uniace.support@gmail.com`
        // Standard check: const isAdmin = profile?.role === 'admin' || user?.email === 'olalekan4565@gmail.com' || user?.email === 'uniace.support@gmail.com';
        const regex1 = /user\?\.email === 'olalekan4565@gmail\.com' \|\| user\?\.email === 'uniace\.support@gmail\.com'/g;
        if (regex1.test(content)) {
            content = content.replace(regex1, `(import.meta.env.VITE_ADMIN_EMAILS || '').split(',').includes(user?.email || '')`);
            modified = true;
        }

        const regex2 = /user\.email === 'uniace\.support@gmail\.com' \|\| user\.email === 'olalekan4565@gmail\.com'/g;
        if (regex2.test(content)) {
            content = content.replace(regex2, `(import.meta.env.VITE_ADMIN_EMAILS || '').split(',').includes(user.email)`);
            modified = true;
        }

        const regex3 = /\['olalekan4565@gmail\.com', 'uniace\.support@gmail\.com'\]/g;
        if (regex3.test(content)) {
            content = content.replace(regex3, `(import.meta.env.VITE_ADMIN_EMAILS || '').split(',')`);
            modified = true;
        }

        if (modified) {
            fs.writeFileSync(filePath, content, 'utf8');
            console.log("Updated: " + filePath);
        }
    }
});

let serverTs = fs.readFileSync('server.ts', 'utf8');
if (serverTs.includes("support_emails: ['uniace.support@gmail.com']")) {
    serverTs = serverTs.replace("support_emails: ['uniace.support@gmail.com']", "support_emails: [(process.env.SUPPORT_EMAIL || 'support@example.com')]");
    fs.writeFileSync('server.ts', serverTs, 'utf8');
    console.log("Updated server.ts");
}

