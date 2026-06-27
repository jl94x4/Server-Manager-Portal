const fs = require('fs');

let content = fs.readFileSync('index.tsx', 'utf8');

const targetStr = `            announcement,
            navOrder,
            hideStreamUsers,
            defaultLibraryIds
        });`;

const replacementStr = `            announcement,
            navOrder,
            hideStreamUsers,
            defaultLibraryIds,
            use24HourClock
        });`;

if (content.includes(targetStr)) {
    content = content.replace(targetStr, replacementStr);
    fs.writeFileSync('index.tsx', content);
    console.log('Successfully patched index.tsx');
} else {
    console.log('Could not find target string in index.tsx');
}
