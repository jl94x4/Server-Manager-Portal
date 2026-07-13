const fs = require('fs');
const path = require('path');
const https = require('https');

const logos = {
    // Studios
    'walt-disney': 'https://logo.clearbit.com/disney.com',
    '20th-century': 'https://logo.clearbit.com/20thcenturystudios.com',
    'sony-pictures': 'https://logo.clearbit.com/sonypictures.com',
    'warner-bros': 'https://logo.clearbit.com/warnerbros.com',
    'universal': 'https://logo.clearbit.com/universalpictures.com',
    'paramount': 'https://logo.clearbit.com/paramount.com',
    'a24': 'https://logo.clearbit.com/a24films.com',

    // Networks
    'netflix': 'https://logo.clearbit.com/netflix.com',
    'disney-plus': 'https://logo.clearbit.com/disneyplus.com',
    'prime-video': 'https://logo.clearbit.com/primevideo.com',
    'apple-tv': 'https://logo.clearbit.com/apple.com',
    'hulu': 'https://logo.clearbit.com/hulu.com',
    'hbo': 'https://logo.clearbit.com/hbo.com',
    'bbc': 'https://logo.clearbit.com/bbc.co.uk',
    'itv': 'https://logo.clearbit.com/itv.com',
    'sky': 'https://logo.clearbit.com/sky.com',
};

const targetDir = path.join(__dirname, 'static', 'logos');
if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
}

function downloadImage(url, filepath) {
    return new Promise((resolve, reject) => {
        https.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0'
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

async function run() {
    console.log('Downloading logos...');
    for (const [name, url] of Object.entries(logos)) {
        const filepath = path.join(targetDir, `${name}.png`);
        try {
            await downloadImage(url, filepath);
            console.log(`Downloaded ${name}.png`);
        } catch (e) {
            console.error(`Error downloading ${name}.png: ${e.message}`);
        }
    }
    console.log('Done!');
}

run();
