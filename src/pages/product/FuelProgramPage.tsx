import { useState } from 'react'
import { motion } from 'framer-motion'
import api from '../../services/api'
import {
  Fuel,
  CheckCircle,
  MapPin,
  CreditCard,
  TrendingDown,
  Phone,
  Mail,
  ArrowRight,
  DollarSign,
  Truck,
  Clock
} from 'lucide-react'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Textarea from '../../components/ui/Textarea'

const FuelProgramPage = () => {
  const [formData, setFormData] = useState({
    name: '',
    company: '',
    email: '',
    phone: '',
    fleetSize: '',
    message: ''
  })
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      await api.submitFuelProgramForm(formData)
      setSubmitted(true)
    } catch (err: any) {
      setError(err.message || 'Failed to submit. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const benefits = [
    {
      icon: DollarSign,
      title: 'Up to $0.75/Gallon Savings',
      description: 'Access exclusive fuel discounts at all major truck stops nationwide. Save thousands annually on your fuel costs.'
    },
    {
      icon: MapPin,
      title: 'All Major Truck Stops',
      description: 'Fuel at all major truck stops including Pilot Flying J, Love\'s, TA-Petro, and thousands of independent locations.'
    },
    {
      icon: CreditCard,
      title: 'No Upfront Costs',
      description: 'No enrollment fees, no monthly minimums, and no hidden charges. You only pay for the fuel you use.'
    },
    {
      icon: TrendingDown,
      title: 'Real-Time Pricing',
      description: 'Our app shows real-time fuel prices so you can always find the best deal on your route.'
    }
  ]

  const features = [
    'Discounts at 15,000+ locations',
    'No minimum fuel purchase requirements',
    'Mobile app for real-time pricing',
    'Detailed fuel transaction reports',
    'Integration with popular ELD systems',
    'Dedicated account manager',
    'Same-day card activation',
    'No credit check required'
  ]

  const stats = [
    { value: '$0.75', label: 'Up to per gallon savings' },
    { value: '15,000+', label: 'Fuel locations nationwide' },
    { value: '$18K+', label: 'Average annual savings' },
    { value: '24/7', label: 'Customer support' }
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
              <Fuel className="w-10 h-10 text-gray-900" />
            </div>

            <h1 className="text-5xl lg:text-7xl font-bold mb-6 text-gray-900">
              Fuel Program
            </h1>

            <p className="text-xl lg:text-2xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Save up to $0.75 per gallon on fuel at all major truck stops nationwide.
              No fees. No minimums. Just savings.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="min-w-[200px]" onClick={() => document.getElementById('contact-form')?.scrollIntoView({ behavior: 'smooth' })}>
                Get Started Today
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

      {/* Benefits Section */}
      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl font-bold mb-4 text-gray-900">Why Choose Our Fuel Program?</h2>
          <p className="text-xl text-gray-500 max-w-2xl mx-auto">
            Join thousands of carriers who are saving money on every gallon.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-8">
          {benefits.map((benefit, index) => (
            <motion.div
              key={benefit.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
            >
              <Card hover className="h-full">
                <div className="flex gap-6">
                  <div className="flex-shrink-0">
                    <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center">
                      <benefit.icon className="w-7 h-7 text-gray-700" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold mb-2 text-gray-900">{benefit.title}</h3>
                    <p className="text-gray-500">{benefit.description}</p>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold mb-4 text-gray-900">How It Works</h2>
            <p className="text-xl text-gray-500">Start saving in three simple steps</p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { step: '01', icon: CreditCard, title: 'Get Your Card', desc: 'Apply online and receive your fuel card within 3-5 business days. No credit check required.' },
              { step: '02', icon: Truck, title: 'Fuel Up', desc: 'Use your card at any of our 15,000+ partner locations. Discounts apply automatically.' },
              { step: '03', icon: Clock, title: 'Track & Save', desc: 'Monitor your savings in real-time through our mobile app and online dashboard.' }
            ].map((item, index) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Card hover className="h-full text-center">
                  <div className="text-6xl font-bold text-gray-100 mb-4">{item.step}</div>
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

      {/* Features List */}
      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl font-bold mb-6 text-gray-900">Everything You Need to Manage Fuel Costs</h2>
            <p className="text-xl text-gray-500 mb-8">
              Our fuel program is designed specifically for motor carriers, with features that make it easy to save money and manage your fleet's fuel expenses.
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
                <Fuel className="w-16 h-16 text-white mx-auto mb-6" />
                <h3 className="text-3xl font-bold text-white mb-2">Calculate Your Savings</h3>
                <p className="text-gray-300 mb-6">Based on average fleet fuel consumption</p>
                <div className="text-5xl font-bold text-emerald-400 mb-2">$18,000+</div>
                <p className="text-gray-400">Average annual savings per truck</p>
              </div>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* Contact Form */}
      <section id="contact-form" className="py-20 bg-gray-50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-4xl font-bold mb-4 text-gray-900">Get Started Today</h2>
            <p className="text-xl text-gray-500">
              Fill out the form below and a fuel specialist will contact you within 24 hours.
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
                <p className="text-gray-500">A fuel specialist will contact you within 24 hours.</p>
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

                <Input
                  label="Fleet Size (Number of Trucks)"
                  type="number"
                  placeholder="10"
                  value={formData.fleetSize}
                  onChange={(e) => setFormData({ ...formData, fleetSize: e.target.value })}
                />

                <Textarea
                  label="Additional Information"
                  placeholder="Tell us about your fuel needs..."
                  rows={4}
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                />

                <Button type="submit" fullWidth size="lg">
                  Request Information
                  <ArrowRight className="w-5 h-5 ml-2" />
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
            <h2 className="text-4xl font-bold mb-4 text-white">Questions? We're Here to Help</h2>
            <p className="text-xl text-gray-300 mb-8">
              Call us or send an email. Our team is available 24/7.
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

export default FuelProgramPage
