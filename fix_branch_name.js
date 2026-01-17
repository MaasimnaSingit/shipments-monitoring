const fs = require('fs');

const filePath = './app/entry/[branch]/page.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// Fix 1: Add a resolvedBranchName state variable after line 31
const stateInsertPoint = "const [showMonitorModal, setShowMonitorModal] = useState(false);";
const newState = `const [showMonitorModal, setShowMonitorModal] = useState(false);
  
  // Store the actual database branch name (e.g., "STO CRISTO" not "STO-CRISTO")
  const [resolvedBranchName, setResolvedBranchName] = useState<string>('');`;

if (content.includes(stateInsertPoint) && !content.includes('resolvedBranchName')) {
  content = content.replace(stateInsertPoint, newState);
  console.log('✅ Added resolvedBranchName state');
}

// Fix 2: Store the actual branch name when we find it in the API response
const oldBranchDataCheck = `if (branchData) {
          const filteredVips = (branchData.vips || []).filter(`;
const newBranchDataCheck = `if (branchData) {
          // Store the ACTUAL database branch name for submission
          setResolvedBranchName(branchData.name);
          
          const filteredVips = (branchData.vips || []).filter(`;

if (content.includes(oldBranchDataCheck)) {
  content = content.replace(oldBranchDataCheck, newBranchDataCheck);
  console.log('✅ Added setResolvedBranchName in useEffect');
}

// Fix 3: Use resolvedBranchName for data submission
const oldSubmit = `body: JSON.stringify({
          branch: branchName,`;
const newSubmit = `body: JSON.stringify({
          branch: resolvedBranchName || branchName,`;

if (content.includes(oldSubmit)) {
  content = content.replace(oldSubmit, newSubmit);
  console.log('✅ Fixed data submission to use resolvedBranchName');
}

// Fix 4: Use resolvedBranchName for loading entries
const oldLoadEntries = "fetch(`/api/data?branch=${branchName}&startDate=";
const newLoadEntries = "fetch(`/api/data?branch=${resolvedBranchName || branchName}&startDate=";

if (content.includes(oldLoadEntries)) {
  content = content.replace(oldLoadEntries, newLoadEntries);
  console.log('✅ Fixed loadMyEntries to use resolvedBranchName');
}

// Fix 5: Use resolvedBranchName for display (header)
const oldHeader = `{branchName} BRANCH`;
const newHeader = `{resolvedBranchName || branchName.replace(/-/g, ' ')} BRANCH`;

if (content.includes(oldHeader)) {
  content = content.replace(oldHeader, newHeader);
  console.log('✅ Fixed header display to use resolvedBranchName');
}

fs.writeFileSync(filePath, content);
console.log('');
console.log('🎉 All fixes applied successfully!');
