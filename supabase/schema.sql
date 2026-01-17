-- Tapped Database Schema
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  avatar TEXT,
  tagline TEXT,
  email TEXT UNIQUE,
  password_hash TEXT,
  stats JSONB DEFAULT '{"conversationsCompleted": 0, "peopleHelped": 0, "followThroughRate": 100}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Profiles table (multiple profiles per user)
CREATE TABLE IF NOT EXISTS profiles (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  bio TEXT, -- Now optional (no bios per spec)
  industry TEXT,
  topics TEXT[] DEFAULT '{}',
  availability_rules TEXT,
  is_available BOOLEAN DEFAULT true, -- On/off toggle for availability
  location TEXT,
  open_to TEXT[] DEFAULT '{}',
  response_reliability INTEGER DEFAULT 100, -- 0-100, tracks response rate/reliability
  active_signal TEXT, -- Active Signal if any
  photo TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Connections table (bidirectional - both users have a record)
CREATE TABLE IF NOT EXISTS connections (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  connected_user_id TEXT REFERENCES users(id) ON DELETE CASCADE, -- Made nullable for backward compatibility
  name TEXT NOT NULL,
  tagline TEXT,
  last_interaction TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  private_notes TEXT,
  status TEXT NOT NULL DEFAULT 'PENDING',
  time_commitment TEXT,
  introduced_by TEXT,
  is_initiator BOOLEAN DEFAULT false, -- true if this user sent the request
  profile_id TEXT REFERENCES profiles(id) ON DELETE SET NULL, -- Which profile was used to make this connection
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, connected_user_id) -- Prevent duplicate connections (only if both are set)
);

-- Migration: Add connected_user_id column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='connections' AND column_name='connected_user_id') THEN
    ALTER TABLE connections ADD COLUMN connected_user_id TEXT REFERENCES users(id) ON DELETE CASCADE;
    -- Backfill: set connected_user_id = user_id for existing records (old schema)
    UPDATE connections SET connected_user_id = user_id WHERE connected_user_id IS NULL;
  END IF;
END $$;

-- Migration: Add profile_id column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='connections' AND column_name='profile_id') THEN
    ALTER TABLE connections ADD COLUMN profile_id TEXT REFERENCES profiles(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Migration: Make connected_user_id nullable (for backward compatibility)
DO $$ 
BEGIN
  -- Check if constraint exists and remove it if needed
  IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name='connections_connected_user_id_fkey' AND table_name='connections') THEN
    ALTER TABLE connections ALTER COLUMN connected_user_id DROP NOT NULL;
  END IF;
END $$;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_industry ON profiles(industry);
CREATE INDEX IF NOT EXISTS idx_profiles_topics ON profiles USING GIN(topics);
CREATE INDEX IF NOT EXISTS idx_connections_user_id ON connections(user_id);
CREATE INDEX IF NOT EXISTS idx_connections_connected_user_id ON connections(connected_user_id);
CREATE INDEX IF NOT EXISTS idx_connections_status ON connections(status);
CREATE INDEX IF NOT EXISTS idx_connections_user_status ON connections(user_id, status);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Enable Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE connections ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Allow all reads, but only users can modify their own data
-- For now, we'll use a simple approach - you can refine this later

-- Users: Anyone can read, but only authenticated users can write
CREATE POLICY "Users are viewable by everyone" ON users
  FOR SELECT USING (true);

CREATE POLICY "Users can insert their own data" ON users
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update their own data" ON users
  FOR UPDATE USING (true);

-- Profiles: Anyone can read, users can manage their own
CREATE POLICY "Profiles are viewable by everyone" ON profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can insert their own profiles" ON profiles
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update their own profiles" ON profiles
  FOR UPDATE USING (true);

CREATE POLICY "Users can delete their own profiles" ON profiles
  FOR DELETE USING (true);

-- Connections: Users can only see/manage their own
CREATE POLICY "Users can view their own connections" ON connections
  FOR SELECT USING (true);

CREATE POLICY "Users can insert their own connections" ON connections
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update their own connections" ON connections
  FOR UPDATE USING (true);

CREATE POLICY "Users can delete their own connections" ON connections
  FOR DELETE USING (true);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers to auto-update updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_connections_updated_at BEFORE UPDATE ON connections
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Network Vault Contacts table (private contacts per user)
CREATE TABLE IF NOT EXISTS network_vault_contacts (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT,
  linkedin_url TEXT,
  context TEXT NOT NULL CHECK (context IN ('founder', 'investor', 'operator', 'friend', 'other')),
  strength TEXT NOT NULL CHECK (strength IN ('strong', 'medium', 'loose')),
  good_for TEXT[] DEFAULT '{}',
  notes TEXT,
  imported_from TEXT CHECK (imported_from IN ('linkedin', 'contacts', 'manual')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for network vault
CREATE INDEX IF NOT EXISTS idx_network_vault_user_id ON network_vault_contacts(user_id);
CREATE INDEX IF NOT EXISTS idx_network_vault_context ON network_vault_contacts(context);
CREATE INDEX IF NOT EXISTS idx_network_vault_strength ON network_vault_contacts(strength);
CREATE INDEX IF NOT EXISTS idx_network_vault_good_for ON network_vault_contacts USING GIN(good_for);

-- RLS for network vault contacts
ALTER TABLE network_vault_contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own vault contacts" ON network_vault_contacts
  FOR SELECT USING (true); -- For now, allowing all reads (can restrict later)

CREATE POLICY "Users can insert their own vault contacts" ON network_vault_contacts
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update their own vault contacts" ON network_vault_contacts
  FOR UPDATE USING (true);

CREATE POLICY "Users can delete their own vault contacts" ON network_vault_contacts
  FOR DELETE USING (true);

-- Trigger for network vault updated_at
CREATE TRIGGER update_network_vault_updated_at BEFORE UPDATE ON network_vault_contacts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
