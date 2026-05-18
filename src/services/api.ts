import type {
  ApiResponse,
  BuyerPreferencesData,
  AuthLoginResponse,
  AuthRegisterResponse,
  AuthTokens,
  SubscriptionResponse,
  CheckoutSessionResponse,
  UserResponse,
  SubscriptionPlanConfig,
  CreditPack,
  FMCSACarrierData,
  FMCSAAuthorityHistory,
  FMCSAInsuranceHistory,
  FMCSASMSData,
  StripeTransaction,
} from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

class ApiService {
  private token: string | null = null;
  private refreshPromise: Promise<any> | null = null;

  constructor() {
    // Load token from localStorage on init
    this.token = localStorage.getItem('mcx_token');
  }

  setToken(token: string | null) {
    this.token = token;
    if (token) {
      localStorage.setItem('mcx_token', token);
    } else {
      localStorage.removeItem('mcx_token');
    }
  }

  getToken() {
    // Always check localStorage as fallback to handle hot-reload and timing issues
    return this.token || localStorage.getItem('mcx_token');
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    // Always check localStorage for the most current token
    // This ensures we pick up tokens set by other tabs or after hot-reload
    const currentToken = this.token || localStorage.getItem('mcx_token');
    if (currentToken) {
      (headers as Record<string, string>)['Authorization'] = `Bearer ${currentToken}`;
      // Sync instance token if it was only in localStorage
      if (!this.token && currentToken) {
        this.token = currentToken;
      }
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000); // 30s timeout

    try {
      const response = await fetch(url, {
        ...options,
        headers,
        signal: controller.signal,
      });

      const data = await response.json();

      if (!response.ok) {
        // Dispatch identity verification required event
        if (data.code === 'IDENTITY_VERIFICATION_REQUIRED') {
          window.dispatchEvent(new CustomEvent('identity-verification-required'));
        }
        const err = new Error(data.error || data.message || 'API request failed') as Error & { code?: string };
        err.code = data.code;
        throw err;
      }

      return data;
    } finally {
      clearTimeout(timeout);
    }
  }

  // Auth endpoints
  async login(email: string, password: string) {
    const response = await this.request<ApiResponse<AuthLoginResponse>>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    if (!response.data) {
      throw new Error('Invalid response from server');
    }

    // Backend returns tokens in a nested object: data.tokens.accessToken
    this.setToken(response.data.tokens.accessToken);
    localStorage.setItem('mcx_refresh_token', response.data.tokens.refreshToken);

    // Return flattened structure for compatibility with rest of app
    return {
      user: response.data.user,
      accessToken: response.data.tokens.accessToken,
      refreshToken: response.data.tokens.refreshToken,
    };
  }

