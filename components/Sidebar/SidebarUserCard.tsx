import { useState } from 'react'
import { useAuth } from '@/context/AuthContext'

const ROLE_LABELS: Record<string, string> = {
  admin: 'Admin',
  teaching: 'Teaching',
  nonteaching: 'Non-Teaching',
}

interface Props {
  onLogout: () => void | Promise<void>
}

const SidebarUserCard: React.FC<Props> = ({ onLogout }) => {
  const { user, profile } = useAuth()
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const displayName = [profile?.first_name, profile?.last_name].filter(Boolean).join(' ') || user?.email || 'User'
  const roleLabel = ROLE_LABELS[profile?.role ?? ''] ?? 'Non-Teaching'

  const handleLogout = async () => {
    setIsLoggingOut(true)
    try {
      await onLogout()
    } finally {
      setIsLoggingOut(false)
    }
  }

  return (
    <div className="mt-auto">
      <div className="mb-4 p-3 rounded-lg bg-gray-800/50 border border-gray-700/50">
        <p className="text-sm font-medium text-gray-200 truncate">{displayName}</p>
        <span className="text-xs text-blue-400">{roleLabel}</span>
      </div>
      <button
        onClick={handleLogout}
        disabled={isLoggingOut}
        className={`w-full font-semibold py-2 px-3 rounded-lg transition ${
          isLoggingOut
            ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
            : 'bg-red-600 hover:bg-red-700 text-white'
        }`}
      >
        {isLoggingOut ? 'Signing out...' : 'Sign Out'}
      </button>
    </div>
  )
}

export default SidebarUserCard
