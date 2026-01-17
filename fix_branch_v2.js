const fs = require('fs');
let content = fs.readFileSync('./app/entry/[branch]/page.tsx', 'utf8');

// Find the exact line and add setResolvedBranchName after it
const lines = content.split('\n');
let modified = false;

for (let i = 0; i < lines.length; i++) {
    if (lines[i].trim() === 'if (branchData) {' && !modified) {
        // Check if setResolvedBranchName is already there
        if (!lines[i+1].includes('setResolvedBranchName')) {
            // Insert after this line
            lines.splice(i + 1, 0, '          // Store actual DB branch name', '          setResolvedBranchName(branchData.name);', '');
            modified = true;
            console.log('Added setResolvedBranchName after line ' + (i+1));
        } else {
            console.log('setResolvedBranchName already present');
        }
        break;
    }
}

// Also fix the submit to use resolvedBranchName
content = lines.join('\n');
if (content.includes('branch: branchName,') && !content.includes('branch: resolvedBranchName ||')) {
    content = content.replace('branch: branchName,', 'branch: resolvedBranchName || branchName,');
    console.log('Fixed submission to use resolvedBranchName');
}

fs.writeFileSync('./app/entry/[branch]/page.tsx', content);
console.log('Done!');
