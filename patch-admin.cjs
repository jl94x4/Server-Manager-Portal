const fs = require('fs');

const fixIndex = () => {
    let content = fs.readFileSync('index.tsx', 'utf8');

    // 1. Remove the 24-Hour Clock UI block from Preferences (between Newsletter and Support card)
    const uiStart = '<div className="flex items-center justify-between gap-4 mt-6">';
    const uiEnd = 'window.localStorage.getItem(\'use24Hour\') === \'true\' ? \'translate-x-8\' : \'translate-x-1\'}`} />\n                                    </button>\n                                </div>';
    
    if (content.includes(uiStart) && content.includes(uiEnd)) {
        const pre = content.substring(0, content.indexOf(uiStart));
        const post = content.substring(content.indexOf(uiEnd) + uiEnd.length);
        content = pre + post;
    }

    // 2. Update formatTime to read from window.__USE_24_HOUR_CLOCK__ instead of localStorage
    content = content.replace(/localStorage\.getItem\('use24Hour'\) === 'true'/g, 'window.__USE_24_HOUR_CLOCK__ === true');

    // 3. Fix the syntax error item.formatTime(date)
    content = content.replace(/item\.formatTime\(date\)/g, 'formatTime(item.date)');

    // 4. Inject publicConfig use24HourClock to window in Login and fetchPublicConfig
    // Find setPublicConfig(data) in index.tsx
    content = content.replace(/setPublicConfig\(data\);/g, 'window.__USE_24_HOUR_CLOCK__ = data.use24HourClock === true;\n            setPublicConfig(data);');

    // 5. AdminPanel state
    if (!content.includes('const [use24HourClock, setUse24HourClock]')) {
        content = content.replace('const [navOrder, setNavOrder]', 'const [use24HourClock, setUse24HourClock] = useState(initialSettings.use24HourClock || false);\n    const [navOrder, setNavOrder]');
    }

    // 6. AdminPanel payload
    if (!content.includes('use24HourClock: use24HourClock')) {
        content = content.replace('navOrder: navOrder,', 'navOrder: navOrder,\n                use24HourClock: use24HourClock,');
    }

    // 7. Add AdminPanel UI toggle in branding
    const adminToggle = `
                            <div className="mb-4">
                                <label>Time Format</label>
                                <div className="flex items-center gap-2 mt-2">
                                    <input type="checkbox" id="use24HourClock" checked={use24HourClock} onChange={e => setUse24HourClock(e.target.checked)} className="w-5 h-5 accent-plex cursor-pointer" />
                                    <label htmlFor="use24HourClock" className="cursor-pointer text-sm font-medium">Use 24-Hour Clock across the Portal</label>
                                </div>
                            </div>
`;
    if (!content.includes('id="use24HourClock"')) {
        content = content.replace('<h3 className="text-xl font-bold text-plex mb-4 border-b border-border pb-2 mt-8">Announcements</h3>', adminToggle + '\n                            <h3 className="text-xl font-bold text-plex mb-4 border-b border-border pb-2 mt-8">Announcements</h3>');
    }

    fs.writeFileSync('index.tsx', content);
};

const fixV2 = () => {
    if (!fs.existsSync('v2/index.tsx')) return;
    let content = fs.readFileSync('v2/index.tsx', 'utf8');

    // 1. Remove the 24-Hour Clock UI block from Preferences
    const uiStart = '<div className="flex items-center justify-between gap-4 mt-6">';
    const uiEnd = 'window.localStorage.getItem(\'use24Hour\') === \'true\' ? \'translate-x-7\' : \'translate-x-1\'}`} />\n                        </button>\n                    </div>';
    
    if (content.includes(uiStart) && content.includes(uiEnd)) {
        const pre = content.substring(0, content.indexOf(uiStart));
        const post = content.substring(content.indexOf(uiEnd) + uiEnd.length);
        content = pre + post;
    }

    // 2. Update formatTime to read from window.__USE_24_HOUR_CLOCK__ instead of localStorage
    content = content.replace(/localStorage\.getItem\('use24Hour'\) === 'true'/g, 'window.__USE_24_HOUR_CLOCK__ === true');

    // 3. Fix the syntax error if present
    content = content.replace(/item\.formatTime\(date\)/g, 'formatTime(item.date)');

    // 4. Inject publicConfig use24HourClock to window in setPublicConfig
    content = content.replace(/setPublicConfig\(data\);/g, 'window.__USE_24_HOUR_CLOCK__ = data.use24HourClock === true;\n            setPublicConfig(data);');

    fs.writeFileSync('v2/index.tsx', content);
};

try {
    fixIndex();
    fixV2();
    console.log('Patch complete!');
} catch(e) {
    console.error(e);
}
