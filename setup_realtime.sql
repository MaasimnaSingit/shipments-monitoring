-- =================================================
-- ENABLE REALTIME FOR PARCEL MONITORING
-- =================================================

-- 1. Create the publication for realtime if it doesn't exist
-- (Supabase typically has 'supabase_realtime' publication by default)

-- 2. Add tables to the publication
-- This enables the "Broadcast" of changes to any subscribed client
ALTER PUBLICATION supabase_realtime ADD TABLE parcel_data;
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;

-- 3. Verify it worked (Optional check)
-- SELECT * FROM pg_publication_tables WHERE pubname = 'supabase_realtime';
