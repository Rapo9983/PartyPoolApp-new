/*
  # Force Recalculate All Event Amounts

  This migration recalculates the current_amount for all events
  to ensure data consistency after fixing the trigger bug.
*/

-- Ricalcola TUTTI i current_amount degli eventi
UPDATE events
SET current_amount = (
  SELECT COALESCE(SUM(amount), 0)
  FROM contributions
  WHERE event_id = events.id
  AND payment_status = 'confirmed'
);
