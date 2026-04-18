'use client';

import { FileText, ChevronLeft, Send, Loader2, Link } from 'lucide-react';
import { useAwardsFlow } from '@/context/AwardsFlowContext';
import { useState } from 'react';

interface FormReviewProps {
  onSubmit: (attachments: AttachmentMap) => void;
  onBack: () => void;
  isJournal: boolean;
  isSubmitting: boolean;
}

const JOURNAL_FIELDS = [
  { key: 'journal_article', label: 'Copy of the Journal Article' },
];

const BOOK_FIELDS = [
  { key: 'book_chapter', label: 'Copy of Book / Book Chapter' },
  { key: 'book_cover', label: 'Book Cover' },
  { key: 'copyright_page', label: 'Copyright Page' },
  { key: 'preface', label: 'Preface' },
  { key: 'table_of_contents', label: 'Table of Contents' },
  { key: 'contributors_notes', label: 'List of Contributors or Contributors Notes' },
  { key: 'proof_of_peer_review', label: 'Proof of Peer Review Process' },
];

type AttachmentMap = Record<string, string>;

export default function FormReview({ onSubmit, onBack, isJournal, isSubmitting }: FormReviewProps) {
  const { setFormStep } = useAwardsFlow();
  const fields = isJournal ? JOURNAL_FIELDS : BOOK_FIELDS;

  const [attachments, setAttachments] = useState<AttachmentMap>(
    Object.fromEntries(fields.map(f => [f.key, '']))
  );  

  const handleBack = () => {
    setFormStep('form43');
    onBack();
  };

  const updateAttachment = (key: string, value: string) => {
    setAttachments(prev => ({ ...prev, [key]: value }));
  };

  const formsList = isJournal ? (
    <>
      <div className="flex items-center p-4 bg-gray-800 rounded-lg">
        <FileText className="w-6 h-6 text-blue-400 mr-3" />
        <div>
          <p className="font-medium text-white">Form 4.1 - IPA Award Application</p>
          <p className="text-sm text-gray-400">PDF Document</p>
        </div>
        <span className="ml-auto text-green-400 text-sm">✓ Completed</span>
      </div>
      <div className="flex items-center p-4 bg-gray-800 rounded-lg">
        <FileText className="w-6 h-6 text-blue-400 mr-3" />
        <div>
          <p className="font-medium text-white">Form 4.2 - Journal Certification</p>
          <p className="text-sm text-gray-400">DOCX Document</p>
        </div>
        <span className="ml-auto text-green-400 text-sm">✓ Completed</span>
      </div>
      <div className="flex items-center p-4 bg-gray-800 rounded-lg">
        <FileText className="w-6 h-6 text-blue-400 mr-3" />
        <div>
          <p className="font-medium text-white">Form 4.3 - Certification</p>
          <p className="text-sm text-gray-400">DOCX Document</p>
        </div>
        <span className="ml-auto text-green-400 text-sm">✓ Completed</span>
      </div>
    </>
  ) : (
    <>
      <div className="flex items-center p-4 bg-gray-800 rounded-lg">
        <FileText className="w-6 h-6 text-blue-400 mr-3" />
        <div>
          <p className="font-medium text-white">Form 4.4 - Book Certification</p>
          <p className="text-sm text-gray-400">DOCX Document</p>
        </div>
        <span className="ml-auto text-green-400 text-sm">✓ Completed</span>
      </div>
      <div className="flex items-center p-4 bg-gray-800 rounded-lg">
        <FileText className="w-6 h-6 text-blue-400 mr-3" />
        <div>
          <p className="font-medium text-white">Form 4.3 - Certification</p>
          <p className="text-sm text-gray-400">DOCX Document</p>
        </div>
        <span className="ml-auto text-green-400 text-sm">✓ Completed</span>
      </div>
    </>
  );

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-white">Review Your Application</h2>
          <p className="text-gray-400 mt-1">Please review all forms before submitting</p>
        </div>
        <span className="text-sm text-gray-400">Final Step</span>
      </div>

      <div className="bg-[#1b1e2b] rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Completed Forms</h3>
        <div className="space-y-3">
          {formsList}
        </div>
      </div>

      {/* Attachments Section */}
      <div className="bg-[#1b1e2b] rounded-lg p-6 mt-6">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-white">
            {isJournal ? 'Journal Article Attachments' : 'Book Chapter Attachments'}
          </h3>
          <p className="text-sm text-gray-400 mt-0.5">
            Optional — paste links to your supporting documents
          </p>
        </div>

        <div className="space-y-4">
          {fields.map(({ key, label }) => (
            <div key={key}>
              <label className="block text-sm text-gray-300 mb-1">{label}</label>
              <div className="flex items-center bg-gray-800 border border-gray-700 rounded px-3 py-2 focus-within:border-blue-500">
                <Link className="w-4 h-4 text-gray-500 mr-2 shrink-0" />
                <input
                  type="url"
                  placeholder="https://..."
                  value={attachments[key]}
                  onChange={e => updateAttachment(key, e.target.value)}
                  className="flex-1 bg-transparent text-white text-sm placeholder-gray-500 focus:outline-none"
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-6 p-4 bg-blue-900/30 border border-blue-800 rounded-lg">
        <p className="text-blue-300 text-sm">
          <strong>Note:</strong> Once you submit, all forms will be sent for review. 
          You won't be able to make changes after submission.
        </p>
      </div>

      <div className="flex justify-between mt-6">
        <button
          onClick={handleBack}
          className="flex items-center px-6 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
        >
          <ChevronLeft className="w-4 h-4 mr-2" />
          Back to Form 4.3
        </button>
        
        <button
          onClick={()=>onSubmit(attachments)}
          disabled={isSubmitting}
          className="flex items-center px-8 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Submitting...
            </>
          ) : (
            <>
              Submit All Forms
              <Send className="w-4 h-4 ml-2" />
            </>
          )}
        </button>
      </div>
    </div>
  );
}
