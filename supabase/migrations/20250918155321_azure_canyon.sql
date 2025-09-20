/*
  # Fix RLS policy for skins table

  1. Security Changes
    - Update RLS policy for skins table to allow INSERT operations
    - Ensure authenticated users can manage skins data
    - Fix policy for skins insertion from admin panel

  2. Changes
    - Drop existing restrictive policy
    - Create new policy allowing authenticated users to INSERT skins
    - Maintain security while allowing admin operations
*/

-- Drop existing restrictive policy if it exists
DROP POLICY IF EXISTS "Authenticated users can manage skins" ON skins;

-- Create new policy that allows authenticated users to manage skins
CREATE POLICY "Authenticated users can manage skins"
  ON skins
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Ensure the policy for reading skins by public users still exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'skins' 
    AND policyname = 'Anyone can read skins'
  ) THEN
    CREATE POLICY "Anyone can read skins"
      ON skins
      FOR SELECT
      TO public
      USING (true);
  END IF;
END $$;