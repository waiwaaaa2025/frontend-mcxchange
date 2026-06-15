import { lazy, Suspense } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from './context/AuthContext'
import MainLayout from './layouts/MainLayout'
import DashboardLayout from './layouts/DashboardLayout'
import ComplianceLayout from './layouts/ComplianceLayout'
import AIChatWidget from './components/AIChatWidget'
import ProtectedRoute from './components/ProtectedRoute'
import AuthRequiredRoute from './components/AuthRequiredRoute'
import VerificationRequiredRoute from './components/VerificationRequiredRoute'

// Eagerly loaded - landing page (first paint)
import HomePage from './pages/HomePage'

// Lazy-loaded pages - split by route group
const LoginPage = lazy(() => import('./pages/LoginPage'))
const RegisterPage = lazy(() => import('./pages/RegisterPage'))
const AdminRegisterPage = lazy(() => import('./pages/AdminRegisterPage'))
const SellerVerificationPage = lazy(() => import('./pages/SellerVerificationPage'))
const VerifyEmailPage = lazy(() => import('./pages/VerifyEmailPage'))
const ForgotPasswordPage = lazy(() => import('./pages/ForgotPasswordPage'))
const ResetPasswordPage = lazy(() => import('./pages/ResetPasswordPage'))
const MarketplacePage = lazy(() => import('./pages/MarketplacePage'))
const MCDetailPage = lazy(() => import('./pages/MCDetailPage'))
const MCDetailPageV2 = lazy(() => import('./pages/MCDetailPageV2'))
const ConsultationSuccessPage = lazy(() => import('./pages/ConsultationSuccessPage'))
const PricingPage = lazy(() => import('./pages/PricingPage'))
const BuyersGuidePage = lazy(() => import('./pages/BuyersGuidePage'))
const GuideThankYouPage = lazy(() => import('./pages/GuideThankYouPage'))
const TermsPage = lazy(() => import('./pages/TermsPage'))
const PrivacyPage = lazy(() => import('./pages/PrivacyPage'))
const DriversLandingPage = lazy(() => import('./pages/DriversLandingPage'))

// Product pages
const ProductPage = lazy(() => import('./pages/product/ProductPage'))
const ContactPage = lazy(() => import('./pages/ContactPage'))
const FuelProgramPage = lazy(() => import('./pages/product/FuelProgramPage'))
const SafetyServicesPage = lazy(() => import('./pages/product/SafetyServicesPage'))
const RecruitingServicesPage = lazy(() => import('./pages/product/RecruitingServicesPage'))
const DispatchServicesPage = lazy(() => import('./pages/product/DispatchServicesPage'))
const AdminServicesPage = lazy(() => import('./pages/product/AdminServicesPage'))

// Seller pages
const SellerWelcomePage = lazy(() => import('./pages/SellerWelcomePage'))
const SellerDashboard = lazy(() => import('./pages/SellerDashboard'))
const CreateListingPage = lazy(() => import('./pages/CreateListingPage'))
const SellerCreateListingPage = lazy(() => import('./pages/SellerCreateListingPage'))
const SellerListingsPage = lazy(() => import('./pages/SellerListingsPage'))
const SellerOffersPage = lazy(() => import('./pages/SellerOffersPage'))
const SellerEarningsPage = lazy(() => import('./pages/SellerEarningsPage'))
const SellerDocumentsPage = lazy(() => import('./pages/SellerDocumentsPage'))
const SellerTransactionsPage = lazy(() => import('./pages/SellerTransactionsPage'))
const SellerMessagesPage = lazy(() => import('./pages/SellerMessagesPage'))
const SellerPayoutSetupPage = lazy(() => import('./pages/SellerPayoutSetupPage'))

// Buyer pages
const BuyerWelcomePage = lazy(() => import('./pages/BuyerWelcomePage'))
const BuyerDashboard = lazy(() => import('./pages/BuyerDashboard'))
const BuyerOffersPage = lazy(() => import('./pages/BuyerOffersPage'))
const BuyerPurchasesPage = lazy(() => import('./pages/BuyerPurchasesPage'))
const BuyerMessagesPage = lazy(() => import('./pages/BuyerMessagesPage'))
const BuyerSubscriptionPage = lazy(() => import('./pages/BuyerSubscriptionPage'))
const BuyerUnlockedMCsPage = lazy(() => import('./pages/BuyerUnlockedMCsPage'))
const BuyerCreditsafePage = lazy(() => import('./pages/BuyerCreditsafePage'))
const CreditReportPurchasePage = lazy(() => import('./pages/CreditReportPurchasePage'))
const VipMarketplacePage = lazy(() => import('./pages/VipMarketplacePage'))
const BuyerDepositPage = lazy(() => import('./pages/BuyerDepositPage'))
const BuyerTransactionsPage = lazy(() => import('./pages/BuyerTransactionsPage'))

