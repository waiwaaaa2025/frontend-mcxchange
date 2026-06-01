import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  Truck,
  CheckCircle,
  MapPin,
  Clock,
  DollarSign,
  Phone,
  Mail,
  ArrowRight,
  TrendingUp,
  Shield,
  Headphones,
  Route,
  Calculator,
  Loader2,
  AlertCircle
} from 'lucide-react'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Textarea from '../../components/ui/Textarea'
import Select from '../../components/ui/Select'
import { api } from '../../services/api'

const DispatchServicesPage = () => {
  const [formData, setFormData] = useState({
    name: '',
    company: '',
    email: '',
    phone: '',
    fleetSize: '',
    equipmentType: '',
    message: ''
  })
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      await api.submitDispatchForm(formData)
      setSubmitted(true)
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const services = [
    {
      icon: Route,
      title: 'Load Planning & Booking',
      description: 'Our dispatchers work the load boards and broker relationships to find high-paying freight that matches your lanes and equipment.',
      features: ['Load board access', 'Broker negotiations', 'Lane optimization']
    },
    {
      icon: DollarSign,
      title: 'Rate Negotiation',
      description: 'We fight for every dollar. Our experienced dispatchers know market rates and negotiate aggressively to maximize your revenue.',
      features: ['Market rate analysis', 'Contract negotiations', 'Accessorial billing']
    },
    {
      icon: MapPin,
      title: 'Trip Planning',
      description: 'Optimize every mile with smart routing, fuel stop planning, and appointment scheduling to keep your trucks moving efficiently.',
      features: ['Route optimization', 'Fuel stop planning', 'Appointment scheduling']
    },
    {
      icon: Headphones,
      title: '24/7 Support',
      description: 'Issues don\'t just happen during business hours. Our dispatch team is available around the clock to handle any situation.',
      features: ['24/7 availability', 'Breakdown assistance', 'Customer communication']
    }
  ]

  const features = [
    'Dedicated dispatcher for your fleet',
    'Load board subscriptions included',
    'Back office support included',
    'Detention and layover billing',
    'TONU claims handling',
    'Customer relationship management',
    'Weekly settlement reports',
    'No long-term contracts required'
  ]

  const stats = [
    { value: '$2.75+', label: 'Average rate per mile' },
    { value: '95%', label: 'On-time delivery rate' },
    { value: '24/7', label: 'Dispatch coverage' },
    { value: '500+', label: 'Trucks dispatched' }
  ]

  const pricingPlans = [
    {
      name: 'Percentage',
      price: '5-8%',
      description: 'of gross revenue',
      features: ['Full dispatch service', 'Rate negotiation', '24/7 support', 'Trip planning', 'No upfront cost'],
      popular: true
    },
    {
      name: 'Flat Rate',
      price: '$250',
      description: 'per truck per week',
      features: ['Full dispatch service', 'Rate negotiation', '24/7 support', 'Trip planning', 'Predictable cost'],
      popular: false
    }
  ]

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-gray-50 to-white">
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center max-w-4xl mx-auto"
          >
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gray-100 mb-8">
              <Truck className="w-10 h-10 text-gray-900" />
            </div>

            <h1 className="text-5xl lg:text-7xl font-bold mb-6 text-gray-900">
              Dispatch Services
            </h1>

            <p className="text-xl lg:text-2xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Professional dispatch services to keep your trucks loaded and profitable.
              We negotiate the rates. You drive the miles.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="min-w-[200px]" onClick={() => document.getElementById('contact-form')?.scrollIntoView({ behavior: 'smooth' })}>
                Get Dispatched
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>

              <a href="tel:+18778141807">
                <Button size="lg" variant="outline" className="min-w-[200px]">
                  <Phone className="w-5 h-5 mr-2" />
                  Call (877) 814-1807
                </Button>
              </a>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 border-y border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="text-center"
              >
                <div className="text-4xl lg:text-5xl font-bold text-gray-900 mb-2">{stat.value}</div>
                <div className="text-gray-500">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl font-bold mb-4 text-gray-900">Full-Service Dispatch</h2>
          <p className="text-xl text-gray-500 max-w-2xl mx-auto">
            More than just finding loads. We're your back office on the road.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-8">
          {services.map((service, index) => (
            <motion.div
              key={service.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
            >
              <Card hover className="h-full">
                <div className="mb-6">
                  <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center">
                    <service.icon className="w-7 h-7 text-gray-700" />
                  </div>
                </div>

                <h3 className="text-2xl font-bold mb-3 text-gray-900">{service.title}</h3>
                <p className="text-gray-500 mb-6">{service.description}</p>

                <ul className="space-y-2">
                  {service.features.map((feature) => (
                    <li key={feature} className="flex items-center text-sm text-gray-600">
                      <CheckCircle className="w-4 h-4 text-emerald-500 mr-2 flex-shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold mb-4 text-gray-900">Simple, Transparent Pricing</h2>
            <p className="text-xl text-gray-500">Choose the plan that works for your operation</p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {pricingPlans.map((plan, index) => (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className={`h-full ${plan.popular ? 'ring-2 ring-gray-900' : ''}`}>
                  {plan.popular && (
                    <div className="bg-gray-900 text-white text-sm font-medium px-4 py-1 rounded-full inline-block mb-4">
                      Most Popular
                    </div>
                  )}
                  <h3 className="text-2xl font-bold mb-2 text-gray-900">{plan.name}</h3>
                  <div className="flex items-baseline gap-2 mb-2">
                    <span className="text-5xl font-bold text-gray-900">{plan.price}</span>
                    <span className="text-gray-500">{plan.description}</span>
                  </div>

                  <ul className="space-y-3 my-8">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-center text-gray-600">
                        <CheckCircle className="w-5 h-5 text-emerald-500 mr-3 flex-shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>

                  <Button fullWidth variant={plan.popular ? 'primary' : 'outline'}>
                    Get Started
                  </Button>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features List */}
      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl font-bold mb-6 text-gray-900">Everything Included</h2>
            <p className="text-xl text-gray-500 mb-8">
              Our dispatch service is all-inclusive. No hidden fees, no extra charges for basic services that should be standard.
            </p>

            <div className="grid sm:grid-cols-2 gap-4">
              {features.map((feature) => (
                <div key={feature} className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                  <span className="text-gray-700">{feature}</span>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <Card className="bg-gradient-to-br from-gray-900 to-gray-800 border-0">
              <div className="text-center py-8">
                <TrendingUp className="w-16 h-16 text-white mx-auto mb-6" />
                <h3 className="text-3xl font-bold text-white mb-2">Maximize Your Revenue</h3>
                <p className="text-gray-300 mb-6">Our dispatchers average better rates than owner operators booking their own loads</p>
                <div className="text-5xl font-bold text-emerald-400 mb-2">15-25%</div>
                <p className="text-gray-400">Higher revenue per mile on average</p>
              </div>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold mb-4 text-gray-900">Why Choose Our Dispatch?</h2>
            <p className="text-xl text-gray-500 max-w-2xl mx-auto">
              We treat your truck like our own. Your success is our success.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: Clock, title: 'Less Deadhead', desc: 'Smart planning means fewer empty miles. We keep your wheels turning and your truck earning.' },
              { icon: Shield, title: 'Reliable Partners', desc: 'We only work with vetted brokers and shippers. No load shopping, no problems getting paid.' },
              { icon: Calculator, title: 'Transparent Accounting', desc: 'Weekly settlements with detailed breakdowns. Know exactly where every dollar goes.' }
            ].map((item, index) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Card hover className="h-full text-center">
                  <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
                    <item.icon className="w-7 h-7 text-gray-700" />
                  </div>
                  <h3 className="text-xl font-bold mb-2 text-gray-900">{item.title}</h3>
                  <p className="text-gray-500">{item.desc}</p>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Form */}
      <section id="contact-form" className="py-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-4xl font-bold mb-4 text-gray-900">Ready to Get Dispatched?</h2>
            <p className="text-xl text-gray-500">
              Fill out the form below and a dispatch specialist will contact you within 24 hours.
            </p>
          </motion.div>

          <Card>
            {submitted ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-12"
              >
                <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-6">
                  <CheckCircle className="w-8 h-8 text-emerald-500" />
                </div>
                <h3 className="text-2xl font-bold mb-2 text-gray-900">Thank You!</h3>
                <p className="text-gray-500">A dispatch specialist will contact you within 24 hours.</p>
              </motion.div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <Input
                    label="Full Name"
                    placeholder="John Smith"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                  <Input
                    label="Company Name"
                    placeholder="ABC Trucking LLC"
                    value={formData.company}
                    onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                    required
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <Input
                    label="Email"
                    type="email"
                    placeholder="john@company.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                  />
                  <Input
                    label="Phone"
                    type="tel"
                    placeholder="(555) 555-5555"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    required
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <Input
                    label="Number of Trucks"
                    type="number"
                    placeholder="5"
                    value={formData.fleetSize}
                    onChange={(e) => setFormData({ ...formData, fleetSize: e.target.value })}
                  />
                  <Select
                    label="Equipment Type"
                    value={formData.equipmentType}
                    onChange={(e) => setFormData({ ...formData, equipmentType: e.target.value })}
                    options={[
                      { value: '', label: 'Select equipment type' },
                      { value: 'dry-van', label: 'Dry Van' },
                      { value: 'reefer', label: 'Reefer' },
                      { value: 'flatbed', label: 'Flatbed' },
                      { value: 'step-deck', label: 'Step Deck' },
                      { value: 'tanker', label: 'Tanker' },
                      { value: 'other', label: 'Other' }
                    ]}
                  />
                </div>

                <Textarea
                  label="Tell Us About Your Operation"
                  placeholder="Describe your lanes, freight preferences, and any specific requirements..."
                  rows={4}
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                />

                {error && (
                  <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    {error}
                  </div>
                )}

                <Button type="submit" fullWidth size="lg" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      Request Dispatch Quote
                      <ArrowRight className="w-5 h-5 ml-2" />
                    </>
                  )}
                </Button>
              </form>
            )}
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Card className="bg-gradient-to-r from-gray-900 to-gray-800 border-0">
          <div className="text-center py-12">
            <h2 className="text-4xl font-bold mb-4 text-white">Stop Leaving Money on the Table</h2>
            <p className="text-xl text-gray-300 mb-8">
              Let professional dispatchers maximize your revenue while you focus on driving.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a href="tel:+18778141807">
                <Button size="lg" className="min-w-[200px] bg-white text-gray-900 hover:bg-gray-100">
                  <Phone className="w-5 h-5 mr-2" />
                  (877) 814-1807
                </Button>
              </a>

              <a href="mailto:info@domilea.com">
                <Button size="lg" variant="outline" className="min-w-[200px] border-white text-white hover:bg-white/10">
                  <Mail className="w-5 h-5 mr-2" />
                  info@domilea.com
                </Button>
              </a>
            </div>
          </div>
        </Card>
      </section>
    </div>
  )
}

export default DispatchServicesPage
