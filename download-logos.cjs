const fs = require('fs');
const path = require('path');
const https = require('https');

const logos = {
    // Studios
    'walt-disney': 'https://upload.wikimedia.org/wikipedia/commons/a/a4/Walt_Disney_Pictures_2011_logo.svg',
    '20th-century': 'https://upload.wikimedia.org/wikipedia/commons/c/c5/20th_Century_Studios_2020_logo.svg',
    'sony-pictures': 'https://upload.wikimedia.org/wikipedia/commons/c/c4/Sony_Pictures_Entertainment_logo.svg',
    'warner-bros': 'https://upload.wikimedia.org/wikipedia/commons/6/64/Warner_Bros_logo.svg',
    'universal': 'https://upload.wikimedia.org/wikipedia/commons/e/ec/Universal_Pictures_logo.svg',
    'paramount': 'https://upload.wikimedia.org/wikipedia/commons/8/89/Paramount_Pictures_2022.svg',
    'a24': 'https://upload.wikimedia.org/wikipedia/commons/b/ba/A24_logo.svg',

    // Networks
    'netflix': 'https://upload.wikimedia.org/wikipedia/commons/0/08/Netflix_2015_logo.svg',
    'disney-plus': 'https://upload.wikimedia.org/wikipedia/commons/3/3e/Disney%2B_logo.svg',
    'prime-video': 'https://upload.wikimedia.org/wikipedia/commons/1/11/Amazon_Prime_Video_logo.svg',
    'apple-tv': 'https://upload.wikimedia.org/wikipedia/commons/2/28/Apple_TV_Plus_Logo.svg',
    'hulu': 'https://upload.wikimedia.org/wikipedia/commons/e/e4/Hulu_Logo.svg',
    'hbo': 'https://upload.wikimedia.org/wikipedia/commons/d/de/HBO_logo.svg',
    'bbc': 'https://upload.wikimedia.org/wikipedia/commons/5/5f/BBC_logo_white.svg',
    'itv': 'https://upload.wikimedia.org/wikipedia/commons/0/03/ITV_logo_2013.svg',
    'sky': 'https://upload.wikimedia.org/wikipedia/commons/0/07/Sky_logo_2020.svg',
};

const targetDir = path.join(__dirname, 'static', 'logos');
if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
}

function downloadImage(url, filepath) {
    return new Promise((resolve, reject) => {
        https.get(url, {
            headers: {
                'User-Agent': 'ServerManagerPortal/1.6.0 (PlexDiscoveryTool) test/1.0'
            }
        }, (res) => {
            if (res.statusCode === 301 || res.statusCode === 302 || res.statusCode === 308) {
                return downloadImage(res.headers.location, filepath).then(resolve).catch(reject);
            }
            if (res.statusCode !== 200) {
                reject(new Error(`Failed to get '${url}' (${res.statusCode})`));
                return;
            }
            const file = fs.createWriteStream(filepath);
            res.pipe(file);
            file.on('finish', () => {
                file.close();
                resolve();
            });
            file.on('error', (err) => {
                fs.unlink(filepath, () => reject(err));
            });
        }).on('error', (err) => {
            reject(err);
        });
    });
}

const sleep = ms => new Promise(r => setTimeout(r, ms));

async function run() {
    console.log('Downloading missing logos...');
    for (const [name, url] of Object.entries(logos)) {
        const filepath = path.join(targetDir, `${name}.svg`);
        if (fs.existsSync(filepath) && fs.statSync(filepath).size > 0) {
            continue;
        }
        try {
            await sleep(3000); // 3 seconds delay to avoid 429
            await downloadImage(url, filepath);
            console.log(`Downloaded ${name}.svg`);
        } catch (e) {
            console.error(`Error downloading ${name}.svg: ${e.message}`);
        }
    }
    console.log('Done!');
}

run();
