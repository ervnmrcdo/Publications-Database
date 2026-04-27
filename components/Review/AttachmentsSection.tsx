const JOURNAL_CHECKLIST = ['Copy of the Journal Article'];

const BOOK_CHECKLIST = [
  'Copy of Book / Book Chapter',
  'Book Cover',
  'Copyright Page',
  'Preface',
  'Table of Contents',
  'List of Contributors or Contributors Notes',
  'Proof of Peer Review Process',
];

type AttachmentData = {
  drive_url?: string;
  checklist?: string[];
};

type Props = {
  isJournal: boolean;
  journal_attachments?: AttachmentData;
  book_attachments?: AttachmentData;
};

export default function AttachmentsSection({ isJournal, journal_attachments, book_attachments }: Props) {
  const data = isJournal ? journal_attachments : book_attachments;
  const allItems = isJournal ? JOURNAL_CHECKLIST : BOOK_CHECKLIST;

  if (!data?.drive_url && !data?.checklist?.length) return null;

  return (
    <div className="border rounded-lg overflow-hidden">
      <div className="w-full px-4 py-3 bg-[#252836] flex items-center text-white">
        <span>{isJournal ? 'Journal Article Attachments' : 'Book Chapter Attachments'}</span>
      </div>
      <div className="p-4 bg-[#1a1e2b] space-y-4">

        {/* Drive URL */}
        {data?.drive_url && (
          <div>
            <p className="text-xs text-gray-400 mb-1">Google Drive Folder</p>
            
              href={data.drive_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-blue-400 hover:text-blue-300 text-sm break-all"
            <a >
              <span>🔗</span>
              {data.drive_url}
            </a>
          </div>
        )}

        {/* Checklist */}
        {allItems.length > 0 && (
          <div>
            <p className="text-xs text-gray-400 mb-2">Documents included</p>
            <div className="space-y-1">
              {allItems.map(item => {
                const checked = data?.checklist?.includes(item);
                return (
                  <div key={item} className="flex items-center gap-2 text-sm">
                    <span className={checked ? 'text-green-400' : 'text-gray-600'}>
                      {checked ? '☑' : '☐'}
                    </span>
                    <span className={checked ? 'text-gray-200' : 'text-gray-500'}>
                      {item}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}