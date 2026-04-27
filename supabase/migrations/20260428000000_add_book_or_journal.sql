-- Binary classification column on publications (NULL = unclassified)
ALTER TABLE publications
  ADD COLUMN IF NOT EXISTS book_or_journal text
  CHECK (book_or_journal IN ('JOURNAL', 'BOOK'));

-- Direct type gate on awards (replaces publication_per_award junction table)
ALTER TABLE awards
  ADD COLUMN IF NOT EXISTS allowed_type text
  CHECK (allowed_type IN ('JOURNAL', 'BOOK'));

-- Award 1 = Journal, Award 2 = Book (matches FormEditing.tsx hardcoded award IDs)
UPDATE awards SET allowed_type = 'JOURNAL' WHERE award_id = 1;
UPDATE awards SET allowed_type = 'BOOK' WHERE award_id = 2;

-- Delete old custom type data (tables remain for now, rows cleared)
DELETE FROM publication_per_award;
DELETE FROM publication_type;
