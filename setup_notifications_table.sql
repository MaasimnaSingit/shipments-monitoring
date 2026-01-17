-- =================================================
-- BROADCAST NOTIFICATION SYSTEM - TABLE SETUP
-- =================================================

-- 1. Create the notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    message TEXT NOT NULL,
    target_branch TEXT NOT NULL DEFAULT 'ALL',  -- 'ALL' or specific branch name
    type TEXT NOT NULL DEFAULT 'INFO',          -- 'INFO' or 'URGENT'
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by TEXT DEFAULT 'Admin'
);

-- 2. Enable Row Level Security
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- 3. Allow full access (internal tool)
CREATE POLICY "Enable all access for notifications" 
ON notifications FOR ALL 
USING (true) WITH CHECK (true);

-- 4. Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_notifications_active 
ON notifications(is_active, target_branch);
