/*
  # Fix Duplicate Triggers Bug

  ## Problem
  Two triggers were updating current_amount simultaneously:
  1. `update_event_current_amount` - incremental updates (current_amount + NEW.amount)
  2. `update_event_amount_on_contribution` - full recalculation (SUM of all contributions)

  This caused current_amount to be DOUBLED because both triggers executed on every INSERT/UPDATE/DELETE.

  ## Solution
  - Drop the old incremental trigger `update_event_current_amount` and its function
  - Keep only the newer `update_event_amount_on_contribution` trigger which does full recalculation
  - Recalculate all current_amount values to fix existing data

  ## Impact
  - Fixes the bug where current_amount was showing double the actual contribution total
  - All events will have correct current_amount values after this migration
*/

-- Drop the old trigger that was causing duplicate updates
DROP TRIGGER IF EXISTS update_event_current_amount ON contributions;

-- Drop the old incremental function
DROP FUNCTION IF EXISTS update_event_amount();

-- Recalculate current_amount for ALL events to fix corrupted data
UPDATE events
SET current_amount = (
  SELECT COALESCE(SUM(amount), 0)
  FROM contributions
  WHERE contributions.event_id = events.id
  AND contributions.payment_status = 'confirmed'
);
