import { ReactNode } from 'react'
import { useAuth } from '../context/AuthContext'
import AuthPromptPage from './AuthPromptPage'
import IdentityVerificationPrompt from './IdentityVerificationPrompt'
import type { UserRole } from '../types'

interface VerificationRequiredRouteProps {
  children: ReactNode
  // Only these roles must be verified; everyone else sees the page as normal.
  // Omit to require verification for every non-admin role.
  roles?: UserRole[]
}

/**
 * A route wrapper that requires authentication AND a verified identity.
 * Used only where a buyer is buying a business (deposit page, transaction room).
 * - Not authenticated -> shows AuthPromptPage
 * - Admin, or a role not listed in `roles` -> renders children
 * - Not identity verified -> shows IdentityVerificationPrompt
 * - Otherwise -> renders children
 */
const VerificationRequiredRoute = ({ children, roles }: VerificationRequiredRouteProps) => {
  const { isAuthenticated, isLoading, user, isIdentityVerified } = useAuth()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
          <div className="flex flex-col items-center gap-4">
            <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-gray-500">Loading...</p>
          </div>
        </div>
      </div>
    )
  }

  // Not authenticated - show auth prompt page
  if (!isAuthenticated) {
    return <AuthPromptPage />
  }

  // Admin bypass, and roles this route doesn't verify (e.g. the seller in a transaction)
  if (user?.role === 'admin' || (roles && (!user || !roles.includes(user.role)))) {
    return <>{children}</>
  }

  // Not identity verified - show verification prompt
  if (!isIdentityVerified) {
    return <IdentityVerificationPrompt />
  }

  return <>{children}</>
}

export default VerificationRequiredRoute
