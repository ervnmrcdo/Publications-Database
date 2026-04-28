import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Form41Editor from "./Form41Editor";
import Form42Editor from "./Form42Editor";
import Form43Editor from "./Form43Editor";
import Form44Editor from "./Form44Editor";
import FormReview from "./FormReview";
import { Award, Publication, SubmissionLog } from "@/lib/types";
import { useAwardsFlow } from "@/context/AwardsFlowContext";
import { Save } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

interface FormEditingProps {
  handleBack: () => void;
  selectedAward: Award;
  selectedPublication: Publication;
  userId?: string;
}

export default function FormEditing({ handleBack, selectedAward, selectedPublication, userId }: FormEditingProps) {
  const USER_INFO = useAuth().profile
  const { formStep, setFormStep, setIsJournal, draftUrls, setDraftUrls, setDraftId } = useAwardsFlow();

  const isJournalType = selectedAward.id === 1;
  const isBookType = selectedAward.id === 2;

  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setIsJournal(isJournalType);

    if (isBookType) {
      setFormStep('form44');
    } else {
      setFormStep('form41');
    }
  }, [selectedAward.id, isJournalType, isBookType, setFormStep, setIsJournal]);

  const getAnimationKey = () => {
    if (isJournalType) {
      return formStep;
    } else if (isBookType) {
      if (formStep === 'form43') return 'form43-book';
      if (formStep === 'review') return 'review-book';
      return formStep;
    }
    return formStep;
  };

  const handleFinalSubmit = async (attachments: { drive_url: string; checklist: string[] }) => {
    setIsSubmitting(true);
    try {

      const logs: SubmissionLog[] = [{
        action: 'SUBMITTED',
        remarks: '',
        date: new Date().toLocaleString(),
        actor_name: USER_INFO ? `${USER_INFO.first_name} ${USER_INFO.middle_name} ${USER_INFO.last_name}` : '',
      }];

      const res = await fetch('/api/submit-award/route', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          publicationId: selectedPublication.publication_id,
          awardId: selectedAward.id,
          logs,
          userId,
          attachments,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Submission failed');
      }

      const data = await res.json();

      setDraftUrls({});
      setDraftId(null);

      alert('Submission successful! Your application has been submitted for review.');
      handleBack();
    } catch (err) {
      console.error('Failed to submit:', err);
      alert(err instanceof Error ? err.message : 'Failed to submit application. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveAsDraft = async (attachments: { drive_url: string; checklist: string[] }) => {
    setIsSubmitting(true);
    try {
      const draftData = {
        publicationId: selectedPublication.publication_id,
        awardId: selectedAward.id,
        user_id: userId,
      };

      let savedSubmissionId: number | null = null;

      for (const [formType, url] of Object.entries(draftUrls)) {
        if (url) {
          const res = await fetch('/api/save-as-draft/route', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              ...draftData,
              formType,
              fileUrl: url,
            }),
          });
          if (res.ok && !savedSubmissionId) {
            const data = await res.json();
            savedSubmissionId = data.submission_id;
          }
        }
      }

      const attachRes = await fetch('/api/save-as-draft/route', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...draftData,
          attachments,
        }),
      });
      if (attachRes.ok && !savedSubmissionId) {
        const data = await attachRes.json();
        savedSubmissionId = data.submission_id;
      }

      if (savedSubmissionId) setDraftId(String(savedSubmissionId));

      alert('Draft saved successfully! You can continue editing later.');
      handleBack();
    } catch (err) {
      console.error('Failed to save draft:', err);
      alert(err instanceof Error ? err.message : 'Failed to save draft. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getCurrentDraftUrl = () => {
    if (formStep === 'form41') return draftUrls.form41;
    if (formStep === 'form42') return draftUrls.form42;
    if (formStep === 'form43') return draftUrls.form43;
    if (formStep === 'form44') return draftUrls.form44;
    return null;
  };

  const hasDraft = (draftUrl: string | null | undefined) => draftUrl && draftUrl.length > 0;

  return (
    <>
      <div className="flex justify-between items-start mb-4">
        <button
          onClick={() => {
            if (formStep === 'form41') {
              handleBack();
            } else if (formStep === 'form42') {
              setFormStep('form41');
            } else if (formStep === 'form44') {
              handleBack();
            } else if (formStep === 'form43') {
              if (isJournalType) {
                setFormStep('form42');
              } else {
                setFormStep('form44');
              }
            } else if (formStep === 'review') {
              setFormStep('form43');
            }
          }}
          className="text-sm text-blue-600 hover:underline"
        >
          ← Back to {formStep === 'form41' || formStep === 'form44' ? 'Publications' : 'Previous Form'}
        </button>
      </div>

      <h1 className="text-2xl font-bold mb-2 text-white">
        {selectedAward?.title} Application
      </h1>
      <p className="text-sm text-gray-400 mb-6">
        {isJournalType
          ? 'Journal Publication (Forms 4.1 → 4.2 → 4.3 → Review → Submit)'
          : 'Book Publication (Forms 4.4 → 4.3 → Review → Submit)'}
      </p>

      <div className="bg-[#1b1e2b] shadow-md rounded-xl p-6">
        <AnimatePresence mode="wait">
          {formStep === 'form41' && isJournalType && (
            <motion.div
              key="form41"
              initial={{ x: formStep === 'form41' ? 0 : 200, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -200, opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Form41Editor
                publicationId={selectedPublication.publication_id}
                documentUrl={draftUrls.form41 || undefined}
                awardId={selectedAward.id}
                userId={userId}
              />
              <div className="mt-4 flex justify-end">
                <button
                  onClick={() => setFormStep('form42')}
                  className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Next →
                </button>
              </div>
            </motion.div>
          )}

          {formStep === 'form42' && isJournalType && (
            <motion.div
              key="form42"
              initial={{ x: 200, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -200, opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Form42Editor
                publicationId={selectedPublication.publication_id}
                documentUrl={draftUrls.form42 || undefined}
                awardId={selectedAward.id}
                userId={userId}
              />
              <div className="mt-4 flex justify-end">
                <button
                  onClick={() => setFormStep('form43')}
                  className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Next →
                </button>
              </div>
            </motion.div>
          )}

          {formStep === 'form44' && isBookType && (
            <motion.div
              key="form44"
              initial={{ x: 200, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -200, opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Form44Editor
                publicationId={selectedPublication.publication_id}
                documentUrl={draftUrls.form44 || undefined}
                awardId={selectedAward.id}
                userId={userId}
              />
              <div className="mt-4 flex justify-end">
                <button
                  onClick={() => setFormStep('form43')}
                  className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Next →
                </button>
              </div>
            </motion.div>
          )}

          {formStep === 'form43' && (
            <motion.div
              key={getAnimationKey()}
              initial={{ x: 200, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -200, opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Form43Editor
                publicationId={selectedPublication.publication_id}
                documentUrl={draftUrls.form43 || undefined}
                awardId={selectedAward.id}
                userId={userId}
              />
              <div className="mt-4 flex justify-end">
                <button
                  onClick={() => setFormStep('review')}
                  className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Next →
                </button>
              </div>
            </motion.div>
          )}

          {formStep === 'review' && (
            <motion.div
              key={getAnimationKey()}
              initial={{ x: 200, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -200, opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <FormReview
                onSubmit={handleFinalSubmit}
                onSaveDraft={handleSaveAsDraft}
                onBack={() => setFormStep('form43')}
                isJournal={isJournalType}
                isSubmitting={isSubmitting}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div >
    </>
  );
};

