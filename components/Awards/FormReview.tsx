'use client';

import { FileText, ChevronLeft, Send, Loader2, Link } from 'lucide-react';
import { useAwardsFlow } from '@/context/AwardsFlowContext';
import { useState } from 'react';

interface FormReviewProps {
  onSubmit: (attachments: AttachmentData) => void;
  onSaveDraft: (attachments: AttachmentData) => void;
  onBack: () => void;
  isJournal: boolean;
  isSubmitting: boolean;
}

const JOURNAL_CHECKLIST = [
  'Copy of the Journal Article',
];

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
  drive_url: string;
  checklist: string[];
};

export default function FormReview({ onSubmit, onSaveDraft, onBack, isJournal, isSubmitting }: FormReviewProps) {
  const { setFormStep } = useAwardsFlow();
  const checklistItems = isJournal ? JOURNAL_CHECKLIST : BOOK_CHECKLIST;

  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
  const [showSaveDraftConfirm, setShowSaveDraftConfirm] = useState(false);

  const [driveUrl, setDriveUrl] = useState('');
  const [checklist, setChecklist] = useState<string[]>([]);

  const handleBack = () => {
    setFormStep('form43');
    onBack();
  };

  const toggleCheck = (item: string) => {
    setChecklist(prev =>
      prev.includes(item) ? prev.filter(i => i !== item) : [...prev, item]
    );
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
    <div className="mb-8">
      <button
        onClick={handleBack}
        className="flex items-center text-gray-400 hover:text-white mb-4"
      >
        <ChevronLeft className="w-5 h-5 mr-1" /> Back to Form 4.3
      </button>

      <h2 className="text-2xl font-bold text-white mb-6">Review Your Application</h2>

      <div className="space-y-4 mb-6">
        <p className="text-gray-300 font-medium">Completed Forms:</p>
        {formsList}
      </div>

      {/* Attachments Section */}
      <div className="bg-[#1b1e2b] rounded-lg p-6 mt-6">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-white">Supporting Documents</h3>
          <p className="text-sm text-gray-400 mt-0.5">
            Optional — paste your Google Drive folder link and check off what's included
          </p>
        </div>

        {/* Google Drive URL */}
        <div className="mb-5">
          <label className="block text-sm text-gray-300 mb-1">Google Drive Folder Link</label>
          <div className="flex items-center bg-gray-800 border border-gray-700 rounded px-3 py-2 focus-within:border-blue-500">
            <Link className="w-4 h-4 text-gray-500 mr-2 shrink-0" />
            <input
              type="url"
              placeholder="https://drive.google.com/drive/folders/..."
              value={driveUrl}
              onChange={e => setDriveUrl(e.target.value)}
              className="flex-1 bg-transparent text-white text-sm placeholder-gray-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Checklist */}
        <div>
          <label className="block text-sm text-gray-300 mb-2">Documents included in the folder</label>
          <div className="space-y-2">
            {checklistItems.map(item => (
              <label
                key={item}
                className="flex items-center gap-3 p-3 bg-gray-800 rounded-lg cursor-pointer hover:bg-gray-700 transition"
              >
                <input
                  type="checkbox"
                  checked={checklist.includes(item)}
                  onChange={() => toggleCheck(item)}
                  className="w-4 h-4 accent-blue-500"
                />
                <span className="text-sm text-gray-300">{item}</span>
              </label>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-6 p-4 bg-blue-900/30 border border-blue-800 rounded-lg">
        <p className="text-blue-300 text-sm">
          <strong>Note:</strong> Once you submit, all forms will be sent for review. 
          You won&apos;t be able to make changes after submission.
        </p>
      </div>

      <div className="flex justify-between mt-6">
        <button
          onClick={() => setShowSaveDraftConfirm(true)}
          disabled={isSubmitting}
          className="flex items-center px-6 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700 disabled:opacity-50"
        >
          <Loader2 className="w-4 h-4 mr-2" />
          Save as Draft
        </button>

        <button
          onClick={() => onSubmit({ drive_url: driveUrl, checklist })}
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

      {/* Submit Confirmation Dialog */}
      {showSubmitConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-[#1b1e2b] rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4 text-white">Confirm Submit</h3>
            <p className="text-sm text-gray-300 mb-6">
              Are you sure you want to submit? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                className="px-4 py-2 border rounded-md hover:bg-gray-700"
                onClick={() => setShowSubmitConfirm(false)}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                onClick={() => {
                  setShowSubmitConfirm(false);
                  onSubmit({ drive_url: driveUrl, checklist });
                }}
              >
                Confirm Submit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Save Draft Confirmation Dialog */}
      {showSaveDraftConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-[#1b1e2b] rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4 text-white">Save as Draft</h3>
            <p className="text-sm text-gray-300 mb-6">
              Do you want to save your progress as a draft?
            </p>
            <div className="flex justify-end gap-3">
              <button
                className="px-4 py-2 border rounded-md hover:bg-gray-700"
                onClick={() => setShowSaveDraftConfirm(false)}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 bg-yellow-500 text-white rounded-md hover:bg-yellow-600"
                onClick={() => {
                  setShowSaveDraftConfirm(false);
                  onSaveDraft({ drive_url: driveUrl, checklist });
                }}
              >
                Save Draft
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}