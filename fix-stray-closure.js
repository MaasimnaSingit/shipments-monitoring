const fs = require('fs');
const FILE_PATH = './components/Dashboard.tsx';
let content = fs.readFileSync(FILE_PATH, 'utf8');

// Find the problematic sequence );\n                            );
// Using a regex to be whitespace independent
content = content.replace(/\);\s+\);\s+\}\);/m, ');\n                          });');

fs.writeFileSync(FILE_PATH, content);
console.log('✅ Surgical closure fix complete.');
