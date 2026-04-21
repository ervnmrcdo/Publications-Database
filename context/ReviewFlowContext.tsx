'use client'

import React, { createContext, useContext, useState, Dispatch, SetStateAction, useEffect } from 'react'
import { Application } from '@/lib/types'
import { useAuth } from '@/context/AuthContext'

export type ReviewSelected = Application | null

interface ReviewFlowContextValue {
  selected: ReviewSelected
  setSelected: Dispatch<SetStateAction<ReviewSelected>>
}

const ReviewFlowContext = createContext<ReviewFlowContextValue | undefined>(undefined)

export function ReviewFlowProvider({ children }: { children: React.ReactNode }) {
  const [selected, setSelected] = useState<ReviewSelected>(null)
  const { user } = useAuth()

  useEffect(() => {
    setSelected(null)
  }, [user?.id])  

  return (
    <ReviewFlowContext.Provider value={{ selected, setSelected }}>
      {children}
    </ReviewFlowContext.Provider>
  )
}

export function useReviewFlow() {
  const ctx = useContext(ReviewFlowContext)
  if (!ctx) throw new Error('useReviewFlow must be used within ReviewFlowProvider')
  return ctx
}
