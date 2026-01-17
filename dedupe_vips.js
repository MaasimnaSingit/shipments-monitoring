const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'lib', 'vip-structure.json');
const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

const codeCounts = {};
const duplicates = [];

// First pass: count occurrences of each code
data.branches.forEach(branch => {
  branch.vips.forEach(vip => {
    const code = vip.code;
    codeCounts[code] = (codeCounts[code] || 0) + 1;
  });
});

// Second pass: identify duplicates (excluding WALKIN and VIP which might be intentional but usually unique per branch anyway)
// Actually, even WALKIN and VIP are fine as long as they are distinct within the branch context, 
// but the entry portal uses them as keys in a global 'counts' object.
// We must make them unique globally if we want to avoid collisions in the current React state logic.

Object.keys(codeCounts).forEach(code => {
  if (codeCounts[code] > 1) {
    duplicates.push(code);
  }
});

console.log('Detected duplicate codes:', duplicates);

const updatedData = JSON.parse(JSON.stringify(data));
const usedGlobalCodes = new Set();

updatedData.branches.forEach(branch => {
  branch.vips.forEach((vip, index) => {
    let baseCode = vip.code;
    
    // If it's a known duplicate code
    if (duplicates.includes(baseCode)) {
      let uniqueCode = baseCode;
      let counter = 1;
      
      // If this specific code has already been used in this session, keep incrementing
      while (usedGlobalCodes.has(uniqueCode)) {
        uniqueCode = `${baseCode}-${String(counter).padStart(3, '0')}`;
        counter++;
      }
      
      if (uniqueCode !== baseCode) {
        console.log(`Renaming [${branch.name}] ${vip.name}: ${baseCode} -> ${uniqueCode}`);
        vip.code = uniqueCode;
      }
      usedGlobalCodes.add(uniqueCode);
    } else {
      usedGlobalCodes.add(baseCode);
    }
  });
});

fs.writeFileSync(filePath, JSON.stringify(updatedData, null, 2));
console.log('Successfully de-duplicated all VIP codes.');
