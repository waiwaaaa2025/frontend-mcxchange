import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { CheckCircle, Calendar, MessageSquare, ArrowRight, Loader2 } from 'lucide-react'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import api from '../services/api'

const ConsultationSuccessPage = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const sessionId = searchParams.get('session_id')
  const [verifying, setVerifying] = useState(true)

  useEffect(() => {
    if (!sessionId) {
      navigate('/')
      return
    }

    // Confirm the payment straight from Stripe as a fallback to the webhook.
    // This marks the consultation PAID server-side so the admin's red
    // "Consultations" badge appears even if the webhook never fired.
    let active = true
    api.verifyConsultationSession(sessionId)
      .catch(() => { /* webhook will still reconcile; show success regardless */ })
      .finally(() => { if (active) setVerifying(false) })

    return () => { active = false }
  }, [sessionId, navigate])

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-secondary-50 flex items-center justify-center p-4 sm:p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-lg w-full"
      >
        <Card className="p-6 sm:p-8 text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', delay: 0.2, duration: 0.5 }}
            className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6"
          >
            <CheckCircle className="w-12 h-12 text-green-600" />
          </motion.div>

          <h1 className="text-3xl font-bold text-gray-900 mb-3">
            Consultation Booked!
          </h1>

          <p className="text-gray-600 mb-8">
            {verifying ? (
              <span className="inline-flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Confirming your payment…
              </span>
            ) : (
              'Thank you for booking a consultation with our team. Your payment has been processed successfully.'
            )}
          </p>

          <div className="bg-secondary-50 rounded-xl p-4 sm:p-6 mb-8 text-left border border-secondary-100">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-secondary-600" />
              What Happens Next
            </h3>
            <ul className="space-y-3 text-gray-600">
              <li className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-secondary-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-bold text-secondary-600">1</span>
                </div>
                <span>You'll receive a confirmation email with your booking details</span>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-secondary-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-bold text-secondary-600">2</span>
                </div>
                <span>Our team will contact you within 24 hours to confirm your preferred date and time</span>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-secondary-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-bold text-secondary-600">3</span>
                </div>
                <span>Get ready for your 60-minute expert consultation on MC authority</span>
              </li>
            </ul>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              variant="ghost"
              fullWidth
              onClick={() => navigate('/')}
            >
              Return Home
            </Button>
            <Button
              fullWidth
              onClick={() => navigate('/marketplace')}
            >
              Browse Listings
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>

          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="flex items-center justify-center gap-2 text-gray-500 text-sm">
              <MessageSquare className="w-4 h-4" />
              <span>Questions? Contact us at support@domilea.com</span>
            </div>
          </div>
        </Card>
      </motion.div>
    </div>
  )
}

export default ConsultationSuccessPage
