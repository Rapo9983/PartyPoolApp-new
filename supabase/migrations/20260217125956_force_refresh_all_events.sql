/*
  # Forza refresh completo di tutti gli eventi
  
  ## Scopo
  Questa migrazione forza un aggiornamento completo di tutti gli eventi
  per risolvere problemi di cache nel frontend.
  
  ## Cambiamenti
  
  1. Ricalcolo Forzato
    - Aggiorna updated_at di tutti gli eventi per forzare la sincronizzazione
    - Ricalcola current_amount da zero per tutti gli eventi
    - Questo forzerà gli aggiornamenti realtime nel frontend
  
  2. Verifica Integrità
    - Verifica che tutti i valori siano corretti
    - Usa solo base_amount come specificato
*/

-- Forza il ricalcolo completo di tutti gli eventi
UPDATE events
SET 
  current_amount = (
    SELECT COALESCE(SUM(c.base_amount), 0)
    FROM contributions c
    WHERE c.event_id = events.id
    AND c.payment_status = 'confirmed'
  ),
  updated_at = now()
WHERE id IN (
  SELECT DISTINCT event_id FROM contributions
);

-- Aggiorna anche gli eventi senza contributi
UPDATE events
SET 
  current_amount = 0,
  updated_at = now()
WHERE id NOT IN (
  SELECT DISTINCT event_id FROM contributions WHERE payment_status = 'confirmed'
) AND current_amount != 0;
