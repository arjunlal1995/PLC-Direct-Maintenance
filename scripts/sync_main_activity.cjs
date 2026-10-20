const fs = require('fs');

const fileContent = fs.readFileSync('src/data/codebaseFiles.ts', 'utf8');
const searchMarker = "path: 'app/src/main/java/com/plc/directmaintenance/MainActivity.kt'";
const pos = fileContent.indexOf(searchMarker);
if (pos === -1) {
  console.error('Marker not found');
  process.exit(1);
}

const contentMarker = 'content: `';
const contentStart = fileContent.indexOf(contentMarker, pos) + contentMarker.length;
const nextMarker = "path: 'app/src/main/java/com/plc/directmaintenance/notifications/NotificationHelper.kt'";
const nextPos = fileContent.indexOf(nextMarker, contentStart);
const contentEnd = fileContent.lastIndexOf('`,', nextPos);

const code = fileContent.substring(contentStart, contentEnd);
fs.writeFileSync('app/src/main/java/com/plc/directmaintenance/MainActivity.kt', code, 'utf8');
console.log('Successfully synced MainActivity.kt to /app/src/main/java/com/plc/directmaintenance/MainActivity.kt! Size:', code.length);
