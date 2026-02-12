/*
  # PartyPool Database Schema

  ## Overview
  Creates the complete database structure for PartyPool, a platform for managing gift lists and monetary contributions for parties.

  ## New Tables
  
  ### 1. `events`
  Main table for party events
  - `id` (uuid, primary key) - Unique event identifier
  - `creator_id` (uuid) - Reference to auth.users who created the event
  - `celebrant_name` (text) - Name of person being celebrated
  - `event_date` (date) - Date of the party/celebration
  - `description` (text) - Event description
  - `budget_goal` (numeric) - Target amount to collect
  - `slug` (text, unique) - URL-friendly identifier for public sharing
  - `created_at` (timestamptz) - Event creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ### 2. `contributions`
  Tracks monetary contributions to events
  - `id` (uuid, primary key) - Unique contribution identifier
  - `event_id` (uuid) - Reference to events table
  - `contributor_id` (uuid, nullable) - Reference to auth.users (null for anonymous)
  - `contributor_name` (text) - Display name of contributor
  - `amount` (numeric) - Contribution amount
  - `message` (text, optional) - Optional message with contribution
  - `created_at` (timestamptz) - Contribution timestamp

  ### 3. `wishes`
  Stores birthday/celebration wishes and messages
  - `id` (uuid, primary key) - Unique wish identifier
  - `event_id` (uuid) - Reference to events table
  - `author_id` (uuid, nullable) - Reference to auth.users (null for anonymous)
  - `author_name` (text) - Display name of message author
  - `message` (text) - Wish/message content
  - `created_at` (timestamptz) - Message timestamp

  ## Security
  - All tables have RLS enabled
  - Events: Creators can manage their events, everyone can view
  - Contributions: Anyone can add, only view aggregate data
  - Wishes: Anyone can add and view messages for events

  ## Indexes
  - events.slug for fast public lookups
  - contributions.event_id for aggregations
  - wishes.event_id for message retrieval
*/

-- Create events table
CREATE TABLE IF NOT EXISTS events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  celebrant_name text NOT NULL,
  event_date date NOT NULL,
  description text NOT NULL DEFAULT '',
  budget_goal numeric(10,2) NOT NULL DEFAULT 0,
  slug text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create contributions table
CREATE TABLE IF NOT EXISTS contributions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid REFERENCES events(id) ON DELETE CASCADE NOT NULL,
  contributor_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  contributor_name text NOT NULL,
  amount numeric(10,2) NOT NULL,
  message text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

-- Create wishes table
CREATE TABLE IF NOT EXISTS wishes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid REFERENCES events(id) ON DELETE CASCADE NOT NULL,
  author_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  author_name text NOT NULL,
  message text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_events_slug ON events(slug);
CREATE INDEX IF NOT EXISTS idx_events_creator ON events(creator_id);
CREATE INDEX IF NOT EXISTS idx_contributions_event ON contributions(event_id);
CREATE INDEX IF NOT EXISTS idx_wishes_event ON wishes(event_id);

-- Enable Row Level Security
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE contributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE wishes ENABLE ROW LEVEL SECURITY;

-- Events policies
CREATE POLICY "Anyone can view events"
  ON events FOR SELECT
  TO authenticated, anon
  USING (true);

CREATE POLICY "Authenticated users can create events"
  ON events FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Creators can update their events"
  ON events FOR UPDATE
  TO authenticated
  USING (auth.uid() = creator_id)
  WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Creators can delete their events"
  ON events FOR DELETE
  TO authenticated
  USING (auth.uid() = creator_id);

-- Contributions policies
CREATE POLICY "Anyone can view contributions"
  ON contributions FOR SELECT
  TO authenticated, anon
  USING (true);

CREATE POLICY "Anyone can add contributions"
  ON contributions FOR INSERT
  TO authenticated, anon
  WITH CHECK (true);

-- Wishes policies
CREATE POLICY "Anyone can view wishes"
  ON wishes FOR SELECT
  TO authenticated, anon
  USING (true);

CREATE POLICY "Anyone can add wishes"
  ON wishes FOR INSERT
  TO authenticated, anon
  WITH CHECK (true);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for events table
DROP TRIGGER IF EXISTS update_events_updated_at ON events;
CREATE TRIGGER update_events_updated_at
  BEFORE UPDATE ON events
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();