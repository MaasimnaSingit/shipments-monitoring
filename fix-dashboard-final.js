const fs = require('fs');

const FILE_PATH = './components/Dashboard.tsx';
let content = fs.readFileSync(FILE_PATH, 'utf8');

// We will find the start and end of the dates.map block using the logic we know exists
// We know lines 673-697 contain the map block. We can just replace that section by identifying unique strings.

const startMarker = '{dates.map(date => {';
const endMarker = '})}';

const startIndex = content.lastIndexOf(startMarker);
if (startIndex === -1) {
    console.error('Could not find start marker!');
    process.exit(1);
}

// Find the end marker coming after start marker
const relativeEndIndex = content.substring(startIndex).indexOf(endMarker);
if (relativeEndIndex === -1) {
    console.error('Could not find end marker!');
    process.exit(1);
}

const endIndex = startIndex + relativeEndIndex + endMarker.length;

// The clean replacement code
const newCode = `{dates.map(date => {
                          const count = row.dates[date] || 0;
                          const colorClass = getCountColor(count, maxDailyCount);
                          const isToday = date === new Date().toISOString().split('T')[0];
                          const record = uploadedData.find(d => d.branch === activeTab && d.vip_code === row.code && d.date === date);
                          
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
                            <td key={date} className="text-center relative group">
                              {cellContent}
                            </td>
                          );
                        })}`;

// Replace the chunk
const newFileContent = content.substring(0, startIndex) + newCode + content.substring(endIndex);

fs.writeFileSync(FILE_PATH, newFileContent);
console.log('✅ Replaced dates.map block safely!');
