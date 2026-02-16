/*
  # Debug View for Contributions Diagnostics

  Creates a temporary function to debug contribution discrepancies
*/

-- Crea una funzione di debug che mostra tutti i dettagli
CREATE OR REPLACE FUNCTION debug_event_contributions(p_event_id uuid)
RETURNS TABLE (
  contribution_id uuid,
  contributor_name text,
  amount numeric,
  base_amount numeric,
  support_amount numeric,
  payment_status text,
  created_at timestamptz,
  event_current_amount numeric,
  manual_sum numeric
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id,
    c.contributor_name,
    c.amount,
    c.base_amount,
    c.support_amount,
    c.payment_status,
    c.created_at,
    e.current_amount,
    (SELECT COALESCE(SUM(amount), 0) 
     FROM contributions 
     WHERE event_id = p_event_id 
     AND payment_status = 'confirmed') as manual_sum
  FROM contributions c
  JOIN events e ON e.id = c.event_id
  WHERE c.event_id = p_event_id
  ORDER BY c.created_at DESC;
END;
$$ LANGUAGE plpgsql;
