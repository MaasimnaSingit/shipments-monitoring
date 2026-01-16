import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// Path to our data file
const DATA_PATH = path.join(process.cwd(), 'lib/parcel-data.json');

interface ParcelData {
  records: {
    branch: string;
    vip_code: string;
    vip_name: string;
    date: string;
    count: number;
    source: 'manual' | 'jms' | 'upload';
  }[];
}

// Helper to read data
function getData(): ParcelData {
  try {
    if (fs.existsSync(DATA_PATH)) {
      const data = fs.readFileSync(DATA_PATH, 'utf8');
      return JSON.parse(data);
    }
    return { records: [] };
  } catch (error) {
    console.error('Error reading parcel data:', error);
    return { records: [] };
  }
}

// Helper to save data
function saveData(data: ParcelData) {
  try {
    const libDir = path.dirname(DATA_PATH);
    if (!fs.existsSync(libDir)) {
      fs.mkdirSync(libDir, { recursive: true });
    }
    fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2));
    return true;
  } catch (error) {
    console.error('Error saving parcel data:', error);
    return false;
  }
}

// GET - Retrieve all records
export async function GET() {
  const data = getData();
  return NextResponse.json({
    success: true,
    records: data.records
  });
}

// POST - Add/Update a record (from JMS bookmarklet or manual entry)
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { branch, vipCode, vipName, date, count, source = 'jms' } = body;
    
    // Validate required fields
    if (!branch || !date || count === undefined) {
      return NextResponse.json({ 
        success: false, 
        error: 'Missing required fields: branch, date, count' 
      }, { status: 400 });
    }
    
    const data = getData();
    
    // Find if record already exists
    const existingIndex = data.records.findIndex(r => 
      r.branch === branch && 
      r.vip_code === (vipCode || 'VIP') && 
      r.date === date
    );
    
    const newRecord = {
      branch,
      vip_code: vipCode || 'VIP',
      vip_name: vipName || 'VIP Total',
      date,
      count: parseInt(count),
      source: source as 'manual' | 'jms' | 'upload'
    };
    
    if (existingIndex >= 0) {
      // Update existing record
      data.records[existingIndex] = newRecord;
    } else {
      // Add new record
      data.records.push(newRecord);
    }
    
    const saved = saveData(data);
    
    if (!saved) {
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to save data' 
      }, { status: 500 });
    }
    
    return NextResponse.json({
      success: true,
      message: `Saved ${count} ${vipCode || 'VIP'} parcels for ${date}`,
      record: newRecord
    });
    
  } catch (error: any) {
    return NextResponse.json({ 
      success: false, 
      error: `Failed to save data: ${error.message}` 
    }, { status: 500 });
  }
}
