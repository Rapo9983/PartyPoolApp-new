/*
  # Create RPC function for atomic budget increment
  
  1. New Function
    - `increment_event_amount` - Safely increments event's current_amount
    - Parameters:
      - event_id (uuid): The event to update
      - amount (numeric): The amount to add
    - Returns: boolean indicating success
  
  2. Security
    - Function is accessible to authenticated and anonymous users
    - Uses atomic operation to prevent race conditions
    - Validates that amount is positive
  
  3. Benefits
    - Atomic operation prevents race conditions
    - Server-side validation
    - Single database round-trip
    - More reliable than client-side fetch-and-update
*/

CREATE OR REPLACE FUNCTION increment_event_amount(
  event_id uuid,
  amount numeric
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Validate amount is positive
  IF amount <= 0 THEN
    RAISE EXCEPTION 'Amount must be positive';
  END IF;
  
  -- Atomically increment the current_amount
  UPDATE events
  SET current_amount = current_amount + amount
  WHERE id = event_id;
  
  -- Return true if a row was updated
  RETURN FOUND;
END;
$$;

-- Grant execute permission to authenticated and anonymous users
GRANT EXECUTE ON FUNCTION increment_event_amount TO authenticated, anon;