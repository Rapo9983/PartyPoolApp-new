/*
  # Fix current_amount trigger to handle all contribution changes

  ## Changes

  1. Function Updates
    - Modified `update_event_current_amount()` to only sum contributions with payment_status = 'confirmed'
    - Added support for UPDATE and DELETE operations using COALESCE for OLD/NEW records

  2. Trigger Updates
    - Updated trigger to fire on INSERT, UPDATE, and DELETE operations
    - Ensures current_amount stays synchronized with actual confirmed contributions

  3. Data Recalculation
    - Recalculates current_amount for all existing events based on confirmed contributions only

  ## Important Notes
  - Only confirmed contributions are counted in current_amount
  - Promised (cash) contributions are not included until confirmed by organizer
  - Trigger handles all data modifications (INSERT, UPDATE, DELETE) automatically
*/

-- Drop existing trigger
DROP TRIGGER IF EXISTS update_event_amount_on_contribution ON contributions;

-- Update function to handle INSERT, UPDATE, and DELETE operations
CREATE OR REPLACE FUNCTION update_event_current_amount()
RETURNS TRIGGER AS $$
DECLARE
  affected_event_id uuid;
BEGIN
  -- Determine which event_id to update
  IF TG_OP = 'DELETE' THEN
    affected_event_id := OLD.event_id;
  ELSE
    affected_event_id := NEW.event_id;
  END IF;

  -- Update the event's current_amount with only confirmed contributions
  UPDATE events
  SET current_amount = (
    SELECT COALESCE(SUM(amount), 0)
    FROM contributions
    WHERE event_id = affected_event_id
    AND payment_status = 'confirmed'
  )
  WHERE id = affected_event_id;

  -- If updating and event_id changed, update the old event too
  IF TG_OP = 'UPDATE' AND OLD.event_id != NEW.event_id THEN
    UPDATE events
    SET current_amount = (
      SELECT COALESCE(SUM(amount), 0)
      FROM contributions
      WHERE event_id = OLD.event_id
      AND payment_status = 'confirmed'
    )
    WHERE id = OLD.event_id;
  END IF;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Create new trigger that handles INSERT, UPDATE, and DELETE
CREATE TRIGGER update_event_amount_on_contribution
  AFTER INSERT OR UPDATE OR DELETE ON contributions
  FOR EACH ROW
  EXECUTE FUNCTION update_event_current_amount();

-- Recalculate current_amount for all existing events (only confirmed contributions)
UPDATE events
SET current_amount = (
  SELECT COALESCE(SUM(amount), 0)
  FROM contributions
  WHERE contributions.event_id = events.id
  AND contributions.payment_status = 'confirmed'
);