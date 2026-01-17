import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import fs from 'fs';
import path from 'path';

const LOCAL_TARGETS_PATH = path.join(process.cwd(), 'lib/branch-targets.json');

// Helper to get local targets
function getLocalTargets() {
  try {
    if (fs.existsSync(LOCAL_TARGETS_PATH)) {
      const data = fs.readFileSync(LOCAL_TARGETS_PATH, 'utf8');
      return JSON.parse(data);
    }
  } catch (e) {
    console.error('Local read error:', e);
  }
  return {
    'FLORIDA': 5000,
    'LUBAO': 3000,
    'STO CRISTO': 10000,
    'MAGALANG': 2000,
    'WAREHOUSE': 1000
  };
}

// Helper to save local targets
function saveLocalTargets(targets: any) {
  try {
    const current = getLocalTargets();
    const updated = { ...current, ...targets };
    fs.writeFileSync(LOCAL_TARGETS_PATH, JSON.stringify(updated, null, 2));
    return true;
  } catch (e) {
    console.error('Local save error:', e);
    return false;
  }
}

export async function GET() {
  try {
    // Try Supabase first
    const { data, error } = await supabase
      .from('branch_targets')
      .select('*');

    if (error) {
      // If table doesn't exist or other error, fallback to local file
      console.log('Supabase targets missing, using local storage.');
      return NextResponse.json({
        success: true,
        targets: getLocalTargets(),
        source: 'local'
      });
    }

    const targets: { [key: string]: number } = {};
    data?.forEach((record: any) => {
      targets[record.branch] = record.target;
    });

    return NextResponse.json({
      success: true,
      targets: { ...getLocalTargets(), ...targets },
      source: 'supabase'
    });

  } catch (error: any) {
    return NextResponse.json({ 
      success: true, 
      targets: getLocalTargets(),
      source: 'local'
    });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { branch, target } = body;

    // 1. Always Save Locally (Fail-safe)
    saveLocalTargets({ [branch]: target });

    // 2. Try to Save to Supabase
    try {
      const { error } = await supabase
        .from('branch_targets')
        .upsert(
          { branch, target: parseInt(String(target)) },
          { onConflict: 'branch' }
        );
      
      if (error) {
        console.warn('Could not save to Supabase branch_targets (table might not exist). Saved locally.');
      }
    } catch (e) {
      // Ignore Supabase error, we have local backup
    }

    return NextResponse.json({
      success: true,
      message: 'Target saved successfully (Hydrid Storage)'
    });

  } catch (error: any) {
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}
