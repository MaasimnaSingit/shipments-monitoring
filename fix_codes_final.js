const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'lib', 'vip-structure.json');
const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

// We want to keep these keywords identical across all branches
const SPECIAL_KEYWORDS = ['WALKIN', 'VIP'];

data.branches.forEach(branch => {
  const codesInBranch = new Set();
  
  branch.vips.forEach(vip => {
    // If it's a special keyword, leave it alone
    if (SPECIAL_KEYWORDS.includes(vip.code)) {
      return;
    }

    // Check for duplicates WITHIN the same branch
    if (codesInBranch.has(vip.code)) {
      console.log(`Duplicate found in branch ${branch.name}: ${vip.code} (${vip.name})`);
      // Make it unique by appending the name or a suffix
      const suffix = Math.random().toString(36).substring(7).toUpperCase();
      const oldCode = vip.code;
      vip.code = `${oldCode}-${suffix}`;
      console.log(`  -> Fixed: ${oldCode} to ${vip.code}`);
    }
    
    codesInBranch.add(vip.code);
  });
});

// Also check for "N/A" and "NWL" specifically as the user noted those are often generic
data.branches.forEach(branch => {
  branch.vips.forEach(vip => {
    if (vip.code === 'N/A' || vip.code === 'NWL') {
       const suffix = Math.random().toString(36).substring(7).toUpperCase();
       const oldCode = vip.code;
       vip.code = `${oldCode}-${branch.name.substring(0,2)}-${suffix}`;
       console.log(`Fixing generic code in ${branch.name}: ${oldCode} -> ${vip.code} (${vip.name})`);
    }
  });
});

fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
console.log('Successfully de-duplicated and unique-ified all codes.');
