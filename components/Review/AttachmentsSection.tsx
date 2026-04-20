type Props = {
  isJournal: boolean;
  journal_attachments?: Record<string, string>;
  book_attachments?: Record<string, string>;
};

const JOURNAL_LABELS: Record<string, string> = {
  journal_article: 'Copy of the Journal Article',
};

const BOOK_LABELS: Record<string, string> = {
  book_chapter: 'Copy of Book / Book Chapter',
  book_cover: 'Book Cover',
  copyright_page: 'Copyright Page',
  preface: 'Preface',
  table_of_contents: 'Table of Contents',
  contributors_notes: 'List of Contributors or Contributors Notes',
  proof_of_peer_review: 'Proof of Peer Review Process',
};

export default function AttachmentsSection({ isJournal, journal_attachments, book_attachments }: Props) {
  const attachments = isJournal ? journal_attachments : book_attachments;
  const labels = isJournal ? JOURNAL_LABELS : BOOK_LABELS;
  const filled = Object.entries(attachments ?? {}).filter(([, url]) => url);

  if (filled.length === 0) return null;

  return (
    <div className="border rounded-lg overflow-hidden">
      <div className="w-full px-4 py-3 bg-[#252836] flex items-center text-white">
        <span>{isJournal ? 'Journal Article Attachments' : 'Book Chapter Attachments'}</span>
      </div>
      <div className="p-4 bg-[#1a1e2b] space-y-2">
        {filled.map(([key, url]) => (
          <a
            key={key}
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-blue-400 hover:text-blue-300 text-sm"
          >
            <span>🔗</span>
            {labels[key] ?? key}
          </a>
        ))}
      </div>
    </div>
  );
}