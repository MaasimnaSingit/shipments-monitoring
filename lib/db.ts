import fs from 'fs';
import path from 'path';

// Simple JSON file database - NO EXTERNAL SERVICE NEEDED!
const DB_PATH = path.join(process.cwd(), 'data', 'parcel-records.json');

interface ParcelRecord {
  id: string;
  branch: string;
  date: string;
  vip_code: string;
  vip_name: string;
  count: number;
  created_at: string;
}

// Ensure data directory exists
function ensureDataDir() {
  const dataDir = path.join(process.cwd(), 'data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
}

// Load all records
export function loadRecords(): ParcelRecord[] {
  ensureDataDir();
  try {
    if (fs.existsSync(DB_PATH)) {
      const data = fs.readFileSync(DB_PATH, 'utf-8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Error loading records:', error);
  }
  return [];
}

// Save all records
function saveRecords(records: ParcelRecord[]) {
  ensureDataDir();
  fs.writeFileSync(DB_PATH, JSON.stringify(records, null, 2));
}

// Add or update records (upsert)
export function upsertRecords(newRecords: Omit<ParcelRecord, 'id' | 'created_at'>[]) {
  const records = loadRecords();
  
  for (const newRecord of newRecords) {
    // Find existing record with same branch, date, vip_code
    const existingIndex = records.findIndex(
      r => r.branch === newRecord.branch && 
           r.date === newRecord.date && 
           r.vip_code === newRecord.vip_code
    );
    
    if (existingIndex >= 0) {
      // Update existing
      records[existingIndex] = {
        ...records[existingIndex],
        ...newRecord,
        count: newRecord.count
      };
    } else {
      // Add new
      records.push({
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        ...newRecord,
        created_at: new Date().toISOString()
      });
    }
  }
  
  saveRecords(records);
  return records;
}

// Get records with optional filters
export function getRecords(filters?: {
  branch?: string;
  startDate?: string;
  endDate?: string;
}): ParcelRecord[] {
  let records = loadRecords();
  
  if (filters?.branch) {
    records = records.filter(r => r.branch === filters.branch);
  }
  if (filters?.startDate) {
    records = records.filter(r => r.date >= filters.startDate!);
  }
  if (filters?.endDate) {
    records = records.filter(r => r.date <= filters.endDate!);
  }
  
  return records.sort((a, b) => a.date.localeCompare(b.date));
}
