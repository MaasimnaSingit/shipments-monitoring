import * as XLSX from 'xlsx';

export type DailyRecord = {
  vip_code: string;
  vip_name: string;
  branch: string;
  date: string; // ISO date string
  count: number;
};

// Helper to convert Excel Serial Date to JS Date
function excelDateToJSDate(serial: number): string {
  const utc_days  = Math.floor(serial - 25569);
  const utc_value = utc_days * 86400;                                        
  const date_info = new Date(utc_value * 1000);
  return date_info.toISOString().split('T')[0];
}

export async function parseMonitoringHooks(buffer: ArrayBuffer): Promise<DailyRecord[]> {
  const workbook = XLSX.read(buffer, { type: 'array' });
  const records: DailyRecord[] = [];

  workbook.SheetNames.forEach(sheetName => {
    // Skip "Target" sheets if they are just summary? No, sheets are per branch.
    // The user file had sheets: "FLORIDA", "LUBAO", etc.
    // We assume these are the branch names.
    
    const sheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as any[][];

    // 1. Find the Header Row (Look for a date integer, e.g., > 40000)
    let headerRowIndex = -1;
    let dateColumnMap: { [colIndex: number]: string } = {};

    for (let i = 0; i < Math.min(rows.length, 20); i++) {
        const row = rows[i];
        if (!row) continue;
        
        let foundDate = false;
        row.forEach((cell, colIndex) => {
            if (typeof cell === 'number' && cell > 45000 && cell < 50000) {
                // Found a date!
                foundDate = true;
                dateColumnMap[colIndex] = excelDateToJSDate(cell);
            }
        });

        if (foundDate) {
            headerRowIndex = i;
            break; 
        }
    }

    if (headerRowIndex === -1) {
        console.warn(`Could not find header row (dates) in sheet: ${sheetName}`);
        return;
    }
    console.log(`Sheet: ${sheetName} | Header Row Found at Index: ${headerRowIndex}`);
    console.log(`Dates found: ${Object.keys(dateColumnMap).length}`);

    // 2. Iterate Data Rows
    // Data rows usually start immediately after, but sometimes there are sub-headers.
    // We look for rows where Column A or B serves as an Identifier (VIP Code/Name)
    // Based on "FLORIDA", VIP CODE is Col 0, VIP NAME is Col 1.
    // Based on "WAREHOUSE", maybe different? "PANDAN" was Col 0 (Cell A1).
    // Let's assume the column structure is relative to where "TOTAL" is?
    
    // Robust approach: Look for "VIP CODE" or "VIP NAME" in the *Header Row* to determine key columns.
    const headerRow = rows[headerRowIndex];
    let nameColIdx = -1;
    let codeColIdx = -1;
    
    headerRow.forEach((cell, idx) => {
        if (typeof cell === 'string') {
           const val = cell.toUpperCase();
           if (val.includes('NAME')) nameColIdx = idx;
           if (val.includes('CODE') || val.includes('VIP')) codeColIdx = idx;
        }
    });

    // Fallback if not found explicit headers (like in WAREHOUSE sheet possibly?)
    if (nameColIdx === -1) nameColIdx = 1; // Default
    if (codeColIdx === -1) codeColIdx = 0; // Default

    // 2b. Capture Summary Rows (WALKIN / VIP) usually above the Header Row
    // We scan 5 rows above the header
    for (let r = Math.max(0, headerRowIndex - 5); r < headerRowIndex; r++) {
        const row = rows[r];
        if (!row || row.length === 0) continue;
        
        const firstCell = String(row[0] || '').toUpperCase();
        if (firstCell.includes('WALKIN') || firstCell === 'VIP') {
            // Treat this as a special record
            Object.keys(dateColumnMap).forEach(colIdxStr => {
                const colIdx = parseInt(colIdxStr);
                const date = dateColumnMap[colIdx];
                let count = row[colIdx];
                
                // Treat empty/null as 0
                if (count === undefined || count === null || count === '') {
                    count = 0;
                }

                if (typeof count === 'number' && count >= 0 && count < 20000) {
                     records.push({
                        branch: sheetName,
                        vip_code: firstCell, // "WALKIN" or "VIP"
                        vip_name: firstCell, // "WALKIN" or "VIP"
                        date: date,
                        count: count
                    });
                }
            });
        }
    }

    for (let r = headerRowIndex + 1; r < rows.length; r++) {
        const row = rows[r];
        if (!row || row.length === 0) continue;

        const vipName = row[nameColIdx];
        const vipCode = row[codeColIdx];

        // Skip rows that look like summaries ("TOTAL", "LACKING")
        if (typeof vipName === 'string' && (vipName.includes('TOTAL') || vipName.includes('LACKING'))) continue;
        if (typeof vipCode === 'string' && (vipCode.includes('TOTAL') || vipCode.includes('LACKING'))) continue;
        
        // Also skip empty names ?? Or are Walk-ins unnamed?
        // In the example: "WALKIN" keys might exist.

        // 3. Extract Counts for each Date Column
        Object.keys(dateColumnMap).forEach(colIdxStr => {
            const colIdx = parseInt(colIdxStr);
            const date = dateColumnMap[colIdx];
            let count = row[colIdx];
            
            // Treat empty/null as 0
            if (count === undefined || count === null || count === '') {
                count = 0;
            }

            if (typeof count === 'number' && count >= 0 && count < 20000) {
                records.push({
                    branch: sheetName,
                    vip_code: String(vipCode || 'N/A'),
                    vip_name: String(vipName || 'Unknown'),
                    date: date,
                    count: count
                });
            }
        });
    }
  });

  return records;
}
