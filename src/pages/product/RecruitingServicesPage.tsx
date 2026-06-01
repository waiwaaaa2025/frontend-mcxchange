import { useState } from 'react'
import { motion } from 'framer-motion'
import api from '../../services/api'
import {
  Users,
  CheckCircle,
  Phone,
  Mail,
  ArrowRight,
  Clock,
  Award,
  Briefcase,
  DollarSign,
  Megaphone,
  Zap,
  Target,
  TrendingUp,
  Truck
} from 'lucide-react'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Textarea from '../../components/ui/Textarea'
import Select from '../../components/ui/Select'

const RecruitingServicesPage = () => {
  const [formData, setFormData] = useState({
    name: '',
    company: '',
    email: '',
    phone: '',
    driversNeeded: '',
    driverType: '',
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
      await api.submitRecruitingForm(formData)
      setSubmitted(true)
    } catch (err: any) {
      setError(err.message || 'Failed to submit. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const pricing = [
    { type: 'Company Driver', price: '$750', desc: 'Per hire — CDL company drivers ready to roll' },
    { type: 'Lease / Lease-to-Purchase', price: '$800', desc: 'Per hire — drivers looking for lease or lease-to-purchase programs' },
    { type: 'Owner Operator', price: '$1,000', desc: 'Per hire — independent owner operators including Amazon Relay' },
  ]

  const whatWeRecruit = [
    'Company Drivers (OTR, Regional, Local)',
    'Owner Operators for Amazon Relay',
    'Owner Operators for Dry Van, Reefer, Flatbed',
    'Lease & Lease-to-Purchase Drivers',
    'Team Drivers',
    'Hazmat & Tanker Endorsed Drivers',
  ]

  const process = [
    { step: '01', title: 'Consultation', desc: 'We learn your company, lanes, pay, equipment, and what kind of driver fits your operation.' },
    { step: '02', title: 'Targeted Advertising', desc: 'We run ads and campaigns specifically for your carrier. No generic blasts — every ad is built around your company and what you offer.' },
    { step: '03', title: 'Pre-Qualifying & Screening', desc: 'Our recruiters talk to every driver, verify their qualifications, and only send you candidates that actually match what you need.' },
    { step: '04', title: 'Fast Placement', desc: 'We present qualified, ready-to-go drivers. With the right process on your end, we can have drivers hired within 7 days.' },
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
              <Users className="w-10 h-10 text-gray-900" />
            </div>

            <h1 className="text-5xl lg:text-7xl font-bold mb-6 text-gray-900">
              Driver Recruiting
            </h1>

            <p className="text-xl lg:text-2xl text-gray-600 mb-8 max-w-3xl mx-auto">
              We hire company drivers, owner operators for Amazon Relay, and lease drivers.
              Our recruiters are fully trained by the owner and understand the trucking industry from the inside.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="min-w-[200px]" onClick={() => document.getElementById('contact-form')?.scrollIntoView({ behavior: 'smooth' })}>
                Start Hiring Drivers
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
            {[
              { value: '7', label: 'Day avg. time to hire' },
              { value: '90%+', label: 'Retention rate' },
              { value: '$750', label: 'Starting per hire' },
              { value: '100%', label: 'Trained recruiters' },
            ].map((stat, index) => (
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

      {/* What Makes Us Different */}
      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl font-bold mb-4 text-gray-900">We Don't Just Send You Anyone</h2>
          <p className="text-xl text-gray-500 max-w-3xl mx-auto">
            Our recruiters are completely trained by the owner. They understand the current market, compliance requirements, and what it takes to actually get a driver hired and in a truck.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8">
          {[
            {
              icon: Award,
              title: 'Industry-Trained Recruiters',
              desc: 'Our team doesn\'t learn recruiting from a textbook. They\'re trained by the owner who has been in the trucking industry and understands how carriers operate, what drivers want, and how to match the two. They know the difference between OTR and regional, they understand Amazon Relay requirements, and they know what compliance means.'
            },
            {
              icon: Zap,
              title: 'Speed Wins in This Market',
              desc: 'Drivers apply to a handful of companies at once. The carrier that moves fast gets the driver. If your hiring process takes 2-3 days just to tell a driver if he\'s approved — you\'ve already lost him. We work fast and efficient, and we look for carriers who operate the same way. Get the driver in the truck first.'
            },
            {
              icon: Megaphone,
              title: 'Dedicated Advertising',
              desc: 'We run targeted advertising campaigns specifically for your carrier. Every ad highlights your company, your pay, your lanes, and what makes you a good place to drive for. This isn\'t mass blasting — it\'s strategic recruitment marketing that actually works.'
            },
          ].map((item, index) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
            >
              <Card hover className="h-full">
                <div className="mb-6">
                  <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center">
                    <item.icon className="w-7 h-7 text-gray-700" />
                  </div>
                </div>
                <h3 className="text-2xl font-bold mb-3 text-gray-900">{item.title}</h3>
                <p className="text-gray-500 leading-relaxed">{item.desc}</p>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>

      {/* The Reality Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-4xl font-bold mb-6 text-gray-900">The Current Market Reality</h2>
              <div className="space-y-4 text-gray-600 text-lg leading-relaxed">
                <p>
                  The trucking market right now is simple: the carrier who moves fast, hires fast. Drivers are applying to multiple companies at the same time. They're going to pick the one that responds first, approves them quickly, and gets them working.
                </p>
                <p>
                  If your process takes days to tell a driver whether he's approved or not — he's already signed with someone else. Our recruiters understand this. They pre-qualify candidates, present them ready to go, and work with carriers who have a fast check and fast hiring process.
                </p>
                <p>
                  We can find you as many drivers as you need — company drivers, owner operators, Amazon Relay drivers — as long as you're ready to move when we bring them to you. That's how this works. Put the driver first, move fast, and your trucks stay full.
                </p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <Card className="bg-gradient-to-br from-gray-900 to-gray-800 border-0">
                <div className="text-center py-8">
                  <Target className="w-16 h-16 text-white mx-auto mb-6" />
                  <h3 className="text-3xl font-bold text-white mb-2">Fast & Efficient Hiring</h3>
                  <p className="text-gray-300 mb-6">We work fast. We expect our carrier partners to do the same.</p>
                  <div className="text-5xl font-bold text-emerald-400 mb-2">7 Days</div>
                  <p className="text-gray-400">Average time from job order to hired driver</p>
                </div>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl font-bold mb-4 text-gray-900">Transparent Pricing</h2>
          <p className="text-xl text-gray-500 max-w-2xl mx-auto">
            Simple per-hire pricing. No monthly fees, no hidden costs. You pay when we deliver a hired driver.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          {pricing.map((item, index) => (
            <motion.div
              key={item.type}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
            >
              <Card hover className="h-full text-center">
                <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
                  <DollarSign className="w-7 h-7 text-gray-700" />
                </div>
                <h3 className="text-lg font-bold mb-2 text-gray-900">{item.type}</h3>
                <div className="text-4xl font-bold text-gray-900 mb-2">{item.price}</div>
                <p className="text-sm text-gray-500">{item.desc}</p>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Driver Types */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-4xl font-bold mb-6 text-gray-900">Who We Recruit</h2>
              <p className="text-xl text-gray-500 mb-8">
                We specialize in recruiting company drivers, owner operators, and lease drivers across multiple freight types. If you need drivers for Amazon Relay, OTR, regional, or local work — we know how to find them.
              </p>

              <div className="grid sm:grid-cols-1 gap-4">
                {whatWeRecruit.map((type) => (
                  <div key={type} className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                    <span className="text-gray-700">{type}</span>
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <Card hover className="h-full">
                <div className="mb-4">
                  <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center">
                    <Truck className="w-7 h-7 text-gray-700" />
                  </div>
                </div>
                <h3 className="text-2xl font-bold mb-3 text-gray-900">Amazon Relay Owner Operators</h3>
                <p className="text-gray-500 leading-relaxed">
                  We understand the Amazon Relay program and what it takes to recruit owner operators who are compliant and ready to haul. Our recruiters know the requirements, the process, and how to find drivers who are a good fit for relay work. If your carrier is set up on Amazon and you need O/Os, we can deliver.
                </p>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Process Section */}
      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl font-bold mb-4 text-gray-900">Our Recruiting Process</h2>
          <p className="text-xl text-gray-500">From consultation to hired driver — fast and efficient</p>
        </motion.div>

        <div className="grid md:grid-cols-4 gap-8">
          {process.map((item, index) => (
            <motion.div
              key={item.step}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
            >
              <Card hover className="h-full text-center">
                <div className="text-6xl font-bold text-gray-100 mb-4">{item.step}</div>
                <h3 className="text-xl font-bold mb-2 text-gray-900">{item.title}</h3>
                <p className="text-gray-500">{item.desc}</p>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>

      {/* What We Expect From Carriers */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold mb-4 text-gray-900">What We Expect From Our Carrier Partners</h2>
            <p className="text-xl text-gray-500 max-w-3xl mx-auto">
              We deliver qualified drivers. But recruiting is a two-way street — carriers who hire fast, keep their trucks full.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: Zap, title: 'Fast Background Checks', desc: 'Run your checks quickly. A driver who waits 3-5 days for an answer is already talking to another carrier. Same-day or next-day turnaround is what wins.' },
              { icon: Clock, title: 'Quick Decision Making', desc: 'When we present a qualified driver, be ready to make a decision. Tell the driver yes or no fast. In this market, hesitation means losing the hire.' },
              { icon: TrendingUp, title: 'Competitive Offering', desc: 'Have competitive pay, clear expectations, and a straightforward onboarding process. Drivers pick the company that makes it easy to start working.' },
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
            <h2 className="text-4xl font-bold mb-4 text-gray-900">Ready to Hire Drivers?</h2>
            <p className="text-xl text-gray-500">
              Tell us what you need and we'll put together a recruiting plan for your carrier.
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
                <p className="text-gray-500">A recruiting specialist will contact you within 24 hours.</p>
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
                    label="Number of Drivers Needed"
                    type="number"
                    placeholder="5"
                    value={formData.driversNeeded}
                    onChange={(e) => setFormData({ ...formData, driversNeeded: e.target.value })}
                  />
                  <Select
                    label="Driver Type"
                    value={formData.driverType}
                    onChange={(e) => setFormData({ ...formData, driverType: e.target.value })}
                    options={[
                      { value: '', label: 'Select driver type' },
                      { value: 'company', label: 'Company Drivers' },
                      { value: 'owner-op', label: 'Owner Operators' },
                      { value: 'owner-op-amazon', label: 'Owner Operators (Amazon Relay)' },
                      { value: 'lease', label: 'Lease / Lease-to-Purchase Drivers' },
                      { value: 'team', label: 'Team Drivers' },
                      { value: 'specialized', label: 'Specialized (Hazmat, Tanker, etc.)' }
                    ]}
                  />
                </div>

                <Textarea
                  label="Additional Details"
                  placeholder="Tell us about your lanes, pay structure, home time, and what kind of drivers you're looking for..."
                  rows={4}
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                />

                {error && (
                  <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
                    {error}
                  </div>
                )}

                <Button type="submit" fullWidth size="lg" disabled={loading}>
                  {loading ? 'Submitting...' : 'Get a Recruiting Plan'}
                  {!loading && <ArrowRight className="w-5 h-5 ml-2" />}
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
            <h2 className="text-4xl font-bold mb-4 text-white">Ready to Fill Your Trucks?</h2>
            <p className="text-xl text-gray-300 mb-8">
              We work fast, we work smart, and we deliver drivers who are ready to go. Let's talk.
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

export default RecruitingServicesPage