// Admin pages
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'))
const AdminReviewPage = lazy(() => import('./pages/AdminReviewPage'))
const AdminAIDueDiligence = lazy(() => import('./pages/AdminAIDueDiligence'))
const AdminCreditsafePage = lazy(() => import('./pages/AdminCreditsafePage'))
const AdminInvoiceGenerator = lazy(() => import('./pages/AdminInvoiceGenerator'))
const AdminPaymentTracking = lazy(() => import('./pages/AdminPaymentTracking'))
const AdminAllListingsPage = lazy(() => import('./pages/AdminAllListingsPage'))
const AdminListingDetailPage = lazy(() => import('./pages/AdminListingDetailPage'))
const AdminPendingReviewPage = lazy(() => import('./pages/AdminPendingReviewPage'))
const AdminPremiumRequestsPage = lazy(() => import('./pages/AdminPremiumRequestsPage'))
const AdminBrokerOutreachPage = lazy(() => import('./pages/AdminBrokerOutreachPage'))
const AdminConsultationsPage = lazy(() => import('./pages/AdminConsultationsPage'))
const AdminTelegramPage = lazy(() => import('./pages/AdminTelegramPage'))
const AdminFacebookPage = lazy(() => import('./pages/AdminFacebookPage'))
const AdminSettingsPage = lazy(() => import('./pages/AdminSettingsPage'))
const AdminTransactionsPage = lazy(() => import('./pages/AdminTransactionsPage'))
const AdminMessagesPage = lazy(() => import('./pages/AdminMessagesPage'))
const AdminOffersPage = lazy(() => import('./pages/AdminOffersPage'))
const AdminActiveClosingsPage = lazy(() => import('./pages/AdminActiveClosingsPage'))
const AdminUsersPage = lazy(() => import('./pages/AdminUsersPage'))
const AdminDisputesPage = lazy(() => import('./pages/AdminDisputesPage'))
const AdminActivityLogPage = lazy(() => import('./pages/AdminActivityLogPage'))
const AdminLeadsPage = lazy(() => import('./pages/AdminLeadsPage'))
const TeamPage = lazy(() => import('./pages/agents/TeamPage'))
const ScoutAgentPage = lazy(() => import('./pages/agents/ScoutAgentPage'))
const EvaChatPage = lazy(() => import('./pages/agents/EvaChatPage'))
const AgentActivityPage = lazy(() => import('./pages/agents/AgentActivityPage'))
const AgentJobQueuePage = lazy(() => import('./pages/agents/AgentJobQueuePage'))
const AgentPolicyPage = lazy(() => import('./pages/agents/AgentPolicyPage'))
const CatalogPage = lazy(() => import('./pages/agents/CatalogPage'))
const SpendDashboardPage = lazy(() => import('./pages/agents/SpendDashboardPage'))

// Compliance module (Block G)
const CompDashboardPage = lazy(() => import('./pages/compliance/CompDashboardPage'))
const CompCompaniesPage = lazy(() => import('./pages/compliance/CompCompaniesPage'))
const CompAddCompanyPage = lazy(() => import('./pages/compliance/CompAddCompanyPage'))
const CompCompanyWorkspacePage = lazy(() => import('./pages/compliance/CompCompanyWorkspacePage'))
const CompDriversPage = lazy(() => import('./pages/compliance/CompDriversPage'))
const CompDriverDetailPage = lazy(() => import('./pages/compliance/CompDriverDetailPage'))
const CompDocumentsPage = lazy(() => import('./pages/compliance/CompDocumentsPage'))
const CompDiaChatPage = lazy(() => import('./pages/compliance/CompDiaChatPage'))
const SafetyImprovementReportPage = lazy(() => import('./pages/SafetyImprovementReportPage'))
const CarrierPulsePreviewPage = lazy(() => import('./pages/CarrierPulsePreviewPage'))
const CreditReportPreviewPage = lazy(() => import('./pages/CreditReportPreviewPage'))
const ChameleonCheckPreviewPage = lazy(() => import('./pages/ChameleonCheckPreviewPage'))
const SafetyReportPreviewPage = lazy(() => import('./pages/SafetyReportPreviewPage'))
const EvaAIPreviewPage = lazy(() => import('./pages/EvaAIPreviewPage'))
const ComplianceMonitorPage = lazy(() => import('./pages/ComplianceMonitorPage'))
const AdminCreateListingPage = lazy(() => import('./pages/AdminCreateListingPage'))
const LeadGeneratorLandingPage = lazy(() => import('./pages/LeadGeneratorLandingPage'))
const LeadGeneratorToolPage = lazy(() => import('./pages/LeadGeneratorToolPage'))
const AdminLeadGeneratorSavesPage = lazy(() => import('./pages/AdminLeadGeneratorSavesPage'))

