const fs = require('fs');
const path = require('path');
const https = require('https');

const logos = {
    // Studios
    'walt-disney': 'https://image.tmdb.org/t/p/w300/wdrCwmRnLFJhEoG8GSfymY85KHT.png',
    '20th-century': 'https://image.tmdb.org/t/p/w300/qZCc1lty5FzX30aOCVRXrxSRYcF.png',
    'sony-pictures': 'https://image.tmdb.org/t/p/w300/71BqEFAF4V3qjjZAJ6NKeDOP2g4.png',
    'warner-bros': 'https://image.tmdb.org/t/p/w300/ky0xOc5OrhvnX4ElzwaKzG2wz8t.png',
    'universal': 'https://image.tmdb.org/t/p/w300/8lvHyhjvG0bIVMtd1S1sLcwk801.png',
    'paramount': 'https://image.tmdb.org/t/p/w300/fycMZtIsqQ8Qv6iYh8sH0Wp21vV.png',
    'a24': 'https://image.tmdb.org/t/p/w300/qx9K6bFWJupwde0xQDwOvXnOaL8.png',

    // Networks
    'netflix': 'https://image.tmdb.org/t/p/w300/wwemzKWzjKYJFfCeiB57q3r4Bcm.png',
    'disney-plus': 'https://image.tmdb.org/t/p/w300/7rwgEs15tFwyR9NPQ5vpzxTj19Q.png',
    'prime-video': 'https://image.tmdb.org/t/p/w300/11A1K11yO4t0vJv7s43r0sWw9Hh.png',
    'apple-tv': 'https://image.tmdb.org/t/p/w300/6vA9x4kQk24jU3T9aH2wY4nN6H5.png',
    'hulu': 'https://image.tmdb.org/t/p/w300/gJ8VX6JSu3cgXID5Lw2vG20N7S8.png',
    'hbo': 'https://image.tmdb.org/t/p/w300/tuomPhY2UtuPTqqFnKMVHvZwH0C.png',
    'bbc': 'https://image.tmdb.org/t/p/w300/2qCGJtcJqBqTq0pWJg1y87n9KOP.png',
    'itv': 'https://image.tmdb.org/t/p/w300/51sS8y0hVlW3U7u0n72gL8O3JtZ.png',
    'sky': 'https://image.tmdb.org/t/p/w300/8lG83k6H3ZkM5Fv7zY0Qz6tX2o.png',
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
    console.log('Downloading logos from TMDB...');
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
