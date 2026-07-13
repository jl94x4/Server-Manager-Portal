const fs = require('fs');
const path = require('path');

const staticDir = path.join(__dirname, '..', 'static');

const BUILD_ARTIFACT = /^(index\.js|chunk-.+\.js|(?:Upgrader|Settings)Dashboard-.+\.js|RequestsAdminPanel-.+\.js|bundle\.js|tailwind\.css|release-notes\.json)$/;

if (!fs.existsSync(staticDir)) {
    process.exit(0);
}

let removed = 0;
for (const name of fs.readdirSync(staticDir)) {
    if (!BUILD_ARTIFACT.test(name)) continue;
    fs.unlinkSync(path.join(staticDir, name));
    removed += 1;
}

if (removed > 0) {
    console.log(`Removed ${removed} stale static build artifact(s).`);
}
