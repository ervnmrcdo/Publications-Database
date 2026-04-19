'use client';

import { FileText, ChevronLeft, Send, Loader2, Save } from 'lucide-react';
import { useAwardsFlow } from '@/context/AwardsFlowContext';
import { useState } from 'react';

interface FormReviewProps {
  onSubmit: () => void;
  onSaveDraft: () => void;
  onBack: () => void;
  isJournal: boolean;
  isSubmitting: boolean;
}

export default function FormReview({ onSubmit, onSaveDraft, onBack, isJournal, isSubmitting }: FormReviewProps) {
  const { setFormStep } = useAwardsFlow();
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
  const [showSaveDraftConfirm, setShowSaveDraftConfirm] = useState(false);

  const handleBack = () => {
    setFormStep('form43');
    onBack();
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
        
        <div className="flex gap-3">
          <button
            onClick={() => setShowSaveDraftConfirm(true)}
            disabled={isSubmitting}
            className="flex items-center px-6 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700 disabled:opacity-50"
          >
            <Save className="w-4 h-4 mr-2" />
            Save as Draft
          </button>
          
          <button
            onClick={() => setShowSubmitConfirm(true)}
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

      {/* Save as Draft Confirmation Dialog */}
      {showSaveDraftConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-[#1b1e2b] rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4 text-white">Save as Draft</h3>
            <p className="text-sm text-gray-300 mb-6">
              Are you sure you want to save this as a draft? You can continue editing later.
            </p>
            <div className="flex justify-end gap-3">
              <button
                className="px-4 py-2 border rounded-md hover:bg-gray-700"
                onClick={() => setShowSaveDraftConfirm(false)}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700"
                onClick={() => {
                  setShowSaveDraftConfirm(false);
                  onSaveDraft();
                }}
              >
                Save as Draft
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Submit Confirmation Dialog */}
      {showSubmitConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-[#1b1e2b] rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4 text-white">Confirm Submit</h3>
            <p className="text-sm text-gray-300 mb-6">
              Are you sure you want to submit this application? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                className="px-4 py-2 border rounded-md hover:bg-gray-700"
                onClick={() => setShowSubmitConfirm(false)}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                onClick={() => {
                  setShowSubmitConfirm(false);
                  onSubmit();
                }}
              >
                Confirm Submit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
