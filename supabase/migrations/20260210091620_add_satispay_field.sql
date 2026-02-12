/*
  # Add Satispay Payment Field

  ## Overview
  Adds support for Satispay as an alternative payment method by storing
  the organizer's Satispay phone number or ID.

  ## New Column
  
  ### events table additions:
  - `satispay_id` (text) - Organizer's Satispay phone number or ID for receiving payments
  
  ## Notes
  - Field is optional (nullable) to maintain compatibility with existing events
  - Can store either a phone number (e.g., +39 123 456 7890) or Satispay username
  - Used to display payment information to contributors
*/

-- Add satispay_id column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'events' AND column_name = 'satispay_id'
  ) THEN
    ALTER TABLE events ADD COLUMN satispay_id text;
  END IF;
END $$;
