const fs = require('fs');

let content = fs.readFileSync('./components/Dashboard.tsx', 'utf8');

// Read line by line
const lines = content.split('\n');

// Replace line 683-684 (0-indexed 682-683)
const newLines683to691 = [
    '                             <span className={`inline-flex items-center justify-center min-w-[32px] h-7 px-2 rounded text-xs transition-all ${colorClass} ${isToday ? \'ring-2 ring-blue-400 ring-offset-1\' : \'\'}`}>{count}</span>',
    '                                   <button ',
    '                                     onClick={() => { setRecordToDelete(record); setShowDeleteRecordModal(true); }} ',
    '                                     className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg" ',
    '                                     title="Delete"',
    '                                   >',
    '                                     <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">',
    '                                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12"></path>',
    '                                     </svg>',
    '                                   </button>',
    '                                 </div>'
];

// Replace lines 682-684 (span + button + div closing) with properly formatted version
lines.splice(682, 3, ...newLines683to691);

fs.writeFileSync('./components/Dashboard.tsx', lines.join('\n'));
console.log('✅ Fixed JSX syntax error!');
