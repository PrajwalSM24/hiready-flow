-- Create resume_logs table
CREATE TABLE public.resume_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  file_name TEXT NOT NULL,
  skills_score INTEGER NOT NULL,
  experience_score INTEGER NOT NULL,
  communication_score INTEGER NOT NULL,
  summary TEXT NOT NULL,
  recommendations JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.resume_logs ENABLE ROW LEVEL SECURITY;

-- Allow users to view their own logs
CREATE POLICY "Users can view their own resume logs"
ON public.resume_logs
FOR SELECT
USING (auth.uid() = user_id);

-- Allow users to insert their own logs
CREATE POLICY "Users can insert their own resume logs"
ON public.resume_logs
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX idx_resume_logs_user_id ON public.resume_logs(user_id);
CREATE INDEX idx_resume_logs_created_at ON public.resume_logs(created_at DESC);