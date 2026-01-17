const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'lib', 'vip-structure.json');
const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

data.branches.forEach(branch => {
  branch.vips.forEach(vip => {
    if (vip.code.startsWith('WALKIN-')) {
      vip.code = 'WALKIN';
    }
    if (vip.code.startsWith('VIP-')) {
      vip.code = 'VIP';
    }
    // Also fix any TEMP codes to be cleaner but still unique
    if (vip.code.startsWith('TEMP-')) {
       // Leave these as is for now, they are unique
    }
    if (vip.code.startsWith('NWL-') && !vip.code.includes('-F') && vip.code.length > 10) {
       // This is likely one of the random codes I generated
       // Let's keep it but make it look slightly cleaner
       // Actually, keeping it as is ensures uniqueness.
    }
  });
});

fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
console.log('Reset special keywords to standard values.');
