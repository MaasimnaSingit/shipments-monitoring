-- RUN THIS IN SUPABASE SQL EDITOR

-- 1. Create the table for VIP Clients
CREATE TABLE IF NOT EXISTS vip_clients (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    branch_name TEXT NOT NULL,
    vip_code TEXT NOT NULL,
    vip_name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    -- Prevent duplicate codes within the same branch
    UNIQUE(branch_name, vip_code)
);

-- 2. Enable Row Level Security (RLS)
ALTER TABLE vip_clients ENABLE ROW LEVEL SECURITY;

-- 3. Create a policy to allow ALL operations (Select, Insert, Update, Delete)
-- This is an internal tool, so we allow public access for simplicity, controlled by our API keys.
CREATE POLICY "Enable all for anon" 
ON vip_clients 
FOR ALL 
USING (true) 
WITH CHECK (true);

-- 4. Enable Realtime (optional but good for future)
alter publication supabase_realtime add table vip_clients;
