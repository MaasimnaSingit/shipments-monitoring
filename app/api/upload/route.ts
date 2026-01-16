import { NextRequest, NextResponse } from 'next/server';
import { parseMonitoringHooks } from '@/lib/excel-parser';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const records = await parseMonitoringHooks(arrayBuffer);

    // TODO: Save to Database (Supabase)
    // For now, return the parsed data to verify
    
    return NextResponse.json({ 
      success: true, 
      count: records.length,
      sample: records.slice(0, 5),
      fullData: records
    });

  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: 'Failed to process file' }, { status: 500 });
  }
}
