const fs = require('fs');

let content = fs.readFileSync('./components/Dashboard.tsx', 'utf8');

// More flexible search - just look for the specific td pattern
const pattern = /(\{dates\.map\(date => \{\s+const count = row\.dates\[date\] \|\| 0;\s+const colorClass = getCountColor\(count, maxDailyCount\);\s+const isToday = date === new Date\(\)\.toISOString\(\)\.split\('T'\)\[0\];)\s+(return \(\s+<td key=\{date\} className="text-center">)/gm;

if (pattern.test(content)) {
    content = content.replace(pattern, `$1
                          const record = uploadedData.find(d => d.branch === activeTab && d.vip_code === row.code && d.date === date);
                          
                          return (
                            <td key={date} className="text-center relative group">
                              {count > 0 && record ? (
                                <div className="relative inline-block">`);

    // Also replace the span and closing
    content = content.replace(
        /<span className=\{\`inline-flex items-center justify-center min-w-\[32px\] h-7 px-2 rounded text-xs transition-all \$\{\s+colorClass\s+\} \$\{\s+isToday \? 'ring-2 ring-blue-400 ring-offset-1' : ''\s+\}\`\}>\s+\{count > 0 \? count : '-'\}\s+<\/span>\s+<\/td>/gm,
        `<span className={\`inline-flex items-center justify-center min-w-[32px] h-7 px-2 rounded text-xs transition-all \${colorClass} \${isToday ? 'ring-2 ring-blue-400 ring-offset-1' : ''}\`}>{count}</span>
                                  <button onClick={() => { setRecordToDelete(record); setShowDeleteRecordModal(true); }} className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg" title="Delete"><svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12"></path></svg></button>
                                </div>
                              ) : (<span className="text-gray-300 text-xs">-</span>)}
                            </td>`
    );

    fs.writeFileSync('./components/Dashboard.tsx', content);
    console.log('✅ Delete buttons added!');
} else {
    // Alternative: Direct line replacement using line numbers
    const lines = content.split('\n');
    console.log('Total lines:', lines.length);
    console.log('Line 676:', lines[675].substring(0, 50));
    console.log('Line 682:', lines[681].substring(0, 50));
    
    // Manual replace lines 676-692
    const newLines = [
        '                       {dates.map(date => {',
        '                          const count = row.dates[date] || 0;',
        '                          const colorClass = getCountColor(count, maxDailyCount);',
        '                          const isToday = date === new Date().toISOString().split(\'T\')[0];',
        '                          const record = uploadedData.find(d => d.branch === activeTab && d.vip_code === row.code && d.date === date);',
        '                          ',
        '                          return (',
        '                            <td key={date} className="text-center relative group">',
        '                              {count > 0 && record ? (',
        '                                <div className="relative inline-block">',
        '                                  <span className={`inline-flex items-center justify-center min-w-[32px] h-7 px-2 rounded text-xs transition-all ${colorClass} ${isToday ? \'ring-2 ring-blue-400 ring-offset-1\' : \'\'}`}>{count}</span>',
        '                                  <button onClick={() => { setRecordToDelete(record); setShowDeleteRecordModal(true); }} className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg" title="Delete"><svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12"></path></svg></button>',
        '                                </div>',
        '                              ) : (<span className="text-gray-300 text-xs">-</span>)}',
        '                            </td>',
        '                          );',
        '                        })}'
    ];
    
    // Replace lines 675 to 691 (0-indexed)
    lines.splice(675, 17, ...newLines);
    
    fs.writeFileSync('./components/Dashboard.tsx', lines.join('\n'));
    console.log('✅ Delete buttons added via line replacement!');
}
