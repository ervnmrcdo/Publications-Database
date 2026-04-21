'use client'

import React, { createContext, useContext, useState, Dispatch, SetStateAction, useEffect } from 'react'
import { AcceptedForm, RejectedForm, DraftForm } from '@/lib/types'
import { useAuth } from '@/context/AuthContext'

export type SubmissionsSelected = AcceptedForm | RejectedForm | DraftForm | null

interface SubmissionsFlowContextValue {
  selected: SubmissionsSelected
  setSelected: Dispatch<SetStateAction<SubmissionsSelected>>
}

const SubmissionsFlowContext = createContext<SubmissionsFlowContextValue | undefined>(undefined)

export function SubmissionsFlowProvider({ children }: { children: React.ReactNode }) {
  const [selected, setSelected] = useState<SubmissionsSelected>(null)
  const { user } = useAuth()

  useEffect(() => {
    setSelected(null)
  }, [user?.id])

  return (
    <SubmissionsFlowContext.Provider value={{ selected, setSelected }}>
      {children}
    </SubmissionsFlowContext.Provider>
  )
}

export function useSubmissionsFlow() {
  const ctx = useContext(SubmissionsFlowContext)
  if (!ctx) throw new Error('useSubmissionsFlow must be used within SubmissionsFlowProvider')
  return ctx
}
