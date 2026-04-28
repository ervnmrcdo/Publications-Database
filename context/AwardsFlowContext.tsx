'use client'

import React, { createContext, useContext, useState, Dispatch, SetStateAction, useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'

export type AwardsStep = 'awards' | 'publications' | 'form'

export type FormStep = 'form41' | 'form42' | 'form43' | 'form44' | 'review'

interface AwardsFlowContextValue {
  step: AwardsStep
  setStep: Dispatch<SetStateAction<AwardsStep>>
  formStep: FormStep
  setFormStep: Dispatch<SetStateAction<FormStep>>
  isJournal: boolean
  setIsJournal: Dispatch<SetStateAction<boolean>>
  draftId: string | null
  setDraftId: Dispatch<SetStateAction<string | null>>
  draftUrls: Record<string, string | null>
  setDraftUrls: Dispatch<SetStateAction<Record<string, string | null>>>
  draftsMap: Record<string, boolean>
  setDraftsMap: Dispatch<SetStateAction<Record<string, boolean>>>
  checklist: string[]
  setChecklist: Dispatch<SetStateAction<string[]>>
}

const AwardsFlowContext = createContext<AwardsFlowContextValue | undefined>(undefined)

export function AwardsFlowProvider({ children }: { children: React.ReactNode }) {
  const [step, setStep] = useState<AwardsStep>('awards')
  const [formStep, setFormStep] = useState<FormStep>('form44')
  const [isJournal, setIsJournal] = useState(true)
  const [draftId, setDraftId] = useState<string | null>(null)
  const [draftUrls, setDraftUrls] = useState<Record<string, string | null>>({})
  const [draftsMap, setDraftsMap] = useState<Record<string, boolean>>({})
  const [checklist, setChecklist] = useState<string[]>([])
  const { user } = useAuth()
  
  useEffect(() => {
    setStep('awards')
    setFormStep('form44')
    setIsJournal(true)
    setDraftId(null)
    setDraftUrls({})
    setDraftsMap({})
    setChecklist([])
  }, [user?.id])

  return (
    <AwardsFlowContext.Provider value={{ step, setStep, formStep, setFormStep, isJournal, setIsJournal, draftId, setDraftId, draftUrls, setDraftUrls, draftsMap, setDraftsMap, checklist, setChecklist }}>
      {children}
    </AwardsFlowContext.Provider>
  )
}

export function useAwardsFlow() {
  const ctx = useContext(AwardsFlowContext)
  if (!ctx) throw new Error('useAwardsFlow must be used within AwardsFlowProvider')
  return ctx
}
