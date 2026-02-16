/*
  # Admin Debug Function

  Creates a function that bypasses RLS to check all events and their contributions
  for debugging purposes.
*/

CREATE OR REPLACE FUNCTION admin_check_all_events()
RETURNS TABLE (
  event_id uuid,
  celebrant_name text,
  db_current_amount numeric,
  calculated_sum numeric,
  difference numeric,
  contrib_count bigint,
  status text
) 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    e.id,
    e.celebrant_name,
    e.current_amount,
    COALESCE(SUM(c.amount), 0) as calc_sum,
    e.current_amount - COALESCE(SUM(c.amount), 0) as diff,
    COUNT(c.id),
    CASE 
      WHEN e.current_amount = COALESCE(SUM(c.amount), 0) THEN '✓ OK'
      ELSE '✗ DISCREPANCY'
    END as status
  FROM events e
  LEFT JOIN contributions c ON c.event_id = e.id AND c.payment_status = 'confirmed'
  GROUP BY e.id, e.celebrant_name, e.current_amount
  HAVING e.current_amount > 0 OR COUNT(c.id) > 0
  ORDER BY e.created_at DESC;
END;
$$ LANGUAGE plpgsql;
