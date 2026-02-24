-- Add user_id column to batch_jobs table
ALTER TABLE public.batch_jobs 
ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Add user_id column to portfolio_assets table  
ALTER TABLE public.portfolio_assets
ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Drop existing overly permissive policies on batch_jobs
DROP POLICY IF EXISTS "Allow public insert access on batch_jobs" ON public.batch_jobs;
DROP POLICY IF EXISTS "Allow public read access on batch_jobs" ON public.batch_jobs;
DROP POLICY IF EXISTS "Allow public update access on batch_jobs" ON public.batch_jobs;

-- Drop existing overly permissive policies on portfolio_assets
DROP POLICY IF EXISTS "Allow public insert access on portfolio_assets" ON public.portfolio_assets;
DROP POLICY IF EXISTS "Allow public read access on portfolio_assets" ON public.portfolio_assets;

-- Create secure RLS policies for batch_jobs
CREATE POLICY "Users can view their own batch jobs"
ON public.batch_jobs FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own batch jobs"
ON public.batch_jobs FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own batch jobs"
ON public.batch_jobs FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own batch jobs"
ON public.batch_jobs FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Create secure RLS policies for portfolio_assets
CREATE POLICY "Users can view their own portfolio assets"
ON public.portfolio_assets FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own portfolio assets"
ON public.portfolio_assets FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own portfolio assets"
ON public.portfolio_assets FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own portfolio assets"
ON public.portfolio_assets FOR DELETE
TO authenticated
USING (auth.uid() = user_id);