-- Add attachments columns to submissions table
ALTER TABLE submissions 
ADD COLUMN IF NOT EXISTS journal_attachments JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS book_attachments JSONB DEFAULT '{}';