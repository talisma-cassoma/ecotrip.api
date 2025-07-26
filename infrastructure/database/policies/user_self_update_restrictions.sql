-- First, create a simpler RLS policy that just checks ownership
CREATE POLICY "Users can update only their own profile"
ON users
FOR UPDATE
USING ((auth.uid()) = id)
WITH CHECK ((auth.uid()) = id);

-- Then create a trigger function to check field restrictions
CREATE OR REPLACE FUNCTION check_user_update_restrictions()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if user is trying to change restricted fields
  IF NEW.role IS DISTINCT FROM OLD.role OR 
     NEW.created_at IS DISTINCT FROM OLD.created_at THEN
    RAISE EXCEPTION 'You cannot modify the role or created_at fields';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply the trigger
CREATE TRIGGER enforce_user_update_restrictions
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION check_user_update_restrictions();