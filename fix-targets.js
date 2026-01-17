const fs = require('fs');

const FILE_PATH = './components/Dashboard.tsx';
let content = fs.readFileSync(FILE_PATH, 'utf8');

// Find and replace the target section
const oldTargetSection = `  // Target state
  const [targets, setTargets] = useState<{[key: string]: number}>({
    'FLORIDA': 5000,
    'LUBAO': 3000,
    'STO CRISTO': 10000,
    'MAGALANG': 2000,
    'WAREHOUSE': 1000
  });
  const [isEditingTarget, setIsEditingTarget] = useState(false);
  const [tempTarget, setTempTarget] = useState('');

  const currentTarget = targets[activeTab] || 0;
  const currentTotal = stats.totalParcels;
  const progressPercentage = Math.min((currentTotal / currentTarget) * 100, 100);

  const handleUpdateTarget = () => {
    const val = parseInt(tempTarget.replace(/,/g, ''));
    if (!isNaN(val) && val > 0) {
      setTargets(prev => ({...prev, [activeTab]: val}));
      setIsEditingTarget(false);
    }
  };`;

const newTargetSection = `  // Target state - with defaults that will be overwritten by database
  const [targets, setTargets] = useState<{[key: string]: number}>({
    'FLORIDA': 5000,
    'LUBAO': 3000,
    'STO CRISTO': 10000,
    'MAGALANG': 2000,
    'WAREHOUSE': 1000
  });
  const [isEditingTarget, setIsEditingTarget] = useState(false);
  const [tempTarget, setTempTarget] = useState('');

  // Load targets from database on mount
  useEffect(() => {
    fetch('/api/targets')
      .then(res => res.json())
      .then(data => {
        if (data.success && Object.keys(data.targets).length > 0) {
          setTargets(prev => ({ ...prev, ...data.targets }));
        }
      })
      .catch(err => console.error('Failed to load targets:', err));
  }, []);

  const currentTarget = targets[activeTab] || 0;
  const currentTotal = stats.totalParcels;
  const progressPercentage = currentTarget > 0 ? Math.min((currentTotal / currentTarget) * 100, 100) : 0;

  const handleUpdateTarget = async () => {
    const val = parseInt(tempTarget.replace(/,/g, ''));
    if (!isNaN(val) && val > 0) {
      // Update local state immediately
      setTargets(prev => ({...prev, [activeTab]: val}));
      setIsEditingTarget(false);
      
      // Save to database
      try {
        await fetch('/api/targets', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ branch: activeTab, target: val })
        });
      } catch (err) {
        console.error('Failed to save target:', err);
      }
    }
  };`;

// Normalize line endings for matching
const contentNorm = content.replace(/\r\n/g, '\n');
const oldNorm = oldTargetSection.replace(/\r\n/g, '\n');
const newNorm = newTargetSection.replace(/\r\n/g, '\n');

if (contentNorm.includes(oldNorm)) {
  content = contentNorm.replace(oldNorm, newNorm);
  fs.writeFileSync(FILE_PATH, content);
  console.log('✅ Target persistence added successfully!');
} else {
  console.log('❌ Could not find exact target section. Trying flexible match...');
  
  // Try to find just the key parts
  if (contentNorm.includes("// Target state")) {
    console.log('Found "// Target state" marker. Manual inspection needed.');
  }
}
