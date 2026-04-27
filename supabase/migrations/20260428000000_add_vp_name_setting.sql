-- Add vice_president_name setting for form 4.3 auto-fill
INSERT INTO settings (key, value) 
VALUES ('vice_president_name', '')
ON CONFLICT (key) DO NOTHING;
