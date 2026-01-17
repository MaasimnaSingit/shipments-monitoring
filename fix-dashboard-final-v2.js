const fs = require('fs');

const FILE_PATH = './components/Dashboard.tsx';
let content = fs.readFileSync(FILE_PATH, 'utf8');

// --- FIX WALK-IN SECTION (around line 556) ---
// Find the dates.map inside the walkinRow section
// We look for "const count = walkinRow.dates[date]"
const walkinMapStart = content.indexOf('const count = walkinRow.dates[date]');
const walkinReturnStart = content.indexOf('return (', walkinMapStart);
const walkinTdEnd = content.indexOf('</td>', walkinReturnStart) + 5;

// Correct implementation for Walk-ins
const walkinFixedCode = `
                            const record = uploadedData.find(d => d.branch === activeTab && d.vip_code === 'WALKIN' && d.date === date);
                            
                            let cellContent;
                            if (count > 0 && record) {
                              cellContent = (
                                <div className="relative inline-block">
                                  <span className={\`inline-flex items-center justify-center min-w-[32px] h-7 px-2 rounded text-xs transition-all \${colorClass} \${isToday ? 'ring-2 ring-blue-400 ring-offset-1' : ''}\`}>
                                    {count}
                                  </span>
                                  <button 
                                    onClick={() => { setRecordToDelete(record); setShowDeleteRecordModal(true); }}
                                    className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                                    title="Delete"
                                  >
                                    <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                  </button>
                                </div>
                              );
                            } else {
                              cellContent = <span className="text-gray-300 text-xs">-</span>;
                            }

                            return (
                              <td key={date} className="p-2 text-center relative group">
                                {cellContent}
                              </td>
                            );`;

// Find where the walkin return starts and replace up to including the closing td and next line
// Actually let's just replace from return to td end.
const walkinToReplaceStart = walkinReturnStart;
const walkinToReplaceEnd = walkinTdEnd;

content = content.substring(0, walkinToReplaceStart) + walkinFixedCode + content.substring(walkinToReplaceEnd);

// --- VERIFY VIP SECTION ---
// My previous script fixed the VIP section, but let's make sure it's correct and has no syntax errors
// We already verified line 673 range looks good.

fs.writeFileSync(FILE_PATH, content);
console.log('✅ Fixed syntax error in Walk-in section!');
