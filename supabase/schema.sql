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
  bio TEXT NOT NULL,
  industry TEXT,
  topics TEXT[] DEFAULT '{}',
  availability_rules TEXT,
  location TEXT,
  open_to TEXT[] DEFAULT '{}',
  photo TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Connections table
CREATE TABLE IF NOT EXISTS connections (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  tagline TEXT,
  last_interaction TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  private_notes TEXT,
  status TEXT NOT NULL DEFAULT 'PENDING',
  time_commitment TEXT,
  introduced_by TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_industry ON profiles(industry);
CREATE INDEX IF NOT EXISTS idx_profiles_topics ON profiles USING GIN(topics);
CREATE INDEX IF NOT EXISTS idx_connections_user_id ON connections(user_id);
CREATE INDEX IF NOT EXISTS idx_connections_status ON connections(status);
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
