/*
  # Add Celebrant Image to Events

  1. Changes
    - Add `celebrant_image` column to `events` table
      - Type: text (can store URL or Base64 string)
      - Nullable: true (optional field)
      - Allows organizers to personalize events with celebrant photos
  
  2. Security
    - No RLS changes needed (existing policies remain valid)
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'events' AND column_name = 'celebrant_image'
  ) THEN
    ALTER TABLE events ADD COLUMN celebrant_image text;
  END IF;
END $$;
