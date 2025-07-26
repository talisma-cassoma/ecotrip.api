-- Create a simpler RLS policy that just checks ownership
CREATE POLICY "Drivers can update their car info only"
ON drivers
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Create a trigger function to check rating restriction
CREATE OR REPLACE FUNCTION check_driver_rating_unchanged()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if driver is trying to change the rating field
  IF NEW.rating IS DISTINCT FROM OLD.rating THEN
    RAISE EXCEPTION 'Drivers cannot modify their own rating';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply the trigger
CREATE TRIGGER enforce_driver_rating_restriction
BEFORE UPDATE ON drivers
FOR EACH ROW
EXECUTE FUNCTION check_driver_rating_unchanged();