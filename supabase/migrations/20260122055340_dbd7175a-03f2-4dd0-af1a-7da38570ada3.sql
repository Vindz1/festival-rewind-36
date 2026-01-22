-- Drop existing RESTRICTIVE policies and recreate as PERMISSIVE
DROP POLICY IF EXISTS "Users can view their own concerts" ON public.user_concerts;
DROP POLICY IF EXISTS "Users can add their own concerts" ON public.user_concerts;
DROP POLICY IF EXISTS "Users can delete their own concerts" ON public.user_concerts;

-- Recreate as PERMISSIVE policies (default)
CREATE POLICY "Users can view their own concerts" 
ON public.user_concerts 
FOR SELECT 
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can add their own concerts" 
ON public.user_concerts 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own concerts" 
ON public.user_concerts 
FOR DELETE 
TO authenticated
USING (auth.uid() = user_id);