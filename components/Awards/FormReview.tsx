'use client';

import { FileText, ChevronLeft, Send, Loader2, Link } from 'lucide-react';
import { useAwardsFlow } from '@/context/AwardsFlowContext';
import { useState } from 'react';
import SubmissionChecklist from './SubmissionChecklist';

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
  requirements?: string[];
};

export default function FormReview({ onSubmit, onSaveDraft, onBack, isJournal, isSubmitting }: FormReviewProps) {
  const { setFormStep, checklist, setChecklist } = useAwardsFlow();
  const checklistItems = isJournal ? JOURNAL_CHECKLIST : BOOK_CHECKLIST;

  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
  const [showSaveDraftConfirm, setShowSaveDraftConfirm] = useState(false);

  const [driveUrl, setDriveUrl] = useState('');
  const [driveChecklist, setDriveChecklist] = useState<string[]>([]);

  const toggleChecklist = (item: string) => {
    if (checklist.includes(item)) {
      setChecklist(checklist.filter(i => i !== item));
    } else {
      setChecklist([...checklist, item]);
    }
  };

  const handleBack = () => {
    setFormStep('form43');
    onBack();
  };

  const toggleDriveCheck = (item: string) => {
    setDriveChecklist(prev =>
      prev.includes(item) ? prev.filter(i => i !== item) : [...prev, item]
    );
  };

  const REQUIRED_CHECKLIST = [
    'All authors have signed',
    'All necessary textboxes are filled',
    'All necessary checkboxes are ticked',
    'I certify the information is correct',
  ];

  const isRequirementsComplete = REQUIRED_CHECKLIST.every(item => checklist.includes(item));

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
    <div className="mb-8 flex gap-4">
      <div className="flex-1">
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
                    checked={driveChecklist.includes(item)}
                    onChange={() => toggleDriveCheck(item)}
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
            onClick={() => {
              onSaveDraft({ drive_url: driveUrl, checklist: driveChecklist, requirements: checklist });
            }}
            disabled={isSubmitting}
            className="flex items-center px-6 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700 disabled:opacity-50"
          >
            <Loader2 className="w-4 h-4 mr-2" />
            Save as Draft
          </button>

          <button
            onClick={() => {
              if (!isRequirementsComplete) {
                alert('Please complete all requirements before submitting.');
                return;
              }
              onSubmit({ drive_url: driveUrl, checklist: driveChecklist });
            }}
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

      <SubmissionChecklist
        checkedItems={checklist}
        onToggle={toggleChecklist}
      />
    </div>
  );
}