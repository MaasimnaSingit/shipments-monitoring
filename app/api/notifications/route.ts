import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// GET - Fetch active notifications (optionally filtered by branch)
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const branch = searchParams.get('branch');
    
    let query = supabase
      .from('notifications')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false });
    
    // If branch specified, get notifications for that branch OR 'ALL'
    if (branch) {
      query = query.or(`target_branch.eq.${branch},target_branch.eq.ALL`);
    }
    
    const { data, error } = await query;
    
    if (error) throw error;
    
    return NextResponse.json({ success: true, notifications: data || [] });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch notifications';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

// POST - Create new notification OR mark as inactive
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action, id, message, targetBranch, type } = body;
    
    // Deactivate a notification
    if (action === 'DEACTIVATE' && id) {
      const { error } = await supabase
        .from('notifications')
        .update({ is_active: false })
        .eq('id', id);
      
      if (error) throw error;
      return NextResponse.json({ success: true });
    }
    
    // Create new notification
    if (action === 'CREATE') {
      const { error } = await supabase
        .from('notifications')
        .insert([{
          message: message,
          target_branch: targetBranch || 'ALL',
          type: type || 'INFO',
          is_active: true
        }]);
      
      if (error) throw error;
      return NextResponse.json({ success: true });
    }
    
    return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to process notification';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

// DELETE - Permanently delete a notification
export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ success: false, error: 'ID required' }, { status: 400 });
    }
    
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to delete notification';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
