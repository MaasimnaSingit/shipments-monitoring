const fs = require('fs');
const FILE_PATH = './components/Dashboard.tsx';
let content = fs.readFileSync(FILE_PATH, 'utf8');

const lines = content.split('\n');
// We see from previous view_file that line index 590 is ");" when lines 589 and 590 are also ");"
// 589 (Index 588): </td>
// 590 (Index 589): );
// 591 (Index 590): );
// Let's check specifically.

if (lines[590].trim() === ');' && lines[589].trim() === ');') {
    lines.splice(590, 1);
    fs.writeFileSync(FILE_PATH, lines.join('\n'));
    console.log('✅ Removed duplicate closure line 591.');
} else {
    // Search more broadly
    console.log('Line 590 check failed. Looking for duplicate...');
    for (let i = 0; i < lines.length - 1; i++) {
        if (lines[i].trim() === ');' && lines[i+1].trim() === ');' && lines[i+2] && lines[i+2].includes('})}')) {
            console.log('Found duplicate at line', i+1);
            lines.splice(i+1, 1);
            fs.writeFileSync(FILE_PATH, lines.join('\n'));
            console.log('✅ Removed duplicate closure surgicaly.');
            break;
        }
    }
}
