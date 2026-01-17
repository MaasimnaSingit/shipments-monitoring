const fs = require('fs');
const path = require('path');

const filesToRebrand = [
  './app/entry/[branch]/page.tsx',
  './components/Dashboard.tsx',
  './app/layout.tsx'
];

filesToRebrand.forEach(filePath => {
  try {
    const fullPath = path.resolve(filePath);
    if (!fs.existsSync(fullPath)) {
      console.log(`File not found: ${filePath}`);
      return;
    }

    let content = fs.readFileSync(fullPath, 'utf8');
    
    // 1. Rebrand LMXG Logistics -> DskLab Solutions
    const pattern1 = /LMXG Logistics/g;
    // 2. Rebrand LMXG Logo -> DskLab Logo
    const pattern2 = /LMXG Logo/g;
    // 3. Rebrand Just LMXG -> DskLab
    const pattern3 = /LMXG(?! Logo)/g; // Match LMXG only if not followed by " Logo"
    
    let newContent = content.replace(pattern1, 'DskLab Solutions');
    newContent = newContent.replace(pattern2, 'DskLab Logo');
    // newContent = newContent.replace(pattern3, 'DskLab'); // Be careful with this one, maybe too aggressive

    if (content !== newContent) {
      fs.writeFileSync(fullPath, newContent);
      console.log(`Successfully rebranded ${filePath}`);
    } else {
      // Try one more specific match for the footer if previous failed
      if (content.includes("Secured Enterprise Portal")) {
          const footerPattern = /Secured Enterprise Portal.*?\.?.*?(?:LMXG Logistics|LMXG)/g;
          newContent = content.replace(footerPattern, 'Secured Enterprise Portal • DskLab Solutions');
          fs.writeFileSync(fullPath, newContent);
          console.log(`Rebranded via specific footer pattern in ${filePath}`);
      }
    }
  } catch (err) {
    console.error(`Error processing ${filePath}:`, err);
  }
});

console.log('Rebranding complete.');
