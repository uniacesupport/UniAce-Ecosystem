const fs = require('fs');
let server = fs.readFileSync('server.ts', 'utf8');

server = server.replace(
  /process\.on\('uncaughtException', \(err\) => \{\n  console\.error\('UNCAUGHT EXCEPTION:', err\);\n\}\);\n\nprocess\.on\('unhandledRejection', \(reason, promise\) => \{\n  console\.error\('UNHANDLED REJECTION at:', promise, 'reason:', reason\);\n\}\);/g,
  `process.on('uncaughtException', (err) => {
  console.error('CRITICAL: UNCAUGHT EXCEPTION:', err);
  // Give it a moment to flush logs then exit cleanly to allow supervisor to restart
  setTimeout(() => process.exit(1), 1000);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('CRITICAL: UNHANDLED REJECTION at:', promise, 'reason:', reason);
  setTimeout(() => process.exit(1), 1000);
});`
);

fs.writeFileSync('server.ts', server);
console.log("Done");
