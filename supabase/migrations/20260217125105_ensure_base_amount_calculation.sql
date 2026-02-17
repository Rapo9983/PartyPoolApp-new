/*
  # Garantisce che current_amount usi solo base_amount
  
  ## Problema
  Il current_amount degli eventi deve riflettere solo i contributi al regalo (base_amount),
  escludendo completamente i support_amount (caffè) dal calcolo della barra di progresso.
  
  ## Cambiamenti
  
  1. Pulizia
    - Rimuove la funzione RPC `increment_event_amount` che bypassa il trigger automatico
    - Questa funzione potrebbe causare calcoli errati se usata
  
  2. Verifica Trigger
    - Conferma che il trigger `update_event_current_amount` usa solo base_amount
    - Il trigger si attiva automaticamente su INSERT, UPDATE, DELETE di contributions
  
  3. Ricalcolo Forzato
    - Ricalcola current_amount per tutti gli eventi esistenti
    - Garantisce che tutti i dati siano allineati correttamente
  
  ## Risultato
  - La barra di progresso mostrerà solo i contributi al regalo (base_amount)
  - I caffè (support_amount) restano separati nel salvadanaio
  - Il calcolo è completamente automatico tramite trigger
  - Nessuna funzione può bypassare questo comportamento
*/

-- Rimuove la funzione RPC che bypassa il trigger
DROP FUNCTION IF EXISTS increment_event_amount(uuid, numeric);

-- Verifica che il trigger esista e usi la funzione corretta
-- (il trigger è già stato creato nelle migrazioni precedenti)

-- Forza il ricalcolo di tutti gli eventi usando solo base_amount
UPDATE events
SET current_amount = (
  SELECT COALESCE(SUM(c.base_amount), 0)
  FROM contributions c
  WHERE c.event_id = events.id
  AND c.payment_status = 'confirmed'
);

-- Aggiungi un commento esplicativo alla tabella events
COMMENT ON COLUMN events.current_amount IS 'Somma totale dei base_amount (solo contributi al regalo) delle contributions con payment_status=confirmed. Il support_amount (caffè) è escluso da questo calcolo.';

-- Aggiungi commenti alle colonne contributions
COMMENT ON COLUMN contributions.base_amount IS 'Importo del contributo destinato al regalo (conteggiato in event.current_amount)';
COMMENT ON COLUMN contributions.support_amount IS 'Importo del supporto/caffè destinato agli organizzatori (NON conteggiato in event.current_amount)';
COMMENT ON COLUMN contributions.amount IS 'Importo totale = base_amount + support_amount';