// CarrierPulse
const CarrierPulsePage = lazy(() => import('./pages/CarrierPulsePage'))

// Pending Insurance Leads
const InsuranceLeadsPage = lazy(() => import('./pages/InsuranceLeadsPage'))
const InsuranceLeadsPreviewPage = lazy(() => import('./pages/InsuranceLeadsPreviewPage'))

// Chameleon Check
const ChameleonCheckPage = lazy(() => import('./pages/ChameleonCheckPage'))

// Shared pages
const ProfilePage = lazy(() => import('./pages/ProfilePage'))
const SettingsPage = lazy(() => import('./pages/SettingsPage'))
const TransactionRoomPage = lazy(() => import('./pages/TransactionRoomPage'))
const DisputePage = lazy(() => import('./pages/DisputePage'))

// Loading fallback for lazy-loaded pages
function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
    </div>
  )
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <Toaster position="top-right" />
        <AIChatWidget />
        <Suspense fallback={<PageLoader />}>
          <Routes>
            {/* Public Routes with MainLayout */}
            <Route path="/" element={<MainLayout />}>
              <Route index element={<HomePage />} />
              <Route path="login" element={<LoginPage />} />
              <Route path="register" element={<RegisterPage />} />
              <Route path="pricing" element={<PricingPage />} />
              <Route path="resources/how-to-buy-a-trucking-business" element={<BuyersGuidePage />} />
              <Route path="guide/thank-you" element={<GuideThankYouPage />} />
              <Route path="terms" element={<TermsPage />} />
              <Route path="privacy" element={<PrivacyPage />} />
              <Route path="admin-register" element={<AdminRegisterPage />} />
              <Route path="seller-verification" element={<SellerVerificationPage />} />
              <Route path="verify-email" element={<VerifyEmailPage />} />
              <Route path="forgot-password" element={<ForgotPasswordPage />} />
              <Route path="reset-password" element={<ResetPasswordPage />} />
              <Route path="marketplace" element={<MarketplacePage />} />
              <Route path="mc/:id" element={<MCDetailPageV2 />} />
              <Route path="mc-v2/:id" element={<MCDetailPageV2 />} />
              <Route path="consultation/success" element={<ConsultationSuccessPage />} />
              <Route path="contact" element={<ContactPage />} />
              {/* Product Routes */}
              <Route path="product" element={<ProductPage />} />
              <Route path="product/fuel-program" element={<FuelProgramPage />} />
              <Route path="product/safety" element={<SafetyServicesPage />} />
              <Route path="product/recruiting" element={<RecruitingServicesPage />} />
              <Route path="product/dispatch" element={<DispatchServicesPage />} />
              <Route path="product/admin" element={<AdminServicesPage />} />
              {/* Legacy /services URLs → /product (redirects for SEO/bookmarks) */}
              <Route path="services" element={<Navigate to="/product" replace />} />
              <Route path="services/fuel-program" element={<Navigate to="/product/fuel-program" replace />} />
              <Route path="services/safety" element={<Navigate to="/product/safety" replace />} />
              <Route path="services/recruiting" element={<Navigate to="/product/recruiting" replace />} />
              <Route path="services/dispatch" element={<Navigate to="/product/dispatch" replace />} />
              <Route path="services/admin" element={<Navigate to="/product/admin" replace />} />
              <Route path="drivers" element={<DriversLandingPage />} />
              <Route path="carrier-pulse-preview" element={<CarrierPulsePreviewPage />} />
              <Route path="carrier-pulse-preview/:dotNumber" element={<CarrierPulsePreviewPage />} />
              <Route path="insurance-leads-preview" element={<InsuranceLeadsPreviewPage />} />
              <Route path="lead-generator" element={<LeadGeneratorLandingPage />} />
              {/* Role-agnostic tool route — any authenticated subscriber (seller,
                  compliance, etc.) can use Lead Generator. Buyers keep their
                  in-dashboard route at /buyer/lead-generator. */}
              <Route path="lead-generator/app" element={<ProtectedRoute><LeadGeneratorToolPage /></ProtectedRoute>} />
              <Route path="credit-report-preview" element={<CreditReportPreviewPage />} />
              <Route path="chameleon-check-preview" element={<ChameleonCheckPreviewPage />} />
              <Route path="safety-report-preview" element={<SafetyReportPreviewPage />} />
              <Route path="eva-ai" element={<EvaAIPreviewPage />} />
              <Route path="compliance-monitor" element={<ComplianceMonitorPage />} />
            </Route>

            {/* Seller Welcome (standalone, no DashboardLayout) */}
            <Route
              path="seller/welcome"
              element={
                <ProtectedRoute allowedRoles={['seller']}>
                  <SellerWelcomePage />
                </ProtectedRoute>
              }
            />

            {/* Seller Dashboard Routes */}
            <Route
              path="seller"
              element={
                <ProtectedRoute allowedRoles={['seller']}>
                  <DashboardLayout />
                </ProtectedRoute>
              }
            >
              <Route path="dashboard" element={<SellerDashboard />} />
              <Route path="create-listing" element={<SellerCreateListingPage />} />
              <Route path="listings" element={<SellerListingsPage />} />
              <Route path="offers" element={<SellerOffersPage />} />
              <Route path="earnings" element={<SellerEarningsPage />} />
              <Route path="documents" element={<SellerDocumentsPage />} />
              <Route path="transactions" element={<SellerTransactionsPage />} />
              <Route path="messages" element={<SellerMessagesPage />} />
              <Route path="payout-setup" element={<SellerPayoutSetupPage />} />
              <Route path="carrier-pulse" element={<CarrierPulsePage />} />
              <Route path="carrier-pulse/:dotNumber" element={<CarrierPulsePage />} />
              <Route path="insurance-leads" element={<InsuranceLeadsPage />} />
              <Route path="chameleon-check" element={<ChameleonCheckPage />} />
              <Route path="chameleon-check/:dotNumber" element={<ChameleonCheckPage />} />
            </Route>

            {/* Buyer Welcome (standalone, no DashboardLayout) */}
            <Route
              path="buyer/welcome"
              element={
                <ProtectedRoute allowedRoles={['buyer']}>
                  <BuyerWelcomePage />
                </ProtectedRoute>
              }
            />

            {/* Buyer Dashboard Routes */}
            <Route
              path="buyer"
              element={
                <ProtectedRoute allowedRoles={['buyer']}>
                  <DashboardLayout />
                </ProtectedRoute>
              }
            >
              <Route path="dashboard" element={<BuyerDashboard />} />
              <Route path="subscription" element={<BuyerSubscriptionPage />} />
              <Route path="offers" element={<VerificationRequiredRoute><BuyerOffersPage /></VerificationRequiredRoute>} />
              <Route path="purchases" element={<VerificationRequiredRoute><BuyerPurchasesPage /></VerificationRequiredRoute>} />
              <Route path="messages" element={<VerificationRequiredRoute><BuyerMessagesPage /></VerificationRequiredRoute>} />
              <Route path="creditsafe" element={<VerificationRequiredRoute><BuyerCreditsafePage /></VerificationRequiredRoute>} />
              <Route path="credit-report" element={<CreditReportPurchasePage />} />
              <Route path="vip-marketplace" element={<VerificationRequiredRoute><VipMarketplacePage /></VerificationRequiredRoute>} />
              <Route path="unlocked" element={<VerificationRequiredRoute><BuyerUnlockedMCsPage /></VerificationRequiredRoute>} />
              <Route path="deposit/:offerId" element={<VerificationRequiredRoute><BuyerDepositPage /></VerificationRequiredRoute>} />
              <Route path="transactions" element={<VerificationRequiredRoute><BuyerTransactionsPage /></VerificationRequiredRoute>} />
              <Route path="carrier-pulse" element={<CarrierPulsePage />} />
              <Route path="carrier-pulse/:dotNumber" element={<CarrierPulsePage />} />
              <Route path="insurance-leads" element={<InsuranceLeadsPage />} />
              <Route path="lead-generator" element={<LeadGeneratorToolPage />} />
              <Route path="chameleon-check" element={<ChameleonCheckPage />} />
              <Route path="chameleon-check/:dotNumber" element={<ChameleonCheckPage />} />
              <Route path="package-tool" element={<Navigate to="/carrier-pulse-preview" replace />} />
            </Route>

            {/* Admin Dashboard Routes */}
            <Route
              path="admin"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <DashboardLayout />
                </ProtectedRoute>
              }
            >
              <Route path="dashboard" element={<AdminDashboard />} />
              <Route path="messages" element={<AdminMessagesPage />} />
              <Route path="review/:id" element={<AdminReviewPage />} />
              <Route path="ai-due-diligence" element={<Navigate to="/admin/due-diligence" replace />} />
              <Route path="due-diligence" element={<AdminAIDueDiligence />} />
              <Route path="creditsafe" element={<AdminCreditsafePage />} />
              <Route path="telegram" element={<AdminTelegramPage />} />
              <Route path="facebook" element={<AdminFacebookPage />} />
              <Route path="invoices" element={<AdminInvoiceGenerator />} />
              <Route path="payments" element={<AdminPaymentTracking />} />
              <Route path="pending" element={<AdminPendingReviewPage />} />
              <Route path="premium-requests" element={<AdminPremiumRequestsPage />} />
              <Route path="broker-outreach" element={<AdminBrokerOutreachPage />} />
              <Route path="consultations" element={<AdminConsultationsPage />} />
              <Route path="reported" element={<div className="p-8"><h1 className="text-2xl font-bold">Reported Items</h1></div>} />
              <Route path="users" element={<AdminUsersPage />} />
              <Route path="users/:userId" element={<AdminUsersPage />} />
              <Route path="activity-log" element={<AdminActivityLogPage />} />
              <Route path="disputes" element={<AdminDisputesPage />} />
              <Route path="settings" element={<AdminSettingsPage />} />
              <Route path="transactions" element={<AdminTransactionsPage />} />
              <Route path="active-closings" element={<AdminActiveClosingsPage />} />
              <Route path="create-listing" element={<AdminCreateListingPage />} />
              <Route path="listings" element={<AdminAllListingsPage />} />
              <Route path="listing/:id" element={<AdminListingDetailPage />} />
              <Route path="offers" element={<AdminOffersPage />} />
              <Route path="reports" element={<div className="p-8"><h1 className="text-2xl font-bold">Reports</h1></div>} />
              <Route path="carrier-pulse" element={<CarrierPulsePage />} />
              <Route path="carrier-pulse/:dotNumber" element={<CarrierPulsePage />} />
              <Route path="insurance-leads" element={<InsuranceLeadsPage />} />
              <Route path="chameleon-check" element={<ChameleonCheckPage />} />
              <Route path="chameleon-check/:dotNumber" element={<ChameleonCheckPage />} />
              <Route path="leads" element={<AdminLeadsPage />} />
              <Route path="lead-generator" element={<AdminLeadGeneratorSavesPage />} />
              <Route path="team" element={<TeamPage />} />
              <Route path="team/scout" element={<ScoutAgentPage />} />
              <Route path="team/eva" element={<EvaChatPage />} />
              <Route path="team/activity" element={<AgentActivityPage />} />
              <Route path="team/jobs" element={<AgentJobQueuePage />} />
              <Route path="team/:slug/policies" element={<AgentPolicyPage />} />
              <Route path="team/catalog" element={<CatalogPage />} />
              <Route path="team/spend" element={<SpendDashboardPage />} />
              <Route path="safety-report" element={<SafetyImprovementReportPage />} />
            </Route>

            {/* Compliance Manager Routes — LINQ-style shell */}
            <Route
              path="compliance"
              element={
                <ProtectedRoute allowedRoles={['compliance_manager', 'admin']}>
                  <ComplianceLayout />
                </ProtectedRoute>
              }
            >
              <Route path="dashboard" element={<CompDashboardPage />} />
              <Route path="companies" element={<CompCompaniesPage />} />
              <Route path="companies/new" element={<CompAddCompanyPage />} />
              <Route path="companies/:id" element={<CompCompanyWorkspacePage />} />
              <Route path="drivers" element={<CompDriversPage />} />
              <Route path="drivers/:id" element={<CompDriverDetailPage />} />
              <Route path="documents" element={<CompDocumentsPage />} />
              <Route path="dia" element={<CompDiaChatPage />} />
            </Route>

            {/* Public Dispute Page - No auth required */}
            <Route path="dispute/:disputeId" element={<DisputePage />} />

            {/* Transaction Room - Shared by all roles */}
            <Route
              path="transaction/:transactionId"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <TransactionRoomPage />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />

            {/* Profile and Settings (with Dashboard Layout) */}
            <Route
              path="profile"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <ProfilePage />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="settings"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <SettingsPage />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </AuthProvider>
    </Router>
  )
}

export default App
