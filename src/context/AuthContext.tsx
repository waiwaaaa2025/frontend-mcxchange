import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { User, UserRole } from '../types'
import api from '../services/api'

// Roles a user can switch their session into post-login (acquired via
// subscription). Seller is not switch-into, so it's excluded here.
type RoleHint = 'buyer' | 'compliance_manager'
// Roles selectable on the login page. Seller is a valid login hint but never a
// switch-into role, so login accepts a wider set than switchRole.
type LoginRoleHint = 'buyer' | 'seller' | 'compliance_manager'

interface LoginResult {
  user: User
  // When set, the caller asked to sign in as this role but didn't have it —
  // the LoginPage uses this to route them into the right subscribe flow.
  needsSubscription?: RoleHint
}

interface AuthContextType {
  user: User | null
  login: (email: string, password: string, roleHint?: LoginRoleHint) => Promise<LoginResult>
  register: (email: string, password: string, name: string, role: UserRole, phone?: string, termsAccepted?: boolean) => Promise<User>
  switchRole: (role: RoleHint) => Promise<User>
  logout: () => void
  isAuthenticated: boolean
  isLoading: boolean
  isProfileComplete: boolean
  profileCompletionPercent: number
  checkProfileComplete: () => Promise<void>
  isIdentityVerified: boolean
  refreshIdentityStatus: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

interface AuthProviderProps {
  children: ReactNode
}

// Helper to convert backend role (uppercase) to frontend role (lowercase)
const normalizeRole = (role: string): UserRole => {
  const lowerRole = role.toLowerCase()
  if (lowerRole === 'buyer' || lowerRole === 'seller' || lowerRole === 'admin' || lowerRole === 'compliance_manager') {
    return lowerRole as UserRole
  }
  return 'buyer' // default fallback
}

// Helper to convert frontend role to backend role (uppercase)
const toBackendRole = (role: UserRole): string => {
  return role.toUpperCase()
}

// Transform API user response to frontend User type
const transformUser = (apiUser: any): User => {
  return {
    id: apiUser.id,
    email: apiUser.email,
    name: apiUser.name,
    role: normalizeRole(apiUser.role),
    avatar: apiUser.avatar || undefined,
    verified: apiUser.verified || apiUser.emailVerified || false,
    trustScore: apiUser.trustScore || 0,
    memberSince: new Date(apiUser.memberSince || apiUser.createdAt),
    completedDeals: apiUser.completedDeals || 0,
    reviews: apiUser.reviews || [],
    totalCredits: apiUser.totalCredits || 0,
    usedCredits: apiUser.usedCredits || 0,
    identityVerified: apiUser.identityVerified || false,
    identityVerificationStatus: apiUser.identityVerificationStatus || null,
    trialEndsAt: apiUser.trialEndsAt ? new Date(apiUser.trialEndsAt) : null,
    availableRoles: Array.isArray(apiUser.availableRoles)
      ? apiUser.availableRoles.map((r: string) => normalizeRole(r))
      : undefined,
  }
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isProfileComplete, setIsProfileComplete] = useState(true)
  const [profileCompletionPercent, setProfileCompletionPercent] = useState(100)

  // Calculate profile completion based on profile data
  const calculateProfileCompletion = (profileData: any): { complete: boolean; percent: number } => {
    const fields = ['name', 'phone', 'companyName', 'city', 'state']
    const filled = fields.filter(f => profileData[f]?.toString().trim()).length
    const percent = Math.round((filled / fields.length) * 100)
    return { complete: percent >= 100, percent }
  }

  // Check if user profile is complete
  const checkProfileComplete = async () => {
    if (!user) {
      setIsProfileComplete(true)
      setProfileCompletionPercent(100)
      return
    }

    try {
      const response = await api.getProfile()
      if (response.success && response.data) {
        const { complete, percent } = calculateProfileCompletion(response.data)
        setIsProfileComplete(complete)
        setProfileCompletionPercent(percent)
      }
    } catch (error) {
      console.error('Failed to check profile completion:', error)
      // Default to complete on error to not block the user
      setIsProfileComplete(true)
      setProfileCompletionPercent(100)
    }
  }

