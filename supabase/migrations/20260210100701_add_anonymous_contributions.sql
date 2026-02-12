/*
  # Add Anonymous Contributions Support

  1. Changes
    - Add `is_anonymous` column to `contributions` table
      - Type: boolean
      - Default: false
      - Allows users to make anonymous contributions
  
  2. Security
    - No RLS changes needed (existing policies remain valid)
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'contributions' AND column_name = 'is_anonymous'
  ) THEN
    ALTER TABLE contributions ADD COLUMN is_anonymous boolean DEFAULT false;
  END IF;
END $$;
