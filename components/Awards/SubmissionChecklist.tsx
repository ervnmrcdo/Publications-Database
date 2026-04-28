'use client';

import { CheckSquare, Square } from 'lucide-react';

interface SubmissionChecklistProps {
  checkedItems: string[];
  onToggle: (item: string) => void;
  disabled?: boolean;
}

const CHECKLIST_ITEMS = [
  'All authors have signed',
  'All necessary textboxes are filled',
  'All necessary checkboxes are ticked',
  'I certify the information is correct',
];

export default function SubmissionChecklist({ checkedItems, onToggle, disabled }: SubmissionChecklistProps) {
  return (
    <div className="bg-[#1b1e2b] rounded-lg p-4 w-64 shrink-0">
      <h3 className="text-sm font-semibold text-white mb-3 flex items-center">
        <CheckSquare className="w-4 h-4 mr-2" />
        Requirements
      </h3>
      <div className="space-y-2">
        {CHECKLIST_ITEMS.map(item => (
          <label
            key={item}
            className={`flex items-start gap-2 p-2 rounded cursor-pointer transition ${
              disabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-800'
            }`}
          >
            <button
              type="button"
              disabled={disabled}
              onClick={() => onToggle(item)}
              className="shrink-0 mt-0.5"
            >
              {checkedItems.includes(item) ? (
                <CheckSquare className="w-5 h-5 text-green-500" />
              ) : (
                <Square className="w-5 h-5 text-gray-500" />
              )}
            </button>
            <span className={`text-sm ${checkedItems.includes(item) ? 'text-green-400' : 'text-gray-400'}`}>
              {item}
            </span>
          </label>
        ))}
      </div>
      {!disabled && (
        <div className="mt-3 pt-3 border-t border-gray-700">
          <p className="text-xs text-gray-500">
            All items must be checked before submitting
          </p>
        </div>
      )}
    </div>
  );
}