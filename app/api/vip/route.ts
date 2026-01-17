import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// Helper to fetch all VIPs from Supabase and structure them like the old JSON
async function getDB() {
  const { data: vips, error } = await supabase
    .from('vip_clients')
    .select('*')
    .order('vip_name', { ascending: true });

  if (error) {
    console.error('Supabase fetch error:', error);
    return { branches: [] };
  }

  // Transform flat list back to nested structure for frontend compatibility
  // Get unique branches
  const branchesMap = new Map();

  vips?.forEach((vip) => {
    if (!branchesMap.has(vip.branch_name)) {
      branchesMap.set(vip.branch_name, {
        name: vip.branch_name,
        vips: []
      });
    }
    branchesMap.get(vip.branch_name).vips.push({
      code: vip.vip_code,
      name: vip.vip_name
    });
  });

  return { branches: Array.from(branchesMap.values()) };
}

export async function GET() {
  return NextResponse.json(await getDB());
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action, branchName, vipCode, vipName, oldVipCode } = body;

    // 1. ADD VIP
    if (action === 'ADD') {
      const { error } = await supabase
        .from('vip_clients')
        .insert([{ 
          branch_name: branchName, 
          vip_code: vipCode, 
          vip_name: vipName 
        }]);

      if (error) throw error;
    } 
    // 2. EDIT VIP
    else if (action === 'EDIT') {
      const { error } = await supabase
        .from('vip_clients')
        .update({ vip_code: vipCode, vip_name: vipName })
        .eq('branch_name', branchName)
        .eq('vip_code', oldVipCode);

      if (error) throw error;
    } 
    // 3. DELETE VIP
    else if (action === 'DELETE') {
      const { error } = await supabase
        .from('vip_clients')
        .delete()
        .eq('branch_name', branchName)
        .eq('vip_code', vipCode);

      if (error) throw error;
    }

    return NextResponse.json({ success: true, branches: (await getDB()).branches });
  } catch (error: any) {
    console.error('VIP Update Error:', error);
    return NextResponse.json({ success: false, error: error.message || 'Failed to update database' });
  }
}
