'use client';

import { useState } from 'react';
import { AcceptedForm } from '@/lib/types';
import { motion, AnimatePresence } from 'framer-motion';
import SignedFormsListing from '@/components/Admin/SignedFormsListing';
import SubmissionLogs from '@/components/SubmissionLogs';
import dynamic from 'next/dynamic';
import { useAuth } from '@/context/AuthContext';

const SignedFormInstance = dynamic(() => import('@/components/Admin/SignedFormInstance'), { ssr: false });

export default function SignedFormsPage() {
  const { user } = useAuth();
  const [selectedForm, setSelectedForm] = useState<AcceptedForm | null>(null);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-white mb-6">Signed Forms</h1>
      <AnimatePresence mode="wait">
        {!selectedForm ? (
          <motion.div
            key="list"
            initial={{ x: 100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -100, opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <SignedFormsListing 
              adminId={user?.id || ''} 
              onSelect={setSelectedForm} 
            />
          </motion.div>
        ) : (
          <motion.div
            key="detail"
            initial={{ x: 100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -100, opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <SignedFormInstance 
              data={selectedForm} 
              onBack={() => setSelectedForm(null)} 
            />
            <SubmissionLogs logs={selectedForm.logs} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
