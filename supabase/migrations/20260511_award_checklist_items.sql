CREATE TABLE IF NOT EXISTS public.award_checklist_items (
    id SERIAL PRIMARY KEY,
    award_type TEXT NOT NULL CHECK (award_type IN ('JOURNAL', 'BOOK')),
    item TEXT NOT NULL,
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true
);

INSERT INTO public.award_checklist_items (award_type, item, sort_order) VALUES
    ('JOURNAL', 'Copy of the Journal Article', 0),
    ('BOOK', 'Copy of Book / Book Chapter', 0),
    ('BOOK', 'Book Cover', 1),
    ('BOOK', 'Copyright Page', 2),
    ('BOOK', 'Preface', 3),
    ('BOOK', 'Table of Contents', 4),
    ('BOOK', 'List of Contributors or Contributors Notes', 5),
    ('BOOK', 'Proof of Peer Review Process', 6);
