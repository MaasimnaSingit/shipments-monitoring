import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { branch, date, entries } = body;

    // Validate required fields
    if (!branch || !date || !entries || !Array.isArray(entries)) {
      return NextResponse.json({ 
        success: false, 
        error: 'Missing required fields: branch, date, entries' 
      }, { status: 400 });
    }

    // Prepare records for Supabase
    const records = entries.map((entry: { vip_code: string; vip_name: string; count: number }) => ({
      branch,
      date,
      vip_code: entry.vip_code,
      vip_name: entry.vip_name,
      count: parseInt(String(entry.count)) || 0
    }));

    // Upsert into Supabase (requires UNIQUE constraint on branch, date, vip_code)
    const { error } = await supabase
      .from('parcel_data')
      .upsert(records, { onConflict: 'branch,date,vip_code' });

    if (error) throw error;

    return NextResponse.json({
      success: true,
      message: `Successfully saved ${records.length} entries for ${branch} on ${date}`
    });

  } catch (error: any) {
    console.error('Submit error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message || 'Unknown error' 
    }, { status: 500 });
  }
}
