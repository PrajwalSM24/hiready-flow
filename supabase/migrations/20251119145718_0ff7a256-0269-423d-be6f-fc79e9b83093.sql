-- Add file_size and overall_score columns to resume_logs table
ALTER TABLE public.resume_logs
ADD COLUMN IF NOT EXISTS file_size INTEGER,
ADD COLUMN IF NOT EXISTS overall_score INTEGER;

-- Create index for overall_score for faster queries
CREATE INDEX IF NOT EXISTS idx_resume_logs_overall_score ON public.resume_logs(overall_score DESC);