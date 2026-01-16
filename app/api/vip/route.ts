import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// Path to our JSON database
const DB_PATH = path.join(process.cwd(), 'lib/vip-structure.json');

// Helper to read DB
function getDB() {
  try {
    const data = fs.readFileSync(DB_PATH, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    return { branches: [] };
  }
}

// Helper to save DB
function saveDB(data: any) {
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
}

export async function GET() {
  return NextResponse.json(getDB());
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action, branchName, vipCode, vipName, oldVipCode } = body;
    const db = getDB();

    // Find the branch
    const branch = db.branches.find((b: any) => b.name === branchName);
    if (!branch) {
      return NextResponse.json({ success: false, error: 'Branch not found' });
    }

    if (action === 'ADD') {
      // Check duplicate
      if (branch.vips.some((v: any) => v.code === vipCode)) {
        return NextResponse.json({ success: false, error: 'VIP Code already exists' });
      }
      branch.vips.push({ code: vipCode, name: vipName });
    } 
    else if (action === 'EDIT') {
      const vipIndex = branch.vips.findIndex((v: any) => v.code === oldVipCode);
      if (vipIndex === -1) {
        return NextResponse.json({ success: false, error: 'VIP not found' });
      }
      branch.vips[vipIndex] = { code: vipCode, name: vipName };
    } 
    else if (action === 'DELETE') {
      branch.vips = branch.vips.filter((v: any) => v.code !== vipCode);
    }

    saveDB(db);
    return NextResponse.json({ success: true, branches: db.branches });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to update' });
  }
}