  async register(data: { email: string; password: string; name: string; role: string; phone?: string }) {
    const response = await this.request<ApiResponse<AuthRegisterResponse>>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });

    if (!response.data) {
      throw new Error('Invalid response from server');
    }

    // Backend returns tokens in a nested object: data.tokens.accessToken
    this.setToken(response.data.tokens.accessToken);
    localStorage.setItem('mcx_refresh_token', response.data.tokens.refreshToken);

    // Return flattened structure for compatibility with rest of app
    return {
      user: response.data.user,
      accessToken: response.data.tokens.accessToken,
      refreshToken: response.data.tokens.refreshToken,
    };
  }

  async logout() {
    try {
      await this.request('/auth/logout', { method: 'POST' });
    } finally {
      this.setToken(null);
      localStorage.removeItem('mcx_refresh_token');
    }
  }

  async getCurrentUser() {
    const response = await this.request<{ success: boolean; data: any }>('/auth/me');
    return { user: response.data };
  }

  // Identity Verification
  async createVerificationSession() {
    return this.request<{
      success: boolean;
      data: { sessionId: string; url: string };
    }>('/identity/create-session', { method: 'POST' });
  }

  async getIdentityStatus() {
    return this.request<{
      success: boolean;
      data: {
        identityVerified: boolean;
        identityVerificationStatus: string | null;
        identityVerifiedAt: string | null;
      };
    }>('/identity/status');
  }

  // User Profile
  async getProfile() {
    return this.request<{
      success: boolean;
      data: {
        id: string;
        name: string;
        email: string;
        phone?: string;
        companyName?: string;
        companyAddress?: string;
        city?: string;
        state?: string;
        zipCode?: string;
        ein?: string;
        avatar?: string;
        role: string;
        verified: boolean;
        createdAt: string;
      };
    }>('/users/me');
  }

  async updateProfile(data: {
    name?: string;
    phone?: string;
    companyName?: string;
    companyAddress?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    ein?: string;
    mcNumber?: string;
    dotNumber?: string;
  }) {
    return this.request<{
      success: boolean;
      data: any;
      message: string;
    }>('/users/me', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async changePassword(currentPassword: string, newPassword: string) {
    return this.request<{
      success: boolean;
      message: string;
    }>('/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({ currentPassword, newPassword }),
    });
  }

  // Password reset
  async forgotPassword(email: string) {
    return this.request<{ success: boolean; message: string }>('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  async resetPassword(token: string, newPassword: string) {
    return this.request<{ success: boolean; message: string }>('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, newPassword }),
    });
  }

  // Email verification
  async verifyEmail(token: string) {
    return this.request<{ success: boolean; message: string }>('/auth/verify-email', {
      method: 'POST',
      body: JSON.stringify({ token }),
    });
  }

  async resendVerificationEmail() {
    return this.request<{ success: boolean; message: string }>('/auth/resend-verification', {
      method: 'POST',
    });
  }

  async refreshToken() {
    // Prevent concurrent refresh calls - reuse in-flight promise
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    const refreshToken = localStorage.getItem('mcx_refresh_token');
    if (!refreshToken) {
      throw new Error('No refresh token');
    }

    this.refreshPromise = this.request<{
      success: boolean;
      data: {
        accessToken: string;
        refreshToken: string;
      };
    }>('/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
    }).then((response) => {
      this.setToken(response.data.accessToken);
      localStorage.setItem('mcx_refresh_token', response.data.refreshToken);
      return response.data;
    }).finally(() => {
      this.refreshPromise = null;
    });

    return this.refreshPromise;
  }

  // Admin endpoints
  async getAdminDashboard() {
    return this.request<any>('/admin/dashboard');
  }

  async getAdminUsers(params?: {
    page?: number;
    limit?: number;
    search?: string;
    role?: string;
    status?: string;
    subscriptionStatus?: string;
  }) {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set('page', params.page.toString());
    if (params?.limit) searchParams.set('limit', params.limit.toString());
    if (params?.search) searchParams.set('search', params.search);
    if (params?.role) searchParams.set('role', params.role);
    if (params?.status) searchParams.set('status', params.status);
    if (params?.subscriptionStatus) searchParams.set('subscriptionStatus', params.subscriptionStatus);

    const query = searchParams.toString();
    const response = await this.request<{
      success: boolean;
      data: any[];
      pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
      };
    }>(`/admin/users${query ? `?${query}` : ''}`);

    // Transform response to match frontend expectations
    return {
      users: response.data || [],
      pagination: response.pagination || { page: 1, limit: 20, total: 0, totalPages: 0 }
    };
  }

  async getAdminUserDetails(userId: string) {
    return this.request<any>(`/admin/users/${userId}`);
  }

  async blockUser(userId: string, reason: string) {
    return this.request<any>(`/admin/users/${userId}/block`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  }

  async unblockUser(userId: string) {
    return this.request<any>(`/admin/users/${userId}/unblock`, {
      method: 'POST',
    });
  }

  async verifySeller(userId: string) {
    return this.request<any>(`/admin/users/${userId}/verify-seller`, {
      method: 'POST',
    });
  }

  async cancelUserSubscription(userId: string) {
    return this.request<ApiResponse<{ message: string; subscription: any }>>(`/admin/users/${userId}/cancel-subscription`, {
      method: 'POST',
    });
  }

  async adminResetUserPassword(userId: string, newPassword: string) {
    return this.request<ApiResponse<{ message: string }>>(`/admin/users/${userId}/reset-password`, {
      method: 'POST',
      body: JSON.stringify({ newPassword }),
    });
  }

  async deleteUser(userId: string) {
    return this.request<ApiResponse<{ message: string }>>(`/admin/users/${userId}`, {
      method: 'DELETE',
    });
  }

  // ============================================
  // Buyer Preferences (admin view)
  // ============================================

  async getAdminUserPreferences(userId: string) {
    return this.request<ApiResponse<BuyerPreferencesData | null>>(`/admin/users/${userId}/preferences`);
  }

  async updateAdminUserPreferences(userId: string, data: Partial<BuyerPreferencesData>) {
    return this.request<ApiResponse<BuyerPreferencesData>>(`/admin/users/${userId}/preferences`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async getAdminUserMatches(userId: string, limit = 10) {
    return this.request<ApiResponse<{
      hasPreferences: boolean;
      matches: Array<{
        listing: any;
        matchScore: number;
        matchReasons: string[];
      }>;
    }>>(`/admin/users/${userId}/matches?limit=${limit}`);
  }

  // ============================================
  // Buyer Preferences (buyer-facing)
  // ============================================

  async getMyPreferences() {
    return this.request<ApiResponse<BuyerPreferencesData | null>>(`/buyer/preferences`);
  }

  async updateMyPreferences(data: Partial<BuyerPreferencesData>) {
    return this.request<ApiResponse<BuyerPreferencesData>>(`/buyer/preferences`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async getMyMatches(limit = 10) {
    return this.request<ApiResponse<{
      hasPreferences: boolean;
      matches: Array<{
        listing: any;
        matchScore: number;
        matchReasons: string[];
      }>;
    }>>(`/buyer/matches?limit=${limit}`);
  }

  async getSubscriptionAnalytics() {
    return this.request<ApiResponse<{
      byPlan: Array<{
        plan: string;
        interval: 'monthly' | 'yearly' | 'unknown';
        status: string;
        count: number;
        mrr: number;
      }>;
      totals: Record<string, number>;
      totalSubscriptions: number;
      mrrCents: number;
      mrrDollars: number;
      unmappedPriceIds: Array<{
        priceId: string;
        count: number;
        productName: string | null;
        nickname: string | null;
        unitAmount: number | null;
        currency: string | null;
        interval: string | null;
      }>;
    }>>(`/admin/analytics/subscriptions`);
  }

  async adjustUserCredits(userId: string, amount: number, reason: string) {
    return this.request<{
      userId: string;
      previousTotal: number;
      adjustment: number;
      newTotal: number;
      usedCredits: number;
      availableCredits: number;
    }>(`/admin/users/${userId}/credits`, {
      method: 'POST',
      body: JSON.stringify({ amount, reason }),
    });
  }

  async getUserListingsForDeposit(userId: string) {
    return this.request<{
      success: boolean;
      data: Array<{
        transactionId: string;
        listingId: string;
        depositAmount: number;
        agreedPrice: number;
        status: string;
        createdAt: string;
        mc: {
          mcNumber: string;
          dotNumber: string;
          legalName: string;
          title: string;
          askingPrice: number;
          location: string;
        } | null;
      }>;
    }>(`/admin/users/${userId}/listings-for-deposit`);
  }

  async recordManualDeposit(
    userId: string,
    payload: {
      amount: number;
      paymentMethod: 'ZELLE' | 'WIRE' | 'CHECK' | 'STRIPE';
      transactionId?: string;
      reference?: string;
      notes?: string;
    }
  ) {
    return this.request<{
      success: boolean;
      data: {
        mode: 'linked' | 'standalone';
        paymentId: string;
        transactionId: string | null;
        listingId: string | null;
        amount: number;
        paymentMethod: string;
        reference: string | null;
        notes: string | null;
      };
      message: string;
    }>(`/admin/users/${userId}/manual-deposit`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async getUserActivityLog(userId: string) {
    return this.request<{
      success: boolean;
      data: {
        userId: string;
        userName: string;
        userEmail: string;
        totalCredits: number;
        usedCredits: number;
        availableCredits: number;
        unlockedMCs: Array<{
          id: string;
          listingId: string;
          mcNumber: string;
          title: string;
          legalName: string;
          location: string;
          askingPrice: number;
          status: string;
          creditsUsed: number;
          unlockedAt: string;
          viewCount: number;
        }>;
        creditTransactions: Array<{
          id: string;
          type: string;
          amount: number;
          balance: number;
          description: string;
          mcNumber: string | null;
          listingTitle: string | null;
          createdAt: string;
        }>;
      };
    }>(`/admin/users/${userId}/activity-log`);
  }

  async getActivityLog(params?: {
    type?: string;
    userId?: string;
    mcNumber?: string;
    actionType?: string;
    dateFrom?: string;
    dateTo?: string;
    page?: number;
    limit?: number;
  }) {
    const searchParams = new URLSearchParams();
    if (params?.type) searchParams.set('type', params.type);
    if (params?.userId) searchParams.set('userId', params.userId);
    if (params?.mcNumber) searchParams.set('mcNumber', params.mcNumber);
    if (params?.actionType) searchParams.set('actionType', params.actionType);
    if (params?.dateFrom) searchParams.set('dateFrom', params.dateFrom);
    if (params?.dateTo) searchParams.set('dateTo', params.dateTo);
    if (params?.page) searchParams.set('page', params.page.toString());
    if (params?.limit) searchParams.set('limit', params.limit.toString());
    const query = searchParams.toString();
    return this.request<any>(`/admin/activity-log${query ? `?${query}` : ''}`);
  }

  async getAdminPendingListings(params?: { page?: number; limit?: number }) {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set('page', params.page.toString());
    if (params?.limit) searchParams.set('limit', params.limit.toString());
    const query = searchParams.toString();
    return this.request<any>(`/admin/listings/pending${query ? `?${query}` : ''}`);
  }

  async getAdminListings(params?: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    isPremium?: boolean;
  }) {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set('page', params.page.toString());
    if (params?.limit) searchParams.set('limit', params.limit.toString());
    if (params?.search) searchParams.set('search', params.search);
    if (params?.status) searchParams.set('status', params.status);
    if (params?.isPremium !== undefined) searchParams.set('isPremium', params.isPremium.toString());

    const query = searchParams.toString();
    return this.request<any>(`/admin/listings${query ? `?${query}` : ''}`);
  }

  async approveListing(listingId: string, data?: { notes?: string; listingPrice?: number; freeToUnlock?: boolean }) {
    return this.request<any>(`/admin/listings/${listingId}/approve`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async rejectListing(listingId: string, reason: string) {
    return this.request<any>(`/admin/listings/${listingId}/reject`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  }

  async getAdminListing(listingId: string) {
    return this.request<any>(`/admin/listings/${listingId}`);
  }

  async updateAdminListing(listingId: string, data: {
    sellerId?: string;
    mcNumber?: string;
    dotNumber?: string;
    legalName?: string;
    dbaName?: string;
    title?: string;
    description?: string;
    askingPrice?: number;
    city?: string;
    state?: string;
    address?: string;
    contactEmail?: string;
    contactPhone?: string;
    yearsActive?: number;
    fleetSize?: number;
    totalDrivers?: number;
    safetyRating?: string;
    saferScore?: string;
    insuranceOnFile?: boolean;
    bipdCoverage?: number;
    cargoCoverage?: number;
    bondAmount?: number;
    insuranceCompany?: string;
    monthlyInsurancePremium?: number;
    amazonStatus?: string;
    amazonRelayScore?: string;
    highwaySetup?: boolean;
    sellingWithEmail?: boolean;
    sellingWithPhone?: boolean;
    cargoTypes?: string[];
    authorityType?: string;
    fmcsaData?: string;
    authorityHistory?: string;
    insuranceHistory?: string;
    reviewNotes?: string;
    status?: string;
    visibility?: string;
    isPremium?: boolean;
    isVip?: boolean;
  }) {
    return this.request<any>(`/admin/listings/${listingId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // Admin Create User
  async createAdminUser(data: {
    email: string;
    name: string;
    password: string;
    role: 'BUYER' | 'SELLER' | 'ADMIN';
    phone?: string;
    companyName?: string;
    createStripeAccount?: boolean;
  }) {
    return this.request<{
      success: boolean;
      data: {
        user: any;
        stripeAccount?: {
          accountId: string;
          onboardingUrl: string;
        };
      };
      message: string;
    }>('/admin/users', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Admin Update User Role
  async updateUser(userId: string, updates: { name?: string; email?: string; phone?: string; companyName?: string }) {
    return this.request<any>(`/admin/users/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async updateUserRole(userId: string, role: string) {
    return this.request<any>(`/admin/users/${userId}/role`, {
      method: 'PUT',
      body: JSON.stringify({ role }),
    });
  }

  // Admin Create Listing
  async createAdminListing(data: {
    sellerId: string;
    mcNumber: string;
    dotNumber?: string;
    legalName?: string;
    dbaName?: string;
    title: string;
    description?: string;
    askingPrice: number;
    city?: string;
    state?: string;
    address?: string;
    contactEmail?: string;
    contactPhone?: string;
    yearsActive?: number;
    fleetSize?: number;
    totalDrivers?: number;
    safetyRating?: string;
    insuranceOnFile?: boolean;
    bipdCoverage?: number;
    cargoCoverage?: number;
    bondAmount?: number;
    insuranceCompany?: string;
    monthlyInsurancePremium?: number;
    amazonStatus?: string;
    amazonRelayScore?: string;
    highwaySetup?: boolean;
    sellingWithEmail?: boolean;
    sellingWithPhone?: boolean;
    cargoTypes?: string[];
    authorityType?: string;
    isPremium?: boolean;
    isVip?: boolean;
    visibility?: string;
    hasFactoring?: string;
    factoringCompany?: string;
    entryAuditCompleted?: string;
    status?: string;
    adminNotes?: string;
    fmcsaData?: string;
    authorityHistory?: string;
    insuranceHistory?: string;
  }) {
    return this.request<{
      success: boolean;
      data: any;
      message: string;
    }>('/admin/listings', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Admin Create User with Listing
  async createAdminUserWithListing(data: {
    user: {
      email: string;
      name: string;
      password: string;
      phone?: string;
      companyName?: string;
    };
    listing: {
      mcNumber: string;
      dotNumber?: string;
      legalName?: string;
      dbaName?: string;
      title: string;
      description?: string;
      askingPrice: number;
      city?: string;
      state?: string;
      address?: string;
      yearsActive?: number;
      fleetSize?: number;
      totalDrivers?: number;
      safetyRating?: string;
      insuranceOnFile?: boolean;
      amazonStatus?: string;
      amazonRelayScore?: string;
      highwaySetup?: boolean;
      sellingWithEmail?: boolean;
      sellingWithPhone?: boolean;
      status?: string;
    };
    createStripeAccount?: boolean;
  }) {
    return this.request<{
      success: boolean;
      data: {
        user: any;
        listing: any;
        stripeAccount?: {
          accountId: string;
          onboardingUrl: string;
        };
      };
      message: string;
    }>('/admin/users/with-listing', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Listings endpoints
  async getListings(params?: {
    page?: number;
    limit?: number;
    search?: string;
    minPrice?: number;
    maxPrice?: number;
    state?: string;
    amazonStatus?: string;
    authorityType?: string;
    sort?: string;
    status?: string;
  }) {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set('page', params.page.toString());
    if (params?.limit) searchParams.set('limit', params.limit.toString());
    if (params?.search) searchParams.set('search', params.search);
    if (params?.minPrice) searchParams.set('minPrice', params.minPrice.toString());
    if (params?.maxPrice) searchParams.set('maxPrice', params.maxPrice.toString());
    if (params?.state) searchParams.set('state', params.state);
    if (params?.amazonStatus) searchParams.set('amazonStatus', params.amazonStatus);
    if (params?.authorityType) searchParams.set('authorityType', params.authorityType);
    if (params?.sort) searchParams.set('sort', params.sort);
    if (params?.status) searchParams.set('status', params.status);

    const query = searchParams.toString();
    return this.request<any>(`/listings${query ? `?${query}` : ''}`);
  }

  async getVipListings(params?: {
    page?: number;
    limit?: number;
    search?: string;
    minPrice?: number;
    maxPrice?: number;
    state?: string;
    amazonStatus?: string;
    sort?: string;
  }) {
    const searchParams = new URLSearchParams();
    searchParams.set('vip', 'true');
    if (params?.page) searchParams.set('page', params.page.toString());
    if (params?.limit) searchParams.set('limit', params.limit.toString());
    if (params?.search) searchParams.set('search', params.search);
    if (params?.minPrice) searchParams.set('minPrice', params.minPrice.toString());
    if (params?.maxPrice) searchParams.set('maxPrice', params.maxPrice.toString());
    if (params?.state) searchParams.set('state', params.state);
    if (params?.amazonStatus) searchParams.set('amazonStatus', params.amazonStatus);
    if (params?.sort) searchParams.set('sort', params.sort);

    const query = searchParams.toString();
    return this.request<any>(`/listings/vip${query ? `?${query}` : ''}`);
  }

  async getListing(id: string) {
    return this.request<any>(`/listings/${id}`);
  }

  // MorPro Carrier Data endpoint
  async getCarrierReport(dotNumber: string) {
    return this.request<{ success: boolean; data: any }>(`/carrier-data/report/${dotNumber}`);
  }

  // FMCSA endpoints
  async fmcsaLookupByMC(mcNumber: string) {
    return this.request<{
      success: boolean;
      data: FMCSACarrierData;
    }>(`/fmcsa/mc/${mcNumber}`);
  }

  async fmcsaLookupByDOT(dotNumber: string) {
    return this.request<{
      success: boolean;
      data: FMCSACarrierData;
    }>(`/fmcsa/dot/${dotNumber}`);
  }

  async fmcsaGetSnapshot(identifier: string, type: 'MC' | 'DOT' = 'MC') {
    return this.request<{
      success: boolean;
      data: {
        carrier: FMCSACarrierData | null;
        authority: FMCSAAuthorityHistory | null;
        insurance: FMCSAInsuranceHistory[] | null;
      };
    }>(`/fmcsa/snapshot/${identifier}?type=${type}`);
  }

  async fmcsaGetAuthorityHistory(dotNumber: string) {
    return this.request<{
      success: boolean;
      data: FMCSAAuthorityHistory;
    }>(`/fmcsa/authority/${dotNumber}`);
  }

  async fmcsaGetInsuranceHistory(dotNumber: string) {
    return this.request<{
      success: boolean;
      data: FMCSAInsuranceHistory[];
    }>(`/fmcsa/insurance/${dotNumber}`);
  }

  async fmcsaGetSMSData(dotNumber: string) {
    return this.request<{
      success: boolean;
      data: FMCSASMSData;
    }>(`/fmcsa/sms/${dotNumber}`);
  }

  async fmcsaGetCargoCarried(dotNumber: string) {
    return this.request<{
      success: boolean;
      data: string[];
    }>(`/fmcsa/cargo-carried/${dotNumber}`);
  }

  // Health check
  async healthCheck() {
    return this.request<{ status: string; timestamp: string }>('/health');
  }

  // Generic GET request
  async get<T = any>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint);
  }

  // Generic POST request
  async post<T = any>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  // Generic PUT request
  async put<T = any>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  // Generic DELETE request
  async delete<T = any>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'DELETE',
    });
  }

  // Messaging endpoints
  async getMessageConversations() {
    return this.request<{
      success: boolean;
      data: Array<{
        id: string;
        participantId: string;
        participantName: string;
        participantAvatar: string | null;
        lastMessage: string;
        lastMessageAt: string;
        unreadCount: number;
        listingId?: string;
      }>;
    }>('/messages/conversations');
  }

  async getMessageConversation(partnerId: string, params?: { page?: number; limit?: number }) {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set('page', params.page.toString());
    if (params?.limit) searchParams.set('limit', params.limit.toString());
    const query = searchParams.toString();

    return this.request<{
      success: boolean;
      data: any[];
      pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
      };
    }>(`/messages/conversations/${partnerId}${query ? `?${query}` : ''}`);
  }

  async markConversationAsRead(partnerId: string) {
    return this.request<{ success: boolean; message: string }>(`/messages/conversations/${partnerId}/read`, {
      method: 'PUT',
    });
  }

  async sendMessage(receiverId: string, content: string, listingId?: string) {
    return this.request<{
      success: boolean;
      data: any;
      message: string;
    }>('/messages', {
      method: 'POST',
      body: JSON.stringify({ receiverId, content, listingId }),
    });
  }

  async getUnreadMessageCount() {
    return this.request<{ success: boolean; data: { count: number } }>('/messages/unread-count');
  }

  async getNavBadgeCounts() {
    return this.request<{ success: boolean; data: { unreadMessages: number; newTransactions: number; activeClosings: number; paidConsultations: number; pendingAdminOffers: number } }>('/notifications/nav-counts');
  }

  async addBonusCredits(userId: string, amount: number, reason: string) {
    return this.request<{
      success: boolean;
      data: any;
      message: string;
    }>('/credits/bonus', {
      method: 'POST',
      body: JSON.stringify({ userId, amount, reason }),
    });
  }

  async sendInquiryToAdmin(listingId: string | undefined, content: string, contactPhone?: string) {
    return this.request<{
      success: boolean;
      data: any;
      message: string;
    }>('/messages/inquiries', {
      method: 'POST',
      body: JSON.stringify({ listingId, content, contactPhone }),
    });
  }

  // Premium request - creates a tracked request for premium listing access
  async createPremiumRequest(listingId: string, message?: string) {
    return this.request<{
      success: boolean;
      data: any;
      message: string;
    }>('/buyer/premium-requests', {
      method: 'POST',
      body: JSON.stringify({ listingId, message }),
    });
  }

  // Get buyer's premium requests
  async getBuyerPremiumRequests() {
    return this.request<{
      success: boolean;
      data: any[];
    }>('/buyer/premium-requests');
  }

  // Terms of Service endpoints
  async getTermsStatus(termsVersion?: string) {
    const query = termsVersion ? `?version=${termsVersion}` : '';
    return this.request<{
      success: boolean;
      data: {
        hasAccepted: boolean;
        acceptedAt: string | null;
        signatureName: string | null;
        termsVersion: string;
      };
    }>(`/buyer/terms-status${query}`);
  }

  async acceptTerms(signatureName: string, termsVersion?: string) {
    return this.request<{
      success: boolean;
      data: {
        hasAccepted: boolean;
        acceptedAt: string;
        signatureName: string;
      };
      message: string;
    }>('/buyer/accept-terms', {
      method: 'POST',
      body: JSON.stringify({ signatureName, termsVersion }),
    });
  }

  // Buyer subscription endpoints
  async getSubscription() {
    return this.request<ApiResponse<SubscriptionResponse>>('/buyer/subscription');
  }

  async createSubscriptionCheckout(plan: string, isYearly: boolean) {
    return this.request<ApiResponse<CheckoutSessionResponse>>('/buyer/subscription/checkout', {
      method: 'POST',
      body: JSON.stringify({ plan, isYearly }),
    });
  }

  async cancelSubscription() {
    return this.request<ApiResponse<{ message: string; subscription: SubscriptionResponse['subscription'] }>>('/buyer/subscription/cancel', {
      method: 'POST',
    });
  }

  async getCarrierPulseAccess() {
    return this.request<ApiResponse<{ hasAccess: boolean; reason: string; currentPlan: string | null; isActive: boolean }>>('/buyer/carrier-pulse/access');
  }

  async createCarrierPulseCheckout() {
    return this.request<ApiResponse<CheckoutSessionResponse>>('/buyer/carrier-pulse/checkout', {
      method: 'POST',
    });
  }

  async getInsuranceLeads(params: {
    insuranceStatus?: 'pending' | 'expiring';
    expiringWithinDays?: number;
    state?: string;
    minUnits?: number;
    maxUnits?: number;
    minSafety?: string;
    sort?: string;
    page?: number;
    limit?: number;
  }) {
    const sp = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') sp.set(k, String(v));
    });
    return this.request<ApiResponse<{
      total: number;
      page: number;
      limit: number;
      results: Array<{
        dotNumber: string;
        mcNumber: string | null;
        legalName: string;
        state: string | null;
        powerUnits: number | null;
        safetyRating: string | null;
        insuranceStatus: 'pending' | 'expiring';
        insuranceExpiryDate: string | null;
        daysUntilExpiry: number | null;
        pendingReason: string | null;
      }>;
    }>>(`/buyer/insurance-leads?${sp.toString()}`);
  }

  async requestBrokerOutreach(dotNumber: string, body: { mcNumber?: string; carrierName?: string; message?: string }) {
    return this.request<ApiResponse<any>>(`/buyer/insurance-leads/${dotNumber}/request-outreach`, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  async getAdminBrokerOutreach(params?: { status?: string; page?: number; limit?: number }) {
    const sp = new URLSearchParams();
    if (params?.status) sp.set('status', params.status);
    if (params?.page) sp.set('page', String(params.page));
    if (params?.limit) sp.set('limit', String(params.limit));
    return this.request<{ success: boolean; data: any[]; pagination: any }>(
      `/admin/broker-outreach?${sp.toString()}`
    );
  }

  async updateAdminBrokerOutreach(id: string, body: { status?: string; notes?: string }) {
    return this.request<ApiResponse<any>>(`/admin/broker-outreach/${id}`, {
      method: 'PUT',
      body: JSON.stringify(body),
    });
  }

  async verifySubscription() {
    return this.request<ApiResponse<{
      fulfilled: boolean;
      message: string;
      subscription?: SubscriptionResponse;
    }>>('/buyer/subscription/verify', {
      method: 'POST',
    });
  }

  // Seller endpoints
  async getSellerDashboard() {
    return this.request<any>('/seller/dashboard');
  }

  async getSellerListings(params?: {
    page?: number;
    limit?: number;
    status?: string;
  }) {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set('page', params.page.toString());
    if (params?.limit) searchParams.set('limit', params.limit.toString());
    if (params?.status) searchParams.set('status', params.status);

    const query = searchParams.toString();
    return this.request<{
      success: boolean;
      data: any[];
      pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
      };
    }>(`/seller/listings${query ? `?${query}` : ''}`);
  }

  async getSellerListing(listingId: string) {
    return this.request<{
      success: boolean;
      data: any;
    }>(`/listings/${listingId}`);
  }

  async updateListing(listingId: string, data: {
    title?: string;
    description?: string;
    askingPrice?: number;
    city?: string;
    state?: string;
    yearsActive?: number;
    fleetSize?: number;
    totalDrivers?: number;
    safetyRating?: string;
    insuranceOnFile?: boolean;
    bipdCoverage?: number;
    cargoCoverage?: number;
    bondAmount?: number;
    insuranceCompany?: string;
    monthlyInsurancePremium?: number;
    amazonStatus?: string;
    amazonRelayScore?: string;
    highwaySetup?: boolean;
    sellingWithEmail?: boolean;
    sellingWithPhone?: boolean;
    rmisSetup?: boolean;
    setupWithBrokers?: boolean;
    cargoTypes?: string[];
    authorityType?: string;
    visibility?: string;
  }) {
    return this.request<{
      success: boolean;
      data: any;
      message: string;
    }>(`/listings/${listingId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteListing(listingId: string) {
    return this.request<{
      success: boolean;
      message: string;
    }>(`/listings/${listingId}`, {
      method: 'DELETE',
    });
  }

  async getSellerOffers(params?: {
    page?: number;
    limit?: number;
    status?: string;
  }) {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set('page', params.page.toString());
    if (params?.limit) searchParams.set('limit', params.limit.toString());
    if (params?.status) searchParams.set('status', params.status);

    const query = searchParams.toString();
    return this.request<any>(`/seller/offers${query ? `?${query}` : ''}`);
  }

  // Listing fee checkout
  async createListingFeeCheckout(mcNumber: string, successUrl: string, cancelUrl: string) {
    return this.request<{
      success: boolean;
      data: {
        sessionId: string;
        url: string;
      };
    }>('/seller/listing-fee/checkout', {
      method: 'POST',
      body: JSON.stringify({ mcNumber, successUrl, cancelUrl }),
    });
  }

  // Create listing
  async createListing(data: {
    mcNumber: string;
    dotNumber: string;
    legalName: string;
    dbaName?: string;
    title: string;
    description?: string;
    askingPrice: number;
    city: string;
    state: string;
    address?: string;
    yearsActive?: number;
    fleetSize?: number;
    totalDrivers?: number;
    safetyRating?: string;
    insuranceOnFile?: boolean;
    bipdCoverage?: number;
    cargoCoverage?: number;
    bondAmount?: number;
    amazonStatus?: string;
    amazonRelayScore?: string;
    authorityType?: string;
    highwaySetup?: boolean;
    sellingWithEmail?: boolean;
    sellingWithPhone?: boolean;
    contactEmail?: string;
    contactPhone?: string;
    cargoTypes?: string[];
    fmcsaData?: string;
    authorityHistory?: string;
    insuranceHistory?: string;
    insuranceCompany?: string;
    monthlyInsurancePremium?: number;
    submitForReview?: boolean;
    trucks?: Array<{
      make: string;
      model: string;
      year?: number | null;
      mileage?: number | null;
      vin?: string | null;
      condition?: 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR' | null;
      description?: string | null;
    }>;
  }) {
    return this.request<{
      success: boolean;
      data: any;
      message: string;
    }>('/listings', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Trucks
  async getListingTrucks(listingId: string) {
    return this.request<{
      success: boolean;
      data: Array<{
        id: string;
        make: string;
        model: string;
        year: number | null;
        mileage: number | null;
        vin: string | null;
        condition: string | null;
        description: string | null;
        photos: Array<{ id: string; url: string }>;
      }>;
    }>(`/listings/${listingId}/trucks`);
  }

  async uploadTruckPhotos(truckId: string, files: File[]) {
    const formData = new FormData();
    files.forEach((f) => formData.append('photos', f));
    const token = this.getToken();
    const res = await fetch(`${API_BASE_URL}/trucks/${truckId}/photos`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      body: formData,
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json?.error || 'Failed to upload photos');
    return json as { success: boolean; data: Array<{ id: string; url: string }> };
  }

  async deleteTruck(truckId: string) {
    return this.request<{ success: boolean }>(`/trucks/${truckId}`, { method: 'DELETE' });
  }

  async deleteTruckPhoto(truckId: string, photoId: string) {
    return this.request<{ success: boolean }>(
      `/trucks/${truckId}/photos/${photoId}`,
      { method: 'DELETE' }
    );
  }

  // Unlock a listing (uses 1 credit)
  async unlockListing(listingId: string) {
    return this.request<{
      success: boolean;
      data: {
        alreadyUnlocked?: boolean;
      };
      message: string;
    }>(`/listings/${listingId}/unlock`, {
      method: 'POST',
    });
  }

  // Get user's unlocked listings
  async getUnlockedListings(params?: { page?: number; limit?: number }) {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set('page', params.page.toString());
    if (params?.limit) searchParams.set('limit', params.limit.toString());

    const query = searchParams.toString();
    return this.request<{
      success: boolean;
      data: any[];
      pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
      };
    }>(`/listings/unlocked${query ? `?${query}` : ''}`);
  }

  // Check if a specific listing is unlocked by the user
  async checkListingUnlocked(listingId: string) {
    try {
      const response = await this.getUnlockedListings({ limit: 1000 });
      const unlockedIds = response.data.map((item: any) => item.id);
      return unlockedIds.includes(listingId);
    } catch {
      return false;
    }
  }

  // Offer endpoints
  async createOffer(data: {
    listingId: string;
    amount: number;
    message?: string;
    isBuyNow?: boolean;
  }) {
    return this.request<{
      success: boolean;
      data: any;
      message: string;
    }>('/offers', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getBuyerOffers(params?: { status?: string }) {
    const searchParams = new URLSearchParams();
    if (params?.status) searchParams.set('status', params.status);
    const query = searchParams.toString();
    return this.request<{
      success: boolean;
      data: any[];
    }>(`/offers/my-offers${query ? `?${query}` : ''}`);
  }

  // Admin offer endpoints
  async getAdminOffers(params?: {
    page?: number;
    limit?: number;
    status?: string;
  }) {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set('page', params.page.toString());
    if (params?.limit) searchParams.set('limit', params.limit.toString());
    if (params?.status) searchParams.set('status', params.status);
    const query = searchParams.toString();
    return this.request<{
      success: boolean;
      data: any[];
      pagination?: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
      };
    }>(`/admin/offers${query ? `?${query}` : ''}`);
  }

  async approveOffer(offerId: string, notes?: string) {
    return this.request<{
      success: boolean;
      data: any;
      message: string;
    }>(`/admin/offers/${offerId}/approve`, {
      method: 'POST',
      body: JSON.stringify({ notes }),
    });
  }

  async forwardOfferToSeller(offerId: string, sellerAmount: number, notes?: string) {
    return this.request<{
      success: boolean;
      data: any;
      message: string;
    }>(`/admin/offers/${offerId}/forward`, {
      method: 'POST',
      body: JSON.stringify({ sellerAmount, notes }),
    });
  }

  async rejectOffer(offerId: string, reason: string) {
    return this.request<{
      success: boolean;
      data: any;
      message: string;
    }>(`/admin/offers/${offerId}/reject`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  }

  async deleteOffer(offerId: string) {
    return this.request<{
      success: boolean;
      message: string;
    }>(`/admin/offers/${offerId}`, {
      method: 'DELETE',
    });
  }

  async adminAcceptOfferOnBehalf(offerId: string, notes?: string) {
    return this.request<{
      success: boolean;
      data: any;
      message: string;
    }>(`/admin/offers/${offerId}/accept-on-behalf`, {
      method: 'POST',
      body: JSON.stringify({ notes }),
    });
  }

  async adminRejectOfferOnBehalf(offerId: string, reason?: string) {
    return this.request<{
      success: boolean;
      data: any;
      message: string;
    }>(`/admin/offers/${offerId}/reject-on-behalf`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  }

  // Buyer offer actions
  async withdrawOffer(offerId: string) {
    return this.request<{
      success: boolean;
      data: any;
      message: string;
    }>(`/offers/${offerId}/withdraw`, {
      method: 'POST',
    });
  }

  async acceptCounterOffer(offerId: string) {
    return this.request<{
      success: boolean;
      data: any;
      message: string;
    }>(`/offers/${offerId}/accept-counter`, {
      method: 'POST',
    });
  }

  // Get single offer by ID
  async getOffer(offerId: string) {
    return this.request<{
      success: boolean;
      data: any;
    }>(`/offers/${offerId}`);
  }

  // Deposit payment for an offer/transaction
  async createDepositCheckout(offerId: string) {
    return this.request<{
      success: boolean;
      data: {
        sessionId: string;
        url: string;
      };
    }>(`/offers/${offerId}/deposit-checkout`, {
      method: 'POST',
    });
  }

  // Get buyer's transactions
  async getBuyerTransactions(params?: { page?: number; limit?: number }) {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set('page', params.page.toString());
    if (params?.limit) searchParams.set('limit', params.limit.toString());

    const query = searchParams.toString();
    return this.request<{
      success: boolean;
      data: any[];
      pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
      };
    }>(`/buyer/transactions${query ? `?${query}` : ''}`);
  }

  // Get current user's transactions (returns transactions based on user role)
  async getMyTransactions(params?: { page?: number; limit?: number }) {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set('page', params.page.toString());
    if (params?.limit) searchParams.set('limit', params.limit.toString());

    const query = searchParams.toString();
    return this.request<{
      success: boolean;
      data: any[];
    }>(`/transactions${query ? `?${query}` : ''}`);
  }

  // Get single transaction by ID
  async getTransaction(transactionId: string) {
    return this.request<{
      success: boolean;
      data: any;
    }>(`/transactions/${transactionId}`);
  }

  // Create deposit checkout for a transaction (Stripe)
  async createTransactionDepositCheckout(transactionId: string, depositAmount?: number) {
    return this.request<{
      success: boolean;
      data: {
        sessionId: string;
        url: string;
      };
    }>(`/transactions/${transactionId}/deposit-checkout`, {
      method: 'POST',
      body: JSON.stringify({ depositAmount }),
    });
  }

  // Create final payment checkout (Stripe Connect split payment)
  async createFinalPaymentCheckout(transactionId: string) {
    return this.request<{
      success: boolean;
      data: {
        sessionId: string;
        url: string;
      };
      message: string;
    }>(`/transactions/${transactionId}/final-payment-checkout`, {
      method: 'POST',
    });
  }

  // Record deposit payment (Zelle/Wire/Check)
  async recordDeposit(transactionId: string, paymentMethod: 'STRIPE' | 'ZELLE' | 'WIRE' | 'CHECK', reference?: string) {
    return this.request<{
      success: boolean;
      data: any;
      message: string;
    }>(`/transactions/${transactionId}/deposit`, {
      method: 'POST',
      body: JSON.stringify({ paymentMethod, reference }),
    });
  }

  // Verify deposit status by checking Stripe directly
  // This is a backup when webhooks don't fire (common in local dev)
  async verifyDepositStatus(transactionId: string) {
    return this.request<{
      success: boolean;
      data: {
        status: string;
        depositPaid: boolean;
        depositPaidAt?: string;
        amount?: number;
      };
      message: string;
    }>(`/transactions/${transactionId}/verify-deposit-status`, {
      method: 'POST',
    });
  }

  // Admin transactions endpoint
  async getAdminTransactions(params?: {
    page?: number;
    limit?: number;
    status?: string;
  }) {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set('page', params.page.toString());
    if (params?.limit) searchParams.set('limit', params.limit.toString());
    if (params?.status) searchParams.set('status', params.status);
    const query = searchParams.toString();
    return this.request<{
      success: boolean;
      data: any[];
      pagination?: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
      };
    }>(`/admin/transactions${query ? `?${query}` : ''}`);
  }

  // ============================================
  // Stripe Transaction History (Admin)
  // ============================================

  // Get all Stripe transactions with full customer/billing details
  async getStripeTransactions(params?: {
    limit?: number;
    status?: 'succeeded' | 'pending' | 'failed';
    type?: 'all' | 'payment_intent' | 'checkout_session' | 'charge';
    startingAfter?: string;
  }) {
    const searchParams = new URLSearchParams();
    if (params?.limit) searchParams.set('limit', params.limit.toString());
    if (params?.status) searchParams.set('status', params.status);
    if (params?.type) searchParams.set('type', params.type);
    if (params?.startingAfter) searchParams.set('startingAfter', params.startingAfter);
    const query = searchParams.toString();
    return this.request<{
      success: boolean;
      data: StripeTransaction[];
      hasMore: boolean;
    }>(`/admin/stripe/transactions${query ? `?${query}` : ''}`);
  }

  // Get Stripe account balance
  async getStripeBalance() {
    return this.request<{
      success: boolean;
      data: {
        available: number;
        pending: number;
        currency: string;
      };
    }>('/admin/stripe/balance');
  }

  // Get Stripe balance transactions (money movement)
  async getStripeBalanceTransactions(params?: {
    limit?: number;
    startingAfter?: string;
  }) {
    const searchParams = new URLSearchParams();
    if (params?.limit) searchParams.set('limit', params.limit.toString());
    if (params?.startingAfter) searchParams.set('startingAfter', params.startingAfter);
    const query = searchParams.toString();
    return this.request<{
      success: boolean;
      data: any[];
      hasMore: boolean;
    }>(`/admin/stripe/balance-transactions${query ? `?${query}` : ''}`);
  }

  // ============================================
  // Admin Invoices (Stripe)
  // ============================================

  async getAdminInvoices(params?: {
    limit?: number;
    startingAfter?: string;
    status?: string;
  }) {
    const searchParams = new URLSearchParams();
    if (params?.limit) searchParams.set('limit', params.limit.toString());
    if (params?.startingAfter) searchParams.set('startingAfter', params.startingAfter);
    if (params?.status) searchParams.set('status', params.status);
    const query = searchParams.toString();
    return this.request<{
      success: boolean;
      data: any[];
      hasMore: boolean;
    }>(`/admin/invoices${query ? `?${query}` : ''}`);
  }

  async getAdminInvoice(invoiceId: string) {
    return this.request<{
      success: boolean;
      data: any;
    }>(`/admin/invoices/${invoiceId}`);
  }

  async createAdminInvoice(data: {
    userId: string;
    lineItems: Array<{ description: string; quantity: number; unitPrice: number }>;
    dueDate?: string;
    notes?: string;
    invoiceType?: string;
    mcNumber?: string;
    paymentMethods?: string[];
    autoSend?: boolean;
  }) {
    return this.request<{
      success: boolean;
      data: {
        invoice: any;
        hostedUrl?: string;
      };
    }>('/admin/invoices', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async sendAdminInvoice(invoiceId: string) {
    return this.request<{
      success: boolean;
      data: any;
    }>(`/admin/invoices/${invoiceId}/send`, {
      method: 'POST',
    });
  }

  async voidAdminInvoice(invoiceId: string) {
    return this.request<{
      success: boolean;
    }>(`/admin/invoices/${invoiceId}/void`, {
      method: 'POST',
    });
  }

  // Buyer approve transaction
  async buyerApproveTransaction(transactionId: string) {
    return this.request<{
      success: boolean;
      data: any;
      message: string;
    }>(`/transactions/${transactionId}/buyer/approve`, {
      method: 'POST',
    });
  }

  // Seller approve transaction
  async sellerApproveTransaction(transactionId: string) {
    return this.request<{
      success: boolean;
      data: any;
      message: string;
    }>(`/transactions/${transactionId}/seller/approve`, {
      method: 'POST',
    });
  }

  // Admin approve transaction (final approval after buyer/seller approve)
  async adminApproveTransaction(transactionId: string) {
    return this.request<{
      success: boolean;
      data: any;
      message: string;
    }>(`/transactions/${transactionId}/admin/approve`, {
      method: 'POST',
    });
  }

  // Admin update transaction status
  async updateTransactionStatus(transactionId: string, status: string, notes?: string) {
    return this.request<{
      success: boolean;
      data: any;
      message: string;
    }>(`/transactions/${transactionId}/admin/status`, {
      method: 'PUT',
      body: JSON.stringify({ status, notes }),
    });
  }

  // Admin verify deposit payment
  async adminVerifyDeposit(transactionId: string, paymentId: string) {
    return this.request<{
      success: boolean;
      message: string;
    }>(`/transactions/${transactionId}/admin/verify-deposit/${paymentId}`, {
      method: 'POST',
    });
  }

  // Admin verify final payment
  async adminVerifyFinalPayment(transactionId: string, paymentId: string) {
    return this.request<{
      success: boolean;
      message: string;
    }>(`/transactions/${transactionId}/admin/verify-payment/${paymentId}`, {
      method: 'POST',
    });
  }

  // Admin confirm payment into escrow
  async adminConfirmEscrow(transactionId: string, amount: number, paymentMethod: 'ZELLE' | 'WIRE' | 'CHECK' | 'STRIPE', notes?: string) {
    return this.request<{
      success: boolean;
      data: {
        escrowStatus: string;
        escrowAmount: number;
        escrowConfirmedAt: string;
        escrowPaymentMethod: string;
      };
      message: string;
    }>(`/transactions/${transactionId}/admin/confirm-escrow`, {
      method: 'POST',
      body: JSON.stringify({ amount, paymentMethod, notes }),
    });
  }

  // Admin check instant payout eligibility for seller
  async checkInstantPayoutEligibility(transactionId: string) {
    return this.request<{
      success: boolean;
      data: {
        eligible: boolean;
        hasDebitCard: boolean;
        reason?: string;
      };
    }>(`/admin/transactions/${transactionId}/instant-payout-eligibility`);
  }

  // Admin release payout to seller (standard or instant)
  async adminReleasePayout(transactionId: string, payoutMethod: 'standard' | 'instant' = 'standard') {
    return this.request<{
      success: boolean;
      data: {
        transferId: string;
        amount: number;
        payoutStatus: string;
        payoutReleasedAt: string;
        payoutMethod: string;
        instantPayoutId?: string;
        instantPayoutFee?: number;
      };
      message: string;
    }>(`/admin/transactions/${transactionId}/release-payout`, {
      method: 'POST',
      body: JSON.stringify({ payoutMethod }),
    });
  }

  // Admin get available buyers for transaction creation
  async getAvailableBuyers(search?: string) {
    const queryParams = search ? `?search=${encodeURIComponent(search)}` : '';
    return this.request<{
      success: boolean;
      data: Array<{
        id: string;
        name: string;
        email: string;
        verified: boolean;
        trustScore: number;
      }>;
    }>(`/transactions/admin/available-buyers${queryParams}`);
  }

  // Admin get available listings for transaction creation
  async getAvailableListings(search?: string) {
    const queryParams = search ? `?search=${encodeURIComponent(search)}` : '';
    return this.request<{
      success: boolean;
      data: Array<{
        id: string;
        mcNumber: string;
        dotNumber: string;
        legalName: string;
        title: string;
        askingPrice: number | null;
        listingPrice: number | null;
        sellerId: string;
        seller: {
          id: string;
          name: string;
          email: string;
        };
      }>;
    }>(`/transactions/admin/available-listings${queryParams}`);
  }

  // Admin create transaction manually
  async adminCreateTransaction(params: {
    listingId: string;
    buyerId: string;
    agreedPrice: number;
    depositAmount?: number;
    notes?: string;
  }) {
    return this.request<{
      success: boolean;
      data: {
        id: string;
        listingId: string;
        buyerId: string;
        sellerId: string;
        agreedPrice: number;
        depositAmount: number;
        status: string;
        listing?: {
          id: string;
          mcNumber: string;
          title: string;
        };
        buyer?: {
          id: string;
          name: string;
          email: string;
        };
        seller?: {
          id: string;
          name: string;
          email: string;
        };
      };
      message: string;
    }>('/transactions/admin/create', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  // Admin delete transaction
  async sendTransactionMessage(transactionId: string, content: string) {
    return this.request<{
      success: boolean;
      data: any;
      message: string;
    }>(`/transactions/${transactionId}/messages`, {
      method: 'POST',
      body: JSON.stringify({ content }),
    });
  }

  async adminSendTransactionEmails(transactionId: string) {
    return this.request<{
      success: boolean;
      data: { buyerEmail: string; buyerSent: boolean; sellerEmail: string; sellerSent: boolean };
      message: string;
    }>(`/transactions/${transactionId}/admin/send-emails`, {
      method: 'POST',
    });
  }

  async adminDeleteTransaction(transactionId: string) {
    return this.request<{
      success: boolean;
      message: string;
    }>(`/transactions/${transactionId}/admin`, {
      method: 'DELETE',
    });
  }

  // Record final payment (buyer submits payment with proof)
  async recordFinalPayment(
    transactionId: string,
    paymentMethod: 'ZELLE' | 'WIRE',
    reference?: string
  ) {
    return this.request<{
      success: boolean;
      data: {
        id: string;
        type: string;
        amount: number;
        method: string;
        status: string;
      };
      message: string;
    }>(`/transactions/${transactionId}/final-payment`, {
      method: 'POST',
      body: JSON.stringify({ paymentMethod, reference }),
    });
  }

  // Get buyer's Stripe payment history
  async getBuyerStripeHistory() {
    return this.request<{
      success: boolean;
      data: {
        charges: Array<{
          id: string;
          amount: number;
          currency: string;
          status: string;
          description: string | null;
          receiptUrl: string | null;
          created: string;
          paymentMethod: { brand: string; last4: string } | null;
          metadata: Record<string, string>;
        }>;
        paymentIntents: Array<{
          id: string;
          amount: number;
          currency: string;
          status: string;
          description: string | null;
          created: string;
          metadata: Record<string, string>;
        }>;
        checkoutSessions: Array<{
          id: string;
          amountTotal: number;
          currency: string | null;
          status: string | null;
          paymentStatus: string;
          mode: string;
          created: string;
          metadata: Record<string, string> | null;
        }>;
        subscriptions: Array<{
          id: string;
          status: string;
          plan: string;
          currentPeriodStart: string;
          currentPeriodEnd: string;
          created: string;
          cancelAtPeriodEnd: boolean;
        }>;
        stripeCustomerId: string;
      };
    }>('/buyer/stripe-history');
  }

  // Get seller earnings (completed transactions)
  async getSellerEarnings(params?: { page?: number; limit?: number }) {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set('page', params.page.toString());
    if (params?.limit) searchParams.set('limit', params.limit.toString());

    const query = searchParams.toString();
    return this.request<{
      success: boolean;
      data: Array<{
        id: string;
        listing: { mcNumber: string; title: string } | null;
        buyer: { name: string } | null;
        agreedPrice: number;
        platformFee: number;
        netEarnings: number;
        completedAt: string;
      }>;
      totals: {
        gross: number;
        fees: number;
        net: number;
      };
      pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
      };
    }>(`/seller/earnings${query ? `?${query}` : ''}`);
  }

  // Get seller's Stripe payment history
  async getSellerStripeHistory() {
    return this.request<{
      success: boolean;
      data: {
        charges: Array<{
          id: string;
          amount: number;
          currency: string;
          status: string;
          description: string | null;
          receiptUrl: string | null;
          created: string;
          paymentMethod: { brand: string; last4: string } | null;
          metadata: Record<string, string>;
        }>;
        checkoutSessions: Array<{
          id: string;
          amountTotal: number;
          currency: string | null;
          status: string | null;
          paymentStatus: string;
          mode: string;
          created: string;
          metadata: Record<string, string> | null;
          type: string;
          mcNumber: string | null;
        }>;
        stripeCustomerId: string;
      };
    }>('/seller/stripe-history');
  }

  // ============================================
  // Seller Stripe Connect - Payout Setup
  // ============================================

  // Get seller's Connect account status
  async getSellerConnectStatus() {
    return this.request<{
      success: boolean;
      data: {
        hasAccount: boolean;
        accountId?: string;
        isOnboarded: boolean;
        chargesEnabled: boolean;
        payoutsEnabled: boolean;
        detailsSubmitted: boolean;
        error?: string;
      };
    }>('/seller/connect/status');
  }

  // Create or continue Stripe Connect onboarding
  async createSellerConnectAccount() {
    return this.request<{
      success: boolean;
      data: {
        accountId: string;
        onboardingUrl: string;
      };
      message: string;
    }>('/seller/connect/create', {
      method: 'POST',
    });
  }

  // Get Stripe Express dashboard link for seller
  async getSellerConnectDashboard() {
    return this.request<{
      success: boolean;
      data: {
        url: string;
      };
    }>('/seller/connect/dashboard');
  }

  // Get seller's uploaded documents
  async getSellerDocuments() {
    return this.request<{
      success: boolean;
      data: Array<{
        id: string;
        type: string;
        name: string;
        url: string;
        size: number;
        mimeType: string;
        status: string;
        createdAt: string;
      }>;
    }>('/seller/documents');
  }

  // Upload seller document (Articles of Incorporation, EIN Letter, etc.)
  async uploadSellerDocument(file: File, type: string) {
    const url = `${API_BASE_URL}/documents`;
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);

    const currentToken = this.token || localStorage.getItem('mcx_token');
    const headers: HeadersInit = {};
    if (currentToken) {
      headers['Authorization'] = `Bearer ${currentToken}`;
    }

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: formData,
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || data.message || 'Failed to upload document');
    }

    return data as { success: boolean; data: any; message: string };
  }

  // Upload proof of payment for final payment
  async uploadPaymentProof(transactionId: string, formData: FormData) {
    const url = `${API_BASE_URL}/documents`;

    // Add transactionId to formData
    formData.append('transactionId', transactionId);
    formData.append('type', 'PAYMENT_PROOF');

    const currentToken = this.token || localStorage.getItem('mcx_token');
    const headers: HeadersInit = {};

    if (currentToken) {
      headers['Authorization'] = `Bearer ${currentToken}`;
    }

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || data.message || 'Failed to upload payment proof');
    }

    return data as {
      success: boolean;
      data: any;
      message: string;
    };
  }

  // ============================================
  // Creditsafe API Endpoints (Admin Only)
  // ============================================

  /**
   * Check Creditsafe service health and authentication status
   */
  async creditsafeHealthCheck() {
    return this.request<{
      success: boolean;
      data: {
        configured: boolean;
        authenticated: boolean;
        error?: string;
      };
    }>('/admin/creditsafe/health');
  }

  /**
   * Get Creditsafe subscription access details
   */
  async creditsafeGetAccess() {
    return this.request<{
      success: boolean;
      data: {
        countries?: Array<{
          code: string;
          name: string;
          companyReport?: boolean;
          directorReport?: boolean;
          monitoring?: boolean;
        }>;
      };
    }>('/admin/creditsafe/access');
  }

  /**
   * Search companies in Creditsafe database
   */
  async creditsafeSearchCompanies(params: {
    countries: string;
    name?: string;
    regNo?: string;
    vatNo?: string;
    postCode?: string;
    city?: string;
    state?: string;
    exact?: boolean;
    page?: number;
    pageSize?: number;
  }) {
    const searchParams = new URLSearchParams();
    searchParams.set('countries', params.countries);
    if (params.name) searchParams.set('name', params.name);
    if (params.regNo) searchParams.set('regNo', params.regNo);
    if (params.vatNo) searchParams.set('vatNo', params.vatNo);
    if (params.postCode) searchParams.set('postCode', params.postCode);
    if (params.city) searchParams.set('city', params.city);
    if (params.state) searchParams.set('state', params.state);
    if (params.exact !== undefined) searchParams.set('exact', params.exact.toString());
    if (params.page) searchParams.set('page', params.page.toString());
    if (params.pageSize) searchParams.set('pageSize', params.pageSize.toString());

    return this.request<{
      success: boolean;
      data: {
        companies: Array<{
          id: string;
          connectId?: string;
          name: string;
          regNo?: string;
          vatNo?: string;
          address?: {
            simpleValue?: string;
            street?: string;
            city?: string;
            postCode?: string;
            province?: string;
            country?: string;
          };
          status?: string;
          type?: string;
          safeNumber?: string;
        }>;
        totalResults: number;
      };
    }>(`/admin/creditsafe/companies?${searchParams.toString()}`);
  }

  /**
   * Get full credit report for a company
   */
  async creditsafeGetCreditReport(connectId: string, options?: {
    language?: string;
    includeIndicators?: boolean;
  }) {
    const searchParams = new URLSearchParams();
    if (options?.language) searchParams.set('language', options.language);
    if (options?.includeIndicators) searchParams.set('includeIndicators', 'true');
    const query = searchParams.toString();

    return this.request<{
      success: boolean;
      data: any; // Full credit report object
    }>(`/admin/creditsafe/companies/${encodeURIComponent(connectId)}${query ? `?${query}` : ''}`);
  }

  /**
   * Get company assessment with summary (convenient for display)
   */
  async creditsafeGetAssessment(connectId: string) {
    return this.request<{
      success: boolean;
      data: {
        company: any;
        summary: {
          businessName: string;
          registrationNumber: string | null;
          status: string;
          country: string;
          address: string;
          telephone: string | null;
          website: string | null;
          principalActivity: string | null;
          creditRating: string | null;
          creditRatingDescription: string | null;
          creditLimit: number | null;
          creditLimitCurrency: string | null;
          numberOfEmployees: string | number | null;
          dbt: number | null;
          industryDBT: number | null;
          ccjCount: number;
          ccjTotalAmount: number | null;
          ccjCurrency: string | null;
          directorsCount: number;
          latestFinancialsDate: string | null;
          revenue: number | null;
          profitBeforeTax: number | null;
          totalAssets: number | null;
          totalLiabilities: number | null;
          shareholdersEquity: number | null;
        };
      };
    }>(`/admin/creditsafe/companies/${encodeURIComponent(connectId)}/assessment`);
  }

  /**
   * Quick company lookup
   */
  async creditsafeLookup(params: {
    country: string;
    name?: string;
    regNo?: string;
    state?: string;
    city?: string;
  }) {
    return this.request<{
      success: boolean;
      data: {
        searchResults: Array<{
          id: string;
          connectId?: string;
          name: string;
          regNo?: string;
          address?: {
            simpleValue?: string;
          };
          status?: string;
        }>;
        totalResults: number;
      };
    }>('/admin/creditsafe/lookup', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  // ============================================
  // Buyer Creditsafe Endpoints
  // ============================================

  /**
   * Search Creditsafe for a company based on an unlocked listing
   */
  async buyerCreditsafeSearch(listingId: string) {
    return this.request<{
      success: boolean;
      data: {
        companies: Array<{
          id: string;
          connectId?: string;
          name: string;
          regNo?: string;
          vatNo?: string;
          address?: {
            simpleValue?: string;
            street?: string;
            city?: string;
            postCode?: string;
            province?: string;
            country?: string;
          };
          status?: string;
          type?: string;
          safeNumber?: string;
        }>;
        totalResults: number;
        listing: {
          id: string;
          mcNumber: string;
          dotNumber: string;
          legalName: string;
          state: string;
        };
      };
    }>(`/buyer/creditsafe/search/${listingId}`);
  }

  /**
   * Get full Creditsafe credit report by connectId (requires unlocked listing)
   */
  async buyerCreditsafeReport(connectId: string, listingId?: string) {
    const query = listingId ? `?listingId=${listingId}` : '';
    return this.request<{
      success: boolean;
      data: any;
    }>(`/buyer/creditsafe/companies/${encodeURIComponent(connectId)}${query}`);
  }

  /**
   * VIP-only: Free-form Creditsafe company search (no listing required)
   */
  async buyerCreditsafeFreeSearch(params: { name?: string; state?: string; city?: string; regNo?: string }) {
    const searchParams = new URLSearchParams();
    if (params.name) searchParams.set('name', params.name);
    if (params.state) searchParams.set('state', params.state);
    if (params.city) searchParams.set('city', params.city);
    if (params.regNo) searchParams.set('regNo', params.regNo);
    return this.request<{
      success: boolean;
      data: {
        companies: Array<{
          id: string;
          connectId?: string;
          name: string;
          regNo?: string;
          vatNo?: string;
          address?: {
            simpleValue?: string;
            street?: string;
            city?: string;
            postCode?: string;
            province?: string;
            country?: string;
          };
          status?: string;
          type?: string;
          safeNumber?: string;
        }>;
        totalResults: number;
      };
    }>(`/buyer/creditsafe/search?${searchParams.toString()}`);
  }

  // ===== AI Due Diligence =====

  // Run comprehensive due diligence analysis on an MC number
  async runDueDiligence(mcNumber: string) {
    return this.request<{
      success: boolean;
      data: {
        mcNumber: string;
        dotNumber?: string;
        recommendationScore: number;
        recommendationStatus: 'approved' | 'review' | 'rejected';
        riskLevel: 'low' | 'medium' | 'high' | 'critical';
        summary: string;
        fmcsa: {
          carrier: any;
          authority: any;
          insurance: any[];
          score: number;
          factors: Array<{
            name: string;
            points: number;
            maxPoints: number;
            status: 'pass' | 'fail' | 'warning' | 'na';
            detail?: string;
          }>;
        };
        creditsafe: {
          companyFound: boolean;
          companyName?: string;
          connectId?: string;
          creditScore?: number;
          creditRating?: string;
          creditLimit?: number;
          riskDescription?: string;
          legalFilings: {
            judgments: number;
            taxLiens: number;
            uccFilings: number;
            cautionaryUCC: number;
            bankruptcy: boolean;
            suits: number;
          };
          yearsInBusiness?: string;
          employees?: string;
          score: number;
          factors: Array<{
            name: string;
            points: number;
            maxPoints: number;
            status: 'pass' | 'fail' | 'warning' | 'na';
            detail?: string;
          }>;
          fullReport?: any;
        };
        riskFactors: Array<{
          severity: 'low' | 'medium' | 'high' | 'critical';
          category: 'fmcsa' | 'credit' | 'compliance';
          message: string;
        }>;
        positiveFactors: string[];
        analyzedAt: string;
      };
    }>(`/admin/due-diligence/analyze/${encodeURIComponent(mcNumber)}`);
  }

  // ============================================
  // Pricing Configuration (Admin Only)
  // ============================================

  /**
   * Get pricing configuration (subscription plans, fees, credit packs)
   */
  async getPricingConfig() {
    return this.request<{
      success: boolean;
      data: {
        subscriptionPlans: {
          starter: SubscriptionPlanConfig;
          premium: SubscriptionPlanConfig;
          enterprise: SubscriptionPlanConfig;
          vip_access: SubscriptionPlanConfig;
        };
        platformFees: {
          listingFee: number;
          premiumListingFee: number;
          transactionFeePercentage: number;
          depositPercentage: number;
          minDeposit: number;
          maxDeposit: number;
        };
        creditPacks: CreditPack[];
      };
    }>('/admin/pricing');
  }

  /**
   * Update pricing configuration
   */
  async updatePricingConfig(config: Partial<{
    subscriptionPlans: Partial<{
      starter: Partial<SubscriptionPlanConfig>;
      premium: Partial<SubscriptionPlanConfig>;
      enterprise: Partial<SubscriptionPlanConfig>;
      vip_access: Partial<SubscriptionPlanConfig>;
    }>;
    platformFees: Partial<{
      listingFee: number;
      premiumListingFee: number;
      transactionFeePercentage: number;
      depositPercentage: number;
      minDeposit: number;
      maxDeposit: number;
    }>;
    creditPacks: CreditPack[];
  }>) {
    return this.request<{
      success: boolean;
      data: any;
      message: string;
    }>('/admin/pricing', {
      method: 'PUT',
      body: JSON.stringify(config),
    });
  }

  // ============================================
  // Subscription Plans & Credit Packs (Public)
  // ============================================

  /**
   * Get available subscription plans (public endpoint)
   */
  async getSubscriptionPlans() {
    return this.request<{
      success: boolean;
      data: Array<{
        id: string;
        name: string;
        credits: number;
        priceMonthly: number;
        priceYearly: number;
        pricePerCreditMonthly: number;
        pricePerCreditYearly: number;
        stripePriceIdMonthly: string;
        stripePriceIdYearly: string;
        features: string[];
      }>;
    }>('/credits/plans');
  }

  /**
   * Get available credit packs
   */
  async getCreditPacks() {
    return this.request<{
      success: boolean;
      data: CreditPack[];
    }>('/credits/packs');
  }

  /**
   * Purchase a credit pack (creates Stripe checkout session)
   */
  async purchaseCreditPack(packId: string) {
    return this.request<{
      success: boolean;
      data: {
        checkoutUrl: string;
        packId: string;
        credits: number;
        price: number;
      };
    }>(`/credits/packs/${packId}/checkout`, {
      method: 'POST',
    });
  }

  // Upload a document (handles FormData for file upload)
  // This uses the existing /documents endpoint
  async uploadTransactionDocument(transactionId: string, formData: FormData) {
    const url = `${API_BASE_URL}/documents`;

    // Add transactionId to formData
    formData.append('transactionId', transactionId);

    const currentToken = this.token || localStorage.getItem('mcx_token');
    const headers: HeadersInit = {};

    if (currentToken) {
      headers['Authorization'] = `Bearer ${currentToken}`;
    }

    // Note: Do NOT set Content-Type header for FormData - browser will set it with boundary
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || data.message || 'Failed to upload document');
    }

    return data as {
      success: boolean;
      data: any;
      message: string;
    };
  }

  // Verify a document (admin only)
  async verifyDocument(documentId: string, verified: boolean) {
    return this.request<{ success: boolean; data: any; message: string }>(`/documents/${documentId}/verify`, {
      method: 'PUT',
      body: JSON.stringify({ verified }),
    });
  }

  // Get a pre-signed download/preview URL for a document
  async getDocumentUrl(documentId: string) {
    return this.request<{ success: boolean; data: { url: string } }>(`/documents/${documentId}/url`);
  }

  // Delete a document
  async deleteDocument(documentId: string) {
    return this.request<{ success: boolean; message: string }>(`/documents/${documentId}`, {
      method: 'DELETE',
    });
  }

  // ===========================
  // CREDENTIAL VAULT METHODS
  // ===========================

  async getTransactionCredentials(transactionId: string) {
    return this.request<{ success: boolean; data: any[] }>(`/credentials/transaction/${transactionId}`);
  }

  async createTransactionCredential(data: { transactionId: string; label: string; username?: string; password: string }) {
    return this.request<{ success: boolean; data: any }>('/credentials', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateTransactionCredential(id: string, data: { label?: string; username?: string; password?: string }) {
    return this.request<{ success: boolean; data: any }>(`/credentials/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteTransactionCredential(id: string) {
    return this.request<{ success: boolean; message: string }>(`/credentials/${id}`, {
      method: 'DELETE',
    });
  }

  async releaseCredentials(transactionId: string) {
    return this.request<{ success: boolean; message: string }>(`/credentials/transaction/${transactionId}/release`, {
      method: 'POST',
    });
  }

  async revokeCredentialRelease(transactionId: string) {
    return this.request<{ success: boolean; message: string }>(`/credentials/transaction/${transactionId}/revoke`, {
      method: 'POST',
    });
  }

  // ===========================
  // CONSULTATION METHODS
  // ===========================

  /**
   * Get consultation fee (public - no auth required)
   */
  async getConsultationFee(): Promise<{ fee: number; currency: string; description: string }> {
    const response = await this.request<{
      success: boolean;
      data: { fee: number; currency: string; description: string };
    }>('/consultations/fee');
    return response.data;
  }

  /**
   * Create consultation checkout session (public - no auth required)
   */
  async createConsultationCheckout(data: {
    name: string;
    email: string;
    phone: string;
    preferredDate: string;
    preferredTime: string;
    message?: string;
  }): Promise<{ checkoutUrl: string; consultationId: string }> {
    const response = await this.request<{
      success: boolean;
      checkoutUrl: string;
      consultationId: string;
    }>('/consultations/checkout', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return {
      checkoutUrl: response.checkoutUrl,
      consultationId: response.consultationId,
    };
  }

  /**
   * Get all consultations (admin only)
   */
  async getAdminConsultations(options?: {
    page?: number;
    limit?: number;
    status?: string;
    search?: string;
  }): Promise<{
    consultations: any[];
    pagination: { total: number; pages: number; page: number; limit: number };
  }> {
    const params = new URLSearchParams();
    if (options?.page) params.append('page', options.page.toString());
    if (options?.limit) params.append('limit', options.limit.toString());
    if (options?.status) params.append('status', options.status);
    if (options?.search) params.append('search', options.search);

    const response = await this.request<{
      success: boolean;
      data: any[];
      pagination: { total: number; pages: number; page: number; limit: number };
    }>(`/consultations?${params.toString()}`);

    return {
      consultations: response.data,
      pagination: response.pagination,
    };
  }

  /**
   * Get consultation statistics (admin only)
   */
  async getConsultationStats(): Promise<{
    total: number;
    pending: number;
    paid: number;
    scheduled: number;
    completed: number;
    totalRevenue: number;
  }> {
    const response = await this.request<{
      success: boolean;
      data: {
        total: number;
        pending: number;
        paid: number;
        scheduled: number;
        completed: number;
        totalRevenue: number;
      };
    }>('/consultations/stats');
    return response.data;
  }

  /**
   * Update consultation status (admin only)
   */
  async updateConsultationStatus(
    id: string,
    status: string,
    notes?: string
  ): Promise<any> {
    const response = await this.request<{ success: boolean; data: any }>(
      `/consultations/${id}/status`,
      {
        method: 'PUT',
        body: JSON.stringify({ status, notes }),
      }
    );
    return response.data;
  }

  /**
   * Refund consultation (admin only)
   */
  async refundConsultation(id: string): Promise<any> {
    const response = await this.request<{
      success: boolean;
      data: any;
      message: string;
    }>(`/consultations/${id}/refund`, {
      method: 'POST',
    });
    return response.data;
  }

  // ===========================
  // TELEGRAM METHODS
  // ===========================

  /**
   * Get Telegram configuration (admin only)
   */
  async getTelegramConfig(): Promise<{
    botTokenSet: boolean;
    channelId: string;
    isConfigured: boolean;
  }> {
    const response = await this.request<{
      success: boolean;
      data: { botTokenSet: boolean; channelId: string; isConfigured: boolean };
    }>('/admin/telegram/config');
    return response.data;
  }

  /**
   * Update Telegram configuration (admin only)
   */
  async updateTelegramConfig(config: {
    botToken?: string;
    channelId?: string;
  }): Promise<void> {
    await this.request('/admin/telegram/config', {
      method: 'PUT',
      body: JSON.stringify(config),
    });
  }

  /**
   * Test Telegram connection (admin only)
   */
  async testTelegramConnection(): Promise<{ success: boolean; message: string; botName?: string }> {
    const response = await this.request<{
      success: boolean;
      message: string;
      botName?: string;
    }>('/admin/telegram/test', {
      method: 'POST',
    });
    return response;
  }

  /**
   * Get listings for Telegram sharing (admin only)
   */
  async getTelegramListings(options?: {
    page?: number;
    limit?: number;
    search?: string;
  }): Promise<{
    listings: any[];
    pagination: { total: number; pages: number; page: number; limit: number };
  }> {
    const params = new URLSearchParams();
    if (options?.page) params.append('page', options.page.toString());
    if (options?.limit) params.append('limit', options.limit.toString());
    if (options?.search) params.append('search', options.search);

    const response = await this.request<{
      success: boolean;
      data: any[];
      pagination: { total: number; pages: number; page: number; limit: number };
    }>(`/admin/telegram/listings?${params.toString()}`);

    return {
      listings: response.data,
      pagination: response.pagination,
    };
  }

  /**
   * Share listing to Telegram (admin only)
   */
  async shareListingToTelegram(
    listingId: string,
    customMessage?: string
  ): Promise<{ success: boolean; message: string; messageId?: number }> {
    const response = await this.request<{
      success: boolean;
      message: string;
      messageId?: number;
    }>('/admin/telegram/share-listing', {
      method: 'POST',
      body: JSON.stringify({ listingId, customMessage }),
    });
    return response;
  }

  /**
   * Send custom message to Telegram (admin only)
   */
  async sendTelegramMessage(message: string): Promise<{ success: boolean; message: string }> {
    const response = await this.request<{
      success: boolean;
      message: string;
    }>('/admin/telegram/send', {
      method: 'POST',
      body: JSON.stringify({ message }),
    });
    return response;
  }

  // ===========================
  // Facebook Page Methods
  // ===========================

  /**
   * Get Facebook configuration (admin only)
   */
  async getFacebookConfig(): Promise<{
    pageAccessTokenSet: boolean;
    pageId: string;
    pageName: string;
    isConfigured: boolean;
  }> {
    const response = await this.request<{
      success: boolean;
      data: {
        pageAccessTokenSet: boolean;
        pageId: string;
        pageName: string;
        isConfigured: boolean;
      };
    }>('/admin/facebook/config');
    return response.data;
  }

  /**
   * Update Facebook configuration (admin only)
   */
  async updateFacebookConfig(config: {
    pageAccessToken?: string;
    pageId?: string;
    pageName?: string;
  }): Promise<void> {
    await this.request('/admin/facebook/config', {
      method: 'PUT',
      body: JSON.stringify(config),
    });
  }

  /**
   * Test Facebook connection (admin only)
   */
  async testFacebookConnection(): Promise<{ success: boolean; message: string; pageName?: string; userName?: string }> {
    const response = await this.request<{
      success: boolean;
      message: string;
      pageName?: string;
    }>('/admin/facebook/test', {
      method: 'POST',
    });
    return response;
  }

  /**
   * Get listings for Facebook sharing (admin only)
   */
  async getFacebookListings(options?: {
    page?: number;
    limit?: number;
    search?: string;
  }): Promise<{
    listings: any[];
    pagination: { total: number; pages: number; page: number; limit: number };
  }> {
    const params = new URLSearchParams();
    if (options?.page) params.append('page', options.page.toString());
    if (options?.limit) params.append('limit', options.limit.toString());
    if (options?.search) params.append('search', options.search);

    const response = await this.request<{
      success: boolean;
      data: any[];
      pagination: { total: number; pages: number; page: number; limit: number };
    }>(`/admin/facebook/listings?${params.toString()}`);

    return {
      listings: response.data,
      pagination: response.pagination,
    };
  }

  /**
   * Share listing to Facebook Page (admin only)
   */
  async shareListingToFacebook(
    listingId: string,
    options: {
      customMessage?: string;
    }
  ): Promise<{
    success: boolean;
    message: string;
    postId?: string;
  }> {
    const response = await this.request<{
      success: boolean;
      message: string;
      postId?: string;
    }>('/admin/facebook/share-listing', {
      method: 'POST',
      body: JSON.stringify({
        listingId,
        customMessage: options.customMessage,
      }),
    });
    return response;
  }

  // ===========================
  // ACCOUNT DISPUTE METHODS
  // ===========================

  /**
   * Block user for cardholder name mismatch (admin only)
   */
  async blockUserForMismatch(data: {
    userId: string;
    stripeTransactionId: string;
    cardholderName: string;
    userName: string;
  }): Promise<{
    success: boolean;
    data: {
      user: any;
      dispute: any;
      alreadyExists: boolean;
    };
    message: string;
  }> {
    return this.request('/admin/disputes/block-mismatch', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  /**
   * Get all disputes (admin only)
   */
  async getDisputes(options?: {
    page?: number;
    limit?: number;
    status?: string;
  }): Promise<{
    success: boolean;
    data: any[];
    pagination: { page: number; limit: number; total: number; totalPages: number };
  }> {
    const params = new URLSearchParams();
    if (options?.page) params.append('page', options.page.toString());
    if (options?.limit) params.append('limit', options.limit.toString());
    if (options?.status) params.append('status', options.status);

    return this.request(`/admin/disputes?${params.toString()}`);
  }

  /**
   * Resolve dispute - unblock user (admin only)
   */
  async resolveDispute(disputeId: string, notes?: string): Promise<{
    success: boolean;
    data: any;
    message: string;
  }> {
    return this.request(`/admin/disputes/${disputeId}/resolve`, {
      method: 'POST',
      body: JSON.stringify({ notes }),
    });
  }

  /**
   * Reject dispute - keep user blocked (admin only)
   */
  async rejectDispute(disputeId: string, reason?: string): Promise<{
    success: boolean;
    data: any;
    message: string;
  }> {
    return this.request(`/admin/disputes/${disputeId}/reject`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  }

  /**
   * Process auto-unblock for expired disputes (admin only)
   */
  async processAutoUnblock(): Promise<{
    success: boolean;
    data: Array<{ disputeId: string; userId: string; success: boolean; error?: string }>;
    message: string;
  }> {
    return this.request('/admin/disputes/process-auto-unblock', {
      method: 'POST',
    });
  }

  /**
   * Get dispute by ID (public - no auth required)
   */
  async getDispute(disputeId: string): Promise<{
    success: boolean;
    data: {
      id: string;
      cardholderName: string;
      userName: string;
      status: string;
      createdAt: string;
      submittedAt?: string;
      autoUnblockAt?: string;
    };
  }> {
    return this.request(`/disputes/${disputeId}`);
  }

  /**
   * Submit dispute form (public - no auth required)
   */
  async submitDispute(disputeId: string, data: {
    disputeEmail: string;
    disputeInfo: string;
    disputeReason: string;
  }): Promise<{
    success: boolean;
    data: {
      id: string;
      status: string;
      submittedAt: string;
      autoUnblockAt: string;
    };
    message: string;
  }> {
    return this.request(`/disputes/${disputeId}/submit`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // ===========================
  // NOTIFICATION SETTINGS (Admin)
  // ===========================

  /**
   * Get notification settings (admin only)
   */
  async getNotificationSettings(): Promise<{
    success: boolean;
    data: {
      admin_notification_emails: string;
      notify_new_users: string;
      notify_new_inquiries: string;
      notify_new_transactions: string;
      notify_disputes: string;
      notify_consultations: string;
    };
  }> {
    return this.request('/admin/settings/notifications');
  }

  /**
   * Update notification settings (admin only)
   */
  async updateNotificationSettings(settings: {
    admin_notification_emails?: string;
    notify_new_users?: string;
    notify_new_inquiries?: string;
    notify_new_transactions?: string;
    notify_disputes?: string;
    notify_consultations?: string;
  }): Promise<{
    success: boolean;
    message: string;
  }> {
    return this.request('/admin/settings/notifications', {
      method: 'PUT',
      body: JSON.stringify(settings),
    });
  }

  // ===========================
  // Platform Settings
  // ===========================

  /**
   * Get public platform settings (no auth required)
   */
  async getPublicSettings(): Promise<{
    success: boolean;
    data: {
      listingPaymentRequired: boolean;
    };
  }> {
    return this.request('/settings/public');
  }

  /**
   * Get all platform settings (admin only)
   */
  async getPlatformSettings(): Promise<{
    success: boolean;
    data: Record<string, unknown>;
  }> {
    return this.request('/admin/settings');
  }

  /**
   * Update platform settings (admin only)
   */
  async updatePlatformSettings(settings: Array<{
    key: string;
    value: string;
    type?: string;
  }>): Promise<{
    success: boolean;
    message: string;
  }> {
    return this.request('/admin/settings', {
      method: 'PUT',
      body: JSON.stringify({ settings }),
    });
  }
  // ===========================
  // Dispatch Services
  // ===========================

  async submitDispatchForm(data: {
    name: string;
    company: string;
    email: string;
    phone: string;
    fleetSize?: string;
    equipmentType?: string;
    message?: string;
  }) {
    return this.request<{
      success: boolean;
      message: string;
    }>('/dispatch/submit', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // ===========================
  // Admin Services
  // ===========================

  async submitAdminServicesForm(data: {
    name: string;
    company: string;
    email: string;
    phone: string;
    fleetSize?: string;
    serviceType?: string;
    message?: string;
  }) {
    return this.request<{
      success: boolean;
      message: string;
    }>('/admin-services/submit', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // ===========================
  // Safety Services
  // ===========================

  async submitSafetyForm(data: {
    name: string;
    company: string;
    email: string;
    phone: string;
    mcNumber?: string;
    serviceType?: string;
    message?: string;
  }) {
    return this.request<{
      success: boolean;
      message: string;
    }>('/safety-services/submit', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // ===========================
  // Recruiting Services
  // ===========================

  async submitRecruitingForm(data: {
    name: string;
    company: string;
    email: string;
    phone: string;
    driversNeeded?: string;
    driverType?: string;
    message?: string;
  }) {
    return this.request<{
      success: boolean;
      message: string;
    }>('/recruiting-services/submit', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // ===========================
  // Fuel Program
  // ===========================

  async submitFuelProgramForm(data: {
    name: string;
    company: string;
    email: string;
    phone: string;
    fleetSize?: string;
    message?: string;
  }) {
    return this.request<{
      success: boolean;
      message: string;
    }>('/fuel-program/submit', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // ===========================
  // AI Chat Assistant
  // ===========================

  async createAIChatThread() {
    return this.request<{
      success: boolean;
      threadId: string;
    }>('/ai-chat/thread', {
      method: 'POST',
    });
  }

  async sendAIChatMessage(threadId: string, message: string) {
    return this.request<{
      success: boolean;
      response: string;
    }>('/ai-chat/message', {
      method: 'POST',
      body: JSON.stringify({ threadId, message }),
    });
  }

  // ===== CarrierPulse Creditsafe =====

  async carrierPulseCreditsafeSearch(params: { name: string; state?: string }) {
    const searchParams = new URLSearchParams();
    searchParams.set('name', params.name);
    if (params.state) searchParams.set('state', params.state);
    return this.request<{
      success: boolean;
      data: {
        companies: Array<{
          id: string;
          connectId?: string;
          name: string;
          regNo?: string;
          address?: {
            simpleValue?: string;
            city?: string;
            province?: string;
          };
          status?: string;
        }>;
        totalResults: number;
      };
    }>(`/buyer/carrier-pulse/creditsafe/search?${searchParams.toString()}`);
  }

  async checkCreditReportAccess(dotNumber: string, action: 'check' | 'unlock' = 'check') {
    return this.request<{
      success: boolean;
      data: { unlocked: boolean; free: boolean; cost?: number; newBalance?: number };
    }>(`/buyer/carrier-pulse/credit-report/${dotNumber}?action=${action}`);
  }

  async carrierPulseCreditsafeReport(connectId: string) {
    return this.request<{ success: boolean; data: any }>(
      `/buyer/carrier-pulse/creditsafe/report/${connectId}`
    );
  }

  // Credit Report one-time purchase ($35)
  async createCreditReportCheckout(connectId: string, companyName: string) {
    return this.request<{ success: boolean; data: { sessionId: string; url: string } }>(
      '/buyer/creditsafe/checkout',
      { method: 'POST', body: JSON.stringify({ connectId, companyName }) }
    );
  }

  async checkCreditReportPurchase(connectId: string) {
    return this.request<{ success: boolean; data: { purchased: boolean; free: boolean; price?: number } }>(
      `/buyer/creditsafe/purchase/${connectId}`
    );
  }

  async creditsafeOpenSearch(params: { name: string; state?: string }) {
    const query = new URLSearchParams({ name: params.name });
    if (params.state) query.set('state', params.state);
    return this.request<{ success: boolean; data: { companies: any[]; totalResults: number } }>(
      `/buyer/creditsafe/open-search?${query}`
    );
  }

  async creditsafePurchasedReport(connectId: string) {
    return this.request<{ success: boolean; data: any }>(
      `/buyer/creditsafe/purchased-report/${connectId}`
    );
  }
}

export const api = new ApiService();
export default api;
