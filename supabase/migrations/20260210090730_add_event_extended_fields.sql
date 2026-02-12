/*
  # Add Extended Event Fields

  ## Overview
  Adds new fields to the events table to support enhanced event management including
  gift tracking, PayPal payments, location, time, and currency preferences.

  ## New Columns
  
  ### events table additions:
  - `event_time` (time) - Time of the event
  - `location` (text) - Physical location/address of the event
  - `currency` (text) - Currency symbol for budget (€, $, £)
  - `gift_url` (text) - URL link to gift (e.g., Amazon product page)
  - `paypal_email` (text) - Organizer's PayPal email for receiving payments
  
  ## Notes
  - All new fields are optional (nullable) to maintain compatibility with existing events
  - Currency defaults to '$' for existing events
  - Gift URL can be any e-commerce link (Amazon, eBay, etc.)
  - PayPal email is used to generate dynamic payment links
*/

-- Add event_time column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'events' AND column_name = 'event_time'
  ) THEN
    ALTER TABLE events ADD COLUMN event_time time;
  END IF;
END $$;

-- Add location column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'events' AND column_name = 'location'
  ) THEN
    ALTER TABLE events ADD COLUMN location text;
  END IF;
END $$;

-- Add currency column with default
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'events' AND column_name = 'currency'
  ) THEN
    ALTER TABLE events ADD COLUMN currency text DEFAULT '$';
  END IF;
END $$;

-- Add gift_url column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'events' AND column_name = 'gift_url'
  ) THEN
    ALTER TABLE events ADD COLUMN gift_url text;
  END IF;
END $$;

-- Add paypal_email column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'events' AND column_name = 'paypal_email'
  ) THEN
    ALTER TABLE events ADD COLUMN paypal_email text;
  END IF;
END $$;
