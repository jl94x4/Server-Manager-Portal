import fs from 'fs';
import { execSync } from 'child_process';
try {
    const hash = execSync('git rev-parse --short HEAD', { stdio: 'pipe' }).toString().trim();
    fs.writeFileSync('version.txt', 'v1.0.0-' + hash);
} catch (e) {
    if (!fs.existsSync('version.txt')) {
        fs.writeFileSync('version.txt', 'v1.0.0');
    }
}