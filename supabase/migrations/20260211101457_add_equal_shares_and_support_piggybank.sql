/*
  # Add Equal Shares and Support Piggybank Features

  1. Changes to Events Table
    - Add `contribution_type` column (default: 'free')
      - 'free': Contributo Libero (default)
      - 'equal_shares': Quote Uguali
    - Add `participants_count` column (number of expected participants for equal shares)
    - Add `is_supporter` column (boolean flag for organizers who donated their piggybank)

  2. Changes to Contributions Table
    - Add `support_amount` column (extra €1 for PartyPool support)
    - Add `base_amount` column (actual gift contribution amount)

  3. Important Notes
    - The `amount` column in contributions will remain the total amount (base + support)
    - The `current_amount` in events will continue to track only gift contributions (excluding support)
    - Support amounts will be summed separately for the piggybank feature

  4. Migration Logic
    - Existing events default to 'free' contribution type
    - Existing contributions have support_amount = 0
    - base_amount for existing contributions equals amount
*/

-- Add new columns to events table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'events' AND column_name = 'contribution_type'
  ) THEN
    ALTER TABLE events ADD COLUMN contribution_type text DEFAULT 'free' CHECK (contribution_type IN ('free', 'equal_shares'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'events' AND column_name = 'participants_count'
  ) THEN
    ALTER TABLE events ADD COLUMN participants_count integer DEFAULT NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'events' AND column_name = 'is_supporter'
  ) THEN
    ALTER TABLE events ADD COLUMN is_supporter boolean DEFAULT false;
  END IF;
END $$;

-- Add new columns to contributions table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'contributions' AND column_name = 'support_amount'
  ) THEN
    ALTER TABLE contributions ADD COLUMN support_amount decimal(10,2) DEFAULT 0 NOT NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'contributions' AND column_name = 'base_amount'
  ) THEN
    ALTER TABLE contributions ADD COLUMN base_amount decimal(10,2) DEFAULT 0 NOT NULL;
  END IF;
END $$;

-- Update existing contributions to set base_amount equal to amount and support_amount to 0
UPDATE contributions
SET base_amount = amount, support_amount = 0
WHERE base_amount = 0;

-- Update the trigger function to only count base_amount (not support_amount) toward event goal
CREATE OR REPLACE FUNCTION update_event_current_amount()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE events
    SET current_amount = current_amount + NEW.base_amount
    WHERE id = NEW.event_id;
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    UPDATE events
    SET current_amount = current_amount - OLD.base_amount + NEW.base_amount
    WHERE id = NEW.event_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE events
    SET current_amount = current_amount - OLD.base_amount
    WHERE id = OLD.event_id;
    RETURN OLD;
  END IF;
END;
$$ LANGUAGE plpgsql;