  useEffect(() => {
    // Check for stored token and validate session
    const initAuth = async () => {
      const token = api.getToken()
      if (token) {
        try {
          // Validate token by getting current user
          const response = await api.getCurrentUser()
          if (response.user) {
            const transformedUser = transformUser(response.user)
            setUser(transformedUser)
            localStorage.setItem('mcx_user', JSON.stringify(transformedUser))

            // Check profile completion for non-admin users
            if (transformedUser.role !== 'admin') {
              try {
                const profileResponse = await api.getProfile()
                if (profileResponse.success && profileResponse.data) {
                  const { complete, percent } = calculateProfileCompletion(profileResponse.data)
                  setIsProfileComplete(complete)
                  setProfileCompletionPercent(percent)
                }
              } catch (e) {
                // Silent fail for profile check
              }
            }
          } else {
            // No user returned, clear everything
            api.setToken(null)
            localStorage.removeItem('mcx_user')
            localStorage.removeItem('mcx_refresh_token')
            setUser(null)
          }
        } catch (error) {
          // Token is invalid, clear it
          console.error('Session validation failed:', error)
          api.setToken(null)
          localStorage.removeItem('mcx_user')
          localStorage.removeItem('mcx_refresh_token')
          setUser(null)
        }
      } else {
        // No token, clear any stale user data
        localStorage.removeItem('mcx_user')
        localStorage.removeItem('mcx_refresh_token')
        setUser(null)
      }
      setIsLoading(false)
    }

    initAuth()
  }, [])

  // Refresh-token flow gave up — clear React state so authenticated effects stop polling.
  useEffect(() => {
    const handleSessionExpired = () => {
      setUser(null)
      setIsProfileComplete(true)
      setProfileCompletionPercent(100)
    }
    window.addEventListener('session-expired', handleSessionExpired)
    return () => window.removeEventListener('session-expired', handleSessionExpired)
  }, [])

  const login = async (
    email: string,
    password: string,
    roleHint?: LoginRoleHint
  ): Promise<LoginResult> => {
    setIsLoading(true)
    try {
      const response = await api.login(email, password, roleHint)

      const transformedUser = transformUser(response.user)
      setUser(transformedUser)
      localStorage.setItem('mcx_user', JSON.stringify(transformedUser))

      // Check profile completion for non-admin users
      if (transformedUser.role !== 'admin') {
        try {
          const profileResponse = await api.getProfile()
          if (profileResponse.success && profileResponse.data) {
            const { complete, percent } = calculateProfileCompletion(profileResponse.data)
            setIsProfileComplete(complete)
            setProfileCompletionPercent(percent)
          }
        } catch (e) {
          // Silent fail for profile check
        }
      }

      return {
        user: transformedUser,
        needsSubscription: response.needsSubscription as RoleHint | undefined,
      }
    } catch (error: any) {
      console.error('Login failed:', error)
      throw new Error(error.message || 'Login failed. Please check your credentials.')
    } finally {
      setIsLoading(false)
    }
  }

  const switchRole = async (role: RoleHint): Promise<User> => {
    const response = await api.switchRole(role)
    const transformedUser = transformUser(response.user)
    setUser(transformedUser)
    localStorage.setItem('mcx_user', JSON.stringify(transformedUser))
    return transformedUser
  }

  const register = async (email: string, password: string, name: string, role: UserRole, phone?: string, termsAccepted?: boolean): Promise<User> => {
    setIsLoading(true)
    try {
      const response = await api.register({
        email,
        password,
        name,
        role: toBackendRole(role),
        phone,
        termsAccepted
      })

      const transformedUser = transformUser(response.user)
      setUser(transformedUser)
      localStorage.setItem('mcx_user', JSON.stringify(transformedUser))

      // New users have incomplete profiles (only name and phone are filled)
      if (transformedUser.role !== 'admin') {
        // If phone is provided, 2 out of 5 fields are filled (40%)
        // Otherwise, 1 out of 5 (20%)
        const percent = phone ? 40 : 20
        setIsProfileComplete(false)
        setProfileCompletionPercent(percent)
      }

      return transformedUser
    } catch (error: any) {
      console.error('Registration failed:', error)
      throw new Error(error.message || 'Registration failed. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const isIdentityVerified = user?.identityVerified || user?.role === 'admin' || false

  const refreshIdentityStatus = async () => {
    if (!user) return
    try {
      const response = await api.getIdentityStatus()
      if (response.success && response.data) {
        const updated = {
          ...user,
          identityVerified: response.data.identityVerified,
          identityVerificationStatus: response.data.identityVerificationStatus
        }
        setUser(updated)
        localStorage.setItem('mcx_user', JSON.stringify(updated))
      }
    } catch (error) {
      console.error('Failed to refresh identity status:', error)
    }
  }

  const logout = async () => {
    try {
      await api.logout()
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      setUser(null)
      setIsProfileComplete(true)
      setProfileCompletionPercent(100)
      localStorage.removeItem('mcx_user')
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        register,
        switchRole,
        logout,
        isAuthenticated: !!user,
        isLoading,
        isProfileComplete,
        profileCompletionPercent,
        checkProfileComplete,
        isIdentityVerified,
        refreshIdentityStatus
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}
