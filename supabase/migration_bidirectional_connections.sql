-- Migration: Add bidirectional connection support
-- Run this if you already have a connections table

-- Step 1: Add new columns
ALTER TABLE connections 
  ADD COLUMN IF NOT EXISTS connected_user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS is_initiator BOOLEAN DEFAULT false;

-- Step 2: Backfill existing connections
-- For existing connections, we need to infer the connected_user_id
-- This assumes existing connections have userId pointing to the other user
-- You may need to adjust this based on your existing data structure
UPDATE connections 
SET connected_user_id = user_id, 
    is_initiator = true 
WHERE connected_user_id IS NULL;

-- Step 3: Add unique constraint (prevents duplicate connections)
ALTER TABLE connections 
  DROP CONSTRAINT IF EXISTS unique_connection;
  
ALTER TABLE connections 
  ADD CONSTRAINT unique_connection UNIQUE(user_id, connected_user_id);

-- Step 4: Add performance indexes
CREATE INDEX IF NOT EXISTS idx_connections_connected_user_id ON connections(connected_user_id);
CREATE INDEX IF NOT EXISTS idx_connections_user_status ON connections(user_id, status);

-- Step 5: Make connected_user_id NOT NULL (after backfilling)
ALTER TABLE connections 
  ALTER COLUMN connected_user_id SET NOT NULL;
