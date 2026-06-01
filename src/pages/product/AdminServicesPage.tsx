import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  FileText,
  CheckCircle,
  Calculator,
  FileCheck,
  Folder,
  Phone,
  Mail,
  ArrowRight,
  Receipt,
  Clock,
  Building,
  Shield,
  CreditCard,
  Loader2,
  AlertCircle
} from 'lucide-react'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Textarea from '../../components/ui/Textarea'
import Select from '../../components/ui/Select'
import { api } from '../../services/api'

const AdminServicesPage = () => {
  const [formData, setFormData] = useState({
    name: '',
    company: '',
    email: '',
    phone: '',
    fleetSize: '',
    serviceType: '',
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
      await api.submitAdminServicesForm(formData)
      setSubmitted(true)
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const services = [
    {
      icon: Receipt,
      title: 'Invoicing & Billing',
      description: 'Professional invoicing services to ensure you get paid faster. We create, send, and track invoices so nothing falls through the cracks.',
      features: ['Invoice creation & delivery', 'Payment tracking', 'Collections support']
    },
    {
      icon: Calculator,
      title: 'IFTA & IRP Filing',
      description: 'Accurate fuel tax reporting and registration renewals. We handle the complex calculations so you stay compliant.',
      features: ['Quarterly IFTA filing', 'IRP renewals', 'Fuel tax calculations']
    },
    {
      icon: Folder,
      title: 'Document Management',
      description: 'Digital organization and storage of all your carrier documents. Easy access to BOLs, PODs, permits, and more.',
      features: ['Digital document storage', 'Document retrieval', 'Expiration tracking']
    },
    {
      icon: CreditCard,
      title: 'Accounts Payable/Receivable',
      description: 'Full bookkeeping services for your trucking operation. We manage your money so you can manage your trucks.',
      features: ['AP/AR management', 'Bank reconciliation', 'Financial reporting']
    }
  ]

  const additionalServices = [
    'Weekly/monthly settlement statements',
    'Permit renewals (HM, SCAC, UCR)',
    'Insurance certificate management',
    'BOC-3 filing',
    'Authority reinstatements',
    '2290 heavy vehicle tax filing',
    'MCS-150 updates',
    'Operating authority applications'
  ]

  const stats = [
    { value: '98%', label: 'Invoice collection rate' },
    { value: '48hrs', label: 'Average payment time' },
    { value: '1000+', label: 'Documents managed' },
    { value: '$0', label: 'Compliance fines' }
  ]

  const pricingPlans = [
    {
      name: 'Essential',
      price: '$199',
      description: 'per month',
      features: ['Invoicing & billing', 'Document storage', 'Basic bookkeeping', 'Email support'],
      popular: false
    },
    {
      name: 'Professional',
      price: '$399',
      description: 'per month',
      features: ['Everything in Essential', 'IFTA & IRP filing', 'Full AP/AR management', 'Priority support'],
      popular: true
    },
    {
      name: 'Enterprise',
      price: 'Custom',
      description: 'for larger fleets',
      features: ['Everything in Professional', 'Dedicated account manager', 'Custom reporting', 'API integrations'],
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
              <FileText className="w-10 h-10 text-gray-900" />
            </div>

            <h1 className="text-5xl lg:text-7xl font-bold mb-6 text-gray-900">
              Admin Services
            </h1>

            <p className="text-xl lg:text-2xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Streamline your back office operations with professional administrative support.
              Invoicing, IFTA, permits, and more - handled by experts.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="min-w-[200px]" onClick={() => document.getElementById('contact-form')?.scrollIntoView({ behavior: 'smooth' })}>
                Get Started
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
          <h2 className="text-4xl font-bold mb-4 text-gray-900">Back Office Solutions</h2>
          <p className="text-xl text-gray-500 max-w-2xl mx-auto">
            Focus on driving and growing your business. We'll handle the paperwork.
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

      {/* Additional Services */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-4xl font-bold mb-6 text-gray-900">Complete Administrative Support</h2>
              <p className="text-xl text-gray-500 mb-8">
                From day-to-day paperwork to annual filings, we handle all the administrative tasks that keep your carrier running smoothly.
              </p>

              <div className="grid sm:grid-cols-2 gap-4">
                {additionalServices.map((service) => (
                  <div key={service} className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                    <span className="text-gray-700">{service}</span>
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
                  <Clock className="w-16 h-16 text-white mx-auto mb-6" />
                  <h3 className="text-3xl font-bold text-white mb-2">Save Time Every Week</h3>
                  <p className="text-gray-300 mb-6">Stop spending hours on paperwork and let us handle it</p>
                  <div className="text-5xl font-bold text-emerald-400 mb-2">10+ Hours</div>
                  <p className="text-gray-400">Saved per week on average</p>
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
          <h2 className="text-4xl font-bold mb-4 text-gray-900">Simple, Predictable Pricing</h2>
          <p className="text-xl text-gray-500">Choose the plan that fits your operation</p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
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
            <h2 className="text-4xl font-bold mb-4 text-gray-900">Why Carriers Trust Us</h2>
            <p className="text-xl text-gray-500 max-w-2xl mx-auto">
              We understand the trucking industry and the unique administrative challenges carriers face.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: Building, title: 'Industry Expertise', desc: 'Our team specializes in trucking administration. We know IFTA, IRP, and every permit you need.' },
              { icon: Shield, title: 'Never Miss a Deadline', desc: 'We track all your renewals, filings, and deadlines so nothing slips through the cracks.' },
              { icon: FileCheck, title: 'Audit-Ready Records', desc: 'Your documents are organized and accessible. Be prepared for any audit or inspection.' }
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
            <h2 className="text-4xl font-bold mb-4 text-gray-900">Streamline Your Operations</h2>
            <p className="text-xl text-gray-500">
              Tell us about your admin needs and we'll create a customized solution.
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
                <p className="text-gray-500">An admin specialist will contact you within 24 hours.</p>
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
                    label="Service Needed"
                    value={formData.serviceType}
                    onChange={(e) => setFormData({ ...formData, serviceType: e.target.value })}
                    options={[
                      { value: '', label: 'Select a service' },
                      { value: 'invoicing', label: 'Invoicing & Billing' },
                      { value: 'ifta-irp', label: 'IFTA & IRP Filing' },
                      { value: 'documents', label: 'Document Management' },
                      { value: 'bookkeeping', label: 'Full Bookkeeping' },
                      { value: 'full-service', label: 'Full Admin Package' }
                    ]}
                  />
                </div>

                <Textarea
                  label="Tell Us About Your Needs"
                  placeholder="Describe your current administrative challenges and what services you're looking for..."
                  rows={4}
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                />

                {error && (
                  <div className="flex items-center gap-2 text-red-600 bg-red-50 p-3 rounded-lg">
                    <AlertCircle className="w-5 h-5 flex-shrink-0" />
                    <span>{error}</span>
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
                      Get a Free Consultation
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
            <h2 className="text-4xl font-bold mb-4 text-white">Stop Drowning in Paperwork</h2>
            <p className="text-xl text-gray-300 mb-8">
              Let our admin experts handle the back office so you can focus on what you do best.
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

export default AdminServicesPage
