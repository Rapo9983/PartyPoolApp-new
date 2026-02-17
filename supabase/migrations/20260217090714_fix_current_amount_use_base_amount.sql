/*
  # Fix current_amount to use only base_amount
  
  ## Problem
  The trigger `update_event_current_amount` was summing the total `amount` field
  (which includes both gift contribution + support), but according to the design:
  - `current_amount` should only track gift contributions (base_amount)
  - Support amounts (€1 coffee) should be tracked separately in the piggybank
  
  ## Solution
  Update the trigger function to sum only `base_amount` instead of `amount`
  for confirmed contributions
  
  ## Impact
  - Budget progress bar will show only gift contributions
  - Support amounts remain separate in the piggybank feature
  - All events will be recalculated with correct values
*/

-- Update function to sum only base_amount (not total amount)
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

  -- Update the event's current_amount with only base_amount from confirmed contributions
  UPDATE events
  SET current_amount = (
    SELECT COALESCE(SUM(base_amount), 0)
    FROM contributions
    WHERE event_id = affected_event_id
    AND payment_status = 'confirmed'
  )
  WHERE id = affected_event_id;

  -- If updating and event_id changed, update the old event too
  IF TG_OP = 'UPDATE' AND OLD.event_id != NEW.event_id THEN
    UPDATE events
    SET current_amount = (
      SELECT COALESCE(SUM(base_amount), 0)
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

-- Recalculate current_amount for all existing events (only base_amount from confirmed contributions)
UPDATE events
SET current_amount = (
  SELECT COALESCE(SUM(base_amount), 0)
  FROM contributions
  WHERE contributions.event_id = events.id
  AND contributions.payment_status = 'confirmed'
);