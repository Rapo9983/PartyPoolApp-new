/*
  # Add current_amount field and auto-update trigger

  ## Changes
  
  1. Schema Updates
    - Add `current_amount` column to `events` table with default value of 0
    - This tracks the real-time total of all contributions for each event
  
  2. Automatic Updates
    - Create function `update_event_current_amount()` to recalculate totals
    - Create trigger `update_event_amount_on_contribution` that fires after INSERT on contributions
    - Automatically updates the parent event's current_amount whenever a new contribution is added
  
  3. Data Integrity
    - Backfill existing events with their current contribution totals
    - Ensures all existing data is accurate before the trigger takes over
  
  ## Notes
  - The trigger ensures current_amount is always in sync with actual contributions
  - Uses AFTER INSERT trigger to maintain data consistency
  - Recalculates the full sum to ensure accuracy
*/

-- Add current_amount column to events table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'events' AND column_name = 'current_amount'
  ) THEN
    ALTER TABLE events ADD COLUMN current_amount numeric(10,2) DEFAULT 0 NOT NULL;
  END IF;
END $$;

-- Create function to update event's current_amount
CREATE OR REPLACE FUNCTION update_event_current_amount()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE events
  SET current_amount = (
    SELECT COALESCE(SUM(amount), 0)
    FROM contributions
    WHERE event_id = NEW.event_id
  )
  WHERE id = NEW.event_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger on contributions table
DROP TRIGGER IF EXISTS update_event_amount_on_contribution ON contributions;
CREATE TRIGGER update_event_amount_on_contribution
  AFTER INSERT ON contributions
  FOR EACH ROW
  EXECUTE FUNCTION update_event_current_amount();

-- Backfill current_amount for existing events
UPDATE events
SET current_amount = (
  SELECT COALESCE(SUM(amount), 0)
  FROM contributions
  WHERE contributions.event_id = events.id
);
