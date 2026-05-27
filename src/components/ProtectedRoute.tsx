import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { UserRole } from '../types'
import { ReactNode } from 'react'

interface ProtectedRouteProps {
  children: ReactNode
  allowedRoles?: UserRole[]
}

// Helper to get the correct dashboard path for a user's role
const getDashboardPath = (role: UserRole): string => {
  switch (role) {
    case 'seller':
      return '/seller/dashboard'
    case 'buyer':
      return '/buyer/dashboard'
    case 'admin':
      return '/admin/dashboard'
    case 'compliance_manager':
      return '/compliance/dashboard'
    default:
      return '/'
  }
}

const ProtectedRoute = ({ children, allowedRoles }: ProtectedRouteProps) => {
  const { user, isLoading, isAuthenticated } = useAuth()
  const location = useLocation()

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

  // Not authenticated - redirect to login with return URL
  if (!isAuthenticated || !user) {
    return <Navigate to={`/login?redirect=${encodeURIComponent(location.pathname)}`} replace />
  }

  // User is logged in but trying to access a route they don't have permission for
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Redirect them to their own dashboard instead of home
    return <Navigate to={getDashboardPath(user.role)} replace />
  }

  return <>{children}</>
}

export default ProtectedRoute
