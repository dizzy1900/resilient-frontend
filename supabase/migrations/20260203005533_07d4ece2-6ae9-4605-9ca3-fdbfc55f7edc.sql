-- Create batch_jobs table to track portfolio analysis jobs
CREATE TABLE public.batch_jobs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  total_assets INTEGER DEFAULT 0,
  processed_assets INTEGER DEFAULT 0,
  report_url TEXT,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create portfolio_assets table to store CSV data
CREATE TABLE public.portfolio_assets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  job_id UUID NOT NULL REFERENCES public.batch_jobs(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  lat NUMERIC(10, 6) NOT NULL,
  lon NUMERIC(10, 6) NOT NULL,
  value NUMERIC(15, 2) NOT NULL,
  result JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for faster lookups by job_id
CREATE INDEX idx_portfolio_assets_job_id ON public.portfolio_assets(job_id);

-- Enable Row Level Security (public access for this demo)
ALTER TABLE public.batch_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.portfolio_assets ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (no auth required for demo)
CREATE POLICY "Allow public read access on batch_jobs"
  ON public.batch_jobs FOR SELECT
  USING (true);

CREATE POLICY "Allow public insert access on batch_jobs"
  ON public.batch_jobs FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow public update access on batch_jobs"
  ON public.batch_jobs FOR UPDATE
  USING (true);

CREATE POLICY "Allow public read access on portfolio_assets"
  ON public.portfolio_assets FOR SELECT
  USING (true);

CREATE POLICY "Allow public insert access on portfolio_assets"
  ON public.portfolio_assets FOR INSERT
  WITH CHECK (true);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_batch_jobs_updated_at
  BEFORE UPDATE ON public.batch_jobs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for batch_jobs table
ALTER PUBLICATION supabase_realtime ADD TABLE public.batch_jobs;