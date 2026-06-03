import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  Truck,
  User,
  Mail,
  Phone,
  MapPin,
  FileText,
  Calendar,
  CheckCircle,
  Shield,
  DollarSign,
  Clock,
  Star,
  Send,
  Loader2
} from 'lucide-react'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import Select from '../components/ui/Select'
import Textarea from '../components/ui/Textarea'
import api from '../services/api'

const DriversLandingPage = () => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    city: '',
    state: '',
    cdlClass: '',
    yearsExperience: '',
    endorsements: '',
    availability: '',
    preferredRoutes: '',
    hasOwnTruck: '',
    message: ''
  })
  const [errors, setErrors] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors('')

    // Basic validation
    if (!formData.firstName || !formData.lastName || !formData.email || !formData.phone) {
      setErrors('Please fill in all required fields')
      return
    }

    setLoading(true)
    try {
      // Send driver application to admin
      await api.sendInquiryToAdmin(undefined, `
[Driver Application]

Name: ${formData.firstName} ${formData.lastName}
Email: ${formData.email}
Phone: ${formData.phone}
Location: ${formData.city}, ${formData.state}

CDL Class: ${formData.cdlClass}
Years of Experience: ${formData.yearsExperience}
Endorsements: ${formData.endorsements}
Availability: ${formData.availability}
Preferred Routes: ${formData.preferredRoutes}
Has Own Truck: ${formData.hasOwnTruck}

Additional Message:
${formData.message || 'N/A'}
      `)
      setSubmitted(true)
    } catch (err: any) {
      setErrors(err.message || 'Failed to submit application. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const benefits = [
    {
      icon: DollarSign,
      title: 'Competitive Pay',
      description: 'Earn top rates with weekly settlements and fuel advances'
    },
    {
      icon: Shield,
      title: 'Quality Freight',
      description: 'Access to premium loads from verified shippers'
    },
    {
      icon: Clock,
      title: 'Flexible Schedule',
      description: 'Choose loads that fit your schedule and preferences'
    },
    {
      icon: Star,
      title: 'Driver Support',
      description: '24/7 dispatch support and dedicated driver services'
    }
  ]

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full"
        >
          <Card className="text-center py-12">
            <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-10 h-10 text-emerald-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Application Submitted!</h2>
            <p className="text-gray-600 mb-6">
              Thank you for your interest in driving with Domilea. Our team will review your application and contact you within 24-48 hours.
            </p>
            <Button onClick={() => window.location.href = '/'}>
              Back to Home
            </Button>
          </Card>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PHBhdGggZD0iTTM2IDM0djItSDI0di0yaDEyek0zNiAyNHYySDI0di0yaDEyeiIvPjwvZz48L2c+PC9zdmc+')] opacity-50" />

        <div className="max-w-7xl mx-auto px-4 py-20 md:py-28 relative">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/20 mb-6">
                <Truck className="w-5 h-5 text-amber-400" />
                <span className="text-sm font-medium">Now Hiring Owner-Operators</span>
              </div>

              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
                Drive Your Career
                <span className="block text-amber-400">Forward</span>
              </h1>

              <p className="text-xl text-gray-300 mb-8 max-w-lg">
                Right now we're partnering exclusively with owner-operators. Our entire strategy and technology are built to help owner-operators succeed in every way — quality freight, competitive pay, and the support you need to run your business.
              </p>

              <div className="flex flex-wrap gap-4">
                <div className="flex items-center gap-2 text-gray-300">
                  <CheckCircle className="w-5 h-5 text-emerald-400" />
                  <span>Weekly Pay</span>
                </div>
                <div className="flex items-center gap-2 text-gray-300">
                  <CheckCircle className="w-5 h-5 text-emerald-400" />
                  <span>No Forced Dispatch</span>
                </div>
                <div className="flex items-center gap-2 text-gray-300">
                  <CheckCircle className="w-5 h-5 text-emerald-400" />
                  <span>24/7 Support</span>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="hidden lg:block"
            >
              <div className="relative">
                <div className="absolute -inset-4 bg-gradient-to-r from-amber-500/20 to-orange-500/20 rounded-3xl blur-2xl" />
                <div className="relative bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8">
                  <div className="grid grid-cols-2 gap-6">
                    {benefits.map((benefit, index) => (
                      <div key={index} className="text-center">
                        <div className="w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center mx-auto mb-3">
                          <benefit.icon className="w-6 h-6 text-amber-400" />
                        </div>
                        <h3 className="font-semibold mb-1">{benefit.title}</h3>
                        <p className="text-sm text-gray-400">{benefit.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Benefits Section - Mobile */}
      <section className="lg:hidden py-12 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-2 gap-4">
            {benefits.map((benefit, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="text-center h-full">
                  <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center mx-auto mb-3">
                    <benefit.icon className="w-5 h-5 text-amber-600" />
                  </div>
                  <h3 className="font-semibold text-sm mb-1">{benefit.title}</h3>
                  <p className="text-xs text-gray-500">{benefit.description}</p>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Application Form Section */}
      <section className="py-16 md:py-24">
        <div className="max-w-3xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Apply to Drive with Us
            </h2>
            <p className="text-lg text-gray-600">
              Fill out the form below and our team will reach out to discuss opportunities
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
          >
            <Card>
              <form onSubmit={handleSubmit} className="space-y-6">
                {errors && (
                  <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-600 text-sm flex items-start gap-2">
                    <span>{errors}</span>
                  </div>
                )}

                {/* Personal Information */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <User className="w-5 h-5 text-gray-400" />
                    Personal Information
                  </h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <Input
                      label="First Name"
                      placeholder="John"
                      value={formData.firstName}
                      onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                      required
                    />
                    <Input
                      label="Last Name"
                      placeholder="Doe"
                      value={formData.lastName}
                      onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                      required
                    />
                  </div>
                </div>

                {/* Contact Information */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Mail className="w-5 h-5 text-gray-400" />
                    Contact Information
                  </h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <Input
                      label="Email"
                      type="email"
                      placeholder="john@example.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      icon={<Mail className="w-4 h-4" />}
                      required
                    />
                    <Input
                      label="Phone"
                      type="tel"
                      placeholder="(555) 123-4567"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      icon={<Phone className="w-4 h-4" />}
                      required
                    />
                  </div>
                  <div className="grid md:grid-cols-2 gap-4 mt-4">
                    <Input
                      label="City"
                      placeholder="Dallas"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      icon={<MapPin className="w-4 h-4" />}
                    />
                    <Select
                      label="State"
                      value={formData.state}
                      onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                      options={[
                        { value: '', label: 'Select State' },
                        { value: 'AL', label: 'Alabama' },
                        { value: 'AK', label: 'Alaska' },
                        { value: 'AZ', label: 'Arizona' },
                        { value: 'AR', label: 'Arkansas' },
                        { value: 'CA', label: 'California' },
                        { value: 'CO', label: 'Colorado' },
                        { value: 'CT', label: 'Connecticut' },
                        { value: 'DE', label: 'Delaware' },
                        { value: 'FL', label: 'Florida' },
                        { value: 'GA', label: 'Georgia' },
                        { value: 'HI', label: 'Hawaii' },
                        { value: 'ID', label: 'Idaho' },
                        { value: 'IL', label: 'Illinois' },
                        { value: 'IN', label: 'Indiana' },
                        { value: 'IA', label: 'Iowa' },
                        { value: 'KS', label: 'Kansas' },
                        { value: 'KY', label: 'Kentucky' },
                        { value: 'LA', label: 'Louisiana' },
                        { value: 'ME', label: 'Maine' },
                        { value: 'MD', label: 'Maryland' },
                        { value: 'MA', label: 'Massachusetts' },
                        { value: 'MI', label: 'Michigan' },
                        { value: 'MN', label: 'Minnesota' },
                        { value: 'MS', label: 'Mississippi' },
                        { value: 'MO', label: 'Missouri' },
                        { value: 'MT', label: 'Montana' },
                        { value: 'NE', label: 'Nebraska' },
                        { value: 'NV', label: 'Nevada' },
                        { value: 'NH', label: 'New Hampshire' },
                        { value: 'NJ', label: 'New Jersey' },
                        { value: 'NM', label: 'New Mexico' },
                        { value: 'NY', label: 'New York' },
                        { value: 'NC', label: 'North Carolina' },
                        { value: 'ND', label: 'North Dakota' },
                        { value: 'OH', label: 'Ohio' },
                        { value: 'OK', label: 'Oklahoma' },
                        { value: 'OR', label: 'Oregon' },
                        { value: 'PA', label: 'Pennsylvania' },
                        { value: 'RI', label: 'Rhode Island' },
                        { value: 'SC', label: 'South Carolina' },
                        { value: 'SD', label: 'South Dakota' },
                        { value: 'TN', label: 'Tennessee' },
                        { value: 'TX', label: 'Texas' },
                        { value: 'UT', label: 'Utah' },
                        { value: 'VT', label: 'Vermont' },
                        { value: 'VA', label: 'Virginia' },
                        { value: 'WA', label: 'Washington' },
                        { value: 'WV', label: 'West Virginia' },
                        { value: 'WI', label: 'Wisconsin' },
                        { value: 'WY', label: 'Wyoming' }
                      ]}
                    />
                  </div>
                </div>

                {/* Driving Experience */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-gray-400" />
                    Driving Experience
                  </h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <Select
                      label="CDL Class"
                      value={formData.cdlClass}
                      onChange={(e) => setFormData({ ...formData, cdlClass: e.target.value })}
                      options={[
                        { value: '', label: 'Select CDL Class' },
                        { value: 'Class A', label: 'Class A' },
                        { value: 'Class B', label: 'Class B' },
                        { value: 'Class C', label: 'Class C' },
                        { value: 'No CDL', label: 'No CDL (Training Needed)' }
                      ]}
                    />
                    <Select
                      label="Years of Experience"
                      value={formData.yearsExperience}
                      onChange={(e) => setFormData({ ...formData, yearsExperience: e.target.value })}
                      options={[
                        { value: '', label: 'Select Experience' },
                        { value: '0-1', label: 'Less than 1 year' },
                        { value: '1-2', label: '1-2 years' },
                        { value: '3-5', label: '3-5 years' },
                        { value: '5-10', label: '5-10 years' },
                        { value: '10+', label: '10+ years' }
                      ]}
                    />
                  </div>
                  <div className="grid md:grid-cols-2 gap-4 mt-4">
                    <Input
                      label="Endorsements"
                      placeholder="e.g., Hazmat, Tanker, Doubles"
                      value={formData.endorsements}
                      onChange={(e) => setFormData({ ...formData, endorsements: e.target.value })}
                    />
                    <Select
                      label="Do you have your own truck?"
                      value={formData.hasOwnTruck}
                      onChange={(e) => setFormData({ ...formData, hasOwnTruck: e.target.value })}
                      options={[
                        { value: '', label: 'Select' },
                        { value: 'Yes', label: 'Yes - Owner Operator' },
                        { value: 'No', label: 'No - Need Company Truck' }
                      ]}
                    />
                  </div>
                </div>

                {/* Preferences */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-gray-400" />
                    Preferences
                  </h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <Select
                      label="Availability"
                      value={formData.availability}
                      onChange={(e) => setFormData({ ...formData, availability: e.target.value })}
                      options={[
                        { value: '', label: 'Select Availability' },
                        { value: 'Immediately', label: 'Immediately' },
                        { value: '1-2 weeks', label: '1-2 weeks' },
                        { value: '2-4 weeks', label: '2-4 weeks' },
                        { value: '1+ month', label: '1+ month' }
                      ]}
                    />
                    <Select
                      label="Preferred Routes"
                      value={formData.preferredRoutes}
                      onChange={(e) => setFormData({ ...formData, preferredRoutes: e.target.value })}
                      options={[
                        { value: '', label: 'Select Preference' },
                        { value: 'Local', label: 'Local (Home Daily)' },
                        { value: 'Regional', label: 'Regional' },
                        { value: 'OTR', label: 'Over the Road (OTR)' },
                        { value: 'Dedicated', label: 'Dedicated Routes' },
                        { value: 'Any', label: 'Open to All' }
                      ]}
                    />
                  </div>
                </div>

                {/* Additional Message */}
                <div>
                  <Textarea
                    label="Additional Information (Optional)"
                    placeholder="Tell us about yourself, your experience, or any questions you have..."
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    rows={4}
                  />
                </div>

                <Button type="submit" fullWidth size="lg" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5 mr-2" />
                      Submit Application
                    </>
                  )}
                </Button>

                <p className="text-center text-sm text-gray-500">
                  By submitting, you agree to be contacted by our recruitment team
                </p>
              </form>
            </Card>
          </motion.div>
        </div>
      </section>
    </div>
  )
}

export default DriversLandingPage
