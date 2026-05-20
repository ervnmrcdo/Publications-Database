'use client';

import { CheckSquare } from 'lucide-react';

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
    <div className="bg-[#1b1e2b] rounded-lg p-4 w-full">
      <h3 className="text-sm font-semibold text-white mb-3 flex items-center">
        <CheckSquare className="w-4 h-4 mr-2" />
        Requirements
      </h3>
      <div className="flex flex-wrap gap-3">
        {CHECKLIST_ITEMS.map(item => (
          <label
            key={item}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition ${
              checkedItems.includes(item)
                ? 'bg-green-900/30 border border-green-700/50'
                : 'bg-gray-800/50 border border-gray-700/50 hover:bg-gray-800'
            } ${
              disabled ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            <input
              type="checkbox"
              checked={checkedItems.includes(item)}
              onChange={() => !disabled && onToggle(item)}
              className="w-5 h-5 accent-green-500 cursor-pointer shrink-0"
            />
            <span className={`text-sm whitespace-nowrap ${checkedItems.includes(item) ? 'text-green-400' : 'text-gray-400'}`}>
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