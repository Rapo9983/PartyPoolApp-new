/*
  # Add Cash Payment Support

  1. Changes to `contributions` table
    - Add `payment_method` column (enum: 'digital', 'cash')
    - Add `payment_status` column (enum: 'confirmed', 'promised')
    - Digital payments are always 'confirmed'
    - Cash payments start as 'promised' and need organizer confirmation

  2. Security
    - Update RLS policies to handle new payment statuses
    - Only organizers can mark cash payments as 'confirmed'

  3. Important Notes
    - Existing contributions will default to 'digital' and 'confirmed'
    - Only 'confirmed' contributions count toward the current_amount
    - The trigger needs updating to handle promised vs confirmed amounts
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type WHERE typname = 'payment_method_type'
  ) THEN
    CREATE TYPE payment_method_type AS ENUM ('digital', 'cash');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type WHERE typname = 'payment_status_type'
  ) THEN
    CREATE TYPE payment_status_type AS ENUM ('confirmed', 'promised');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'contributions' AND column_name = 'payment_method'
  ) THEN
    ALTER TABLE contributions ADD COLUMN payment_method payment_method_type DEFAULT 'digital' NOT NULL;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'contributions' AND column_name = 'payment_status'
  ) THEN
    ALTER TABLE contributions ADD COLUMN payment_status payment_status_type DEFAULT 'confirmed' NOT NULL;
  END IF;
END $$;

DROP TRIGGER IF EXISTS update_event_current_amount ON contributions;
DROP FUNCTION IF EXISTS update_event_amount();

CREATE OR REPLACE FUNCTION update_event_amount()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.payment_status = 'confirmed' THEN
      UPDATE events
      SET current_amount = COALESCE(current_amount, 0) + NEW.amount
      WHERE id = NEW.event_id;
    END IF;
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.payment_status = 'promised' AND NEW.payment_status = 'confirmed' THEN
      UPDATE events
      SET current_amount = COALESCE(current_amount, 0) + NEW.amount
      WHERE id = NEW.event_id;
    ELSIF OLD.payment_status = 'confirmed' AND NEW.payment_status = 'promised' THEN
      UPDATE events
      SET current_amount = COALESCE(current_amount, 0) - NEW.amount
      WHERE id = NEW.event_id;
    ELSIF OLD.payment_status = 'confirmed' AND NEW.payment_status = 'confirmed' AND OLD.amount != NEW.amount THEN
      UPDATE events
      SET current_amount = COALESCE(current_amount, 0) - OLD.amount + NEW.amount
      WHERE id = NEW.event_id;
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    IF OLD.payment_status = 'confirmed' THEN
      UPDATE events
      SET current_amount = COALESCE(current_amount, 0) - OLD.amount
      WHERE id = OLD.event_id;
    END IF;
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_event_current_amount
AFTER INSERT OR UPDATE OR DELETE ON contributions
FOR EACH ROW
EXECUTE FUNCTION update_event_amount();

CREATE POLICY "Organizers can confirm cash payments"
  ON contributions
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM events
      WHERE events.id = contributions.event_id
      AND events.creator_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM events
      WHERE events.id = contributions.event_id
      AND events.creator_id = auth.uid()
    )
  );
