import { useState } from 'react'
import { motion } from 'framer-motion'
import api from '../../services/api'
import {
  Shield,
  CheckCircle,
  FileCheck,
  AlertTriangle,
  Users,
  Phone,
  Mail,
  ArrowRight,
  BookOpen,
  Award,
  Eye,
  Monitor,
  Fuel,
  FileText,
  Building,
  Scale,
  Headphones,
  Database,
  GraduationCap,
  Stamp,
  AlertCircle
} from 'lucide-react'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Textarea from '../../components/ui/Textarea'
import Select from '../../components/ui/Select'

const SafetyServicesPage = () => {
  const [formData, setFormData] = useState({
    name: '',
    company: '',
    email: '',
    phone: '',
    mcNumber: '',
    serviceType: '',
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
      await api.submitSafetyForm(formData)
      setSubmitted(true)
    } catch (err: any) {
      setError(err.message || 'Failed to submit. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // Compliance & Operations Services
  const complianceServices = [
    {
      icon: Monitor,
      title: '24/7 ELD Monitoring & Support',
      description: 'Round-the-clock electronic logging device monitoring and support to ensure your drivers stay compliant with Hours of Service regulations.',
      features: ['Real-time monitoring', 'HOS violation alerts', 'Driver support hotline']
    },
    {
      icon: Fuel,
      title: 'IFTA Fuel Tax Reporting',
      description: 'Accurate quarterly IFTA fuel tax calculations and filings. We handle the complex multi-state reporting so you don\'t have to.',
      features: ['Quarterly filings', 'Multi-state calculations', 'Audit support']
    },
    {
      icon: Scale,
      title: 'Highway Use Tax Filing',
      description: 'Form 2290 heavy vehicle use tax preparation and filing for all your qualified highway motor vehicles.',
      features: ['Form 2290 filing', 'Schedule 1 stamped copies', 'IRS correspondence']
    },
    {
      icon: FileCheck,
      title: 'Permits & Licensing Assistance',
      description: 'Complete permit and licensing services including oversize/overweight permits, trip permits, and state registrations.',
      features: ['OS/OW permits', 'Trip permits', 'State registrations']
    },
    {
      icon: Database,
      title: 'IRP Account Setup & Maintenance',
      description: 'International Registration Plan account setup, renewals, and fleet additions. Keep your apportioned plates current.',
      features: ['New IRP accounts', 'Annual renewals', 'Fleet changes']
    },
    {
      icon: Building,
      title: 'Articles of Incorporation',
      description: 'Business formation assistance in all 50 states including articles of incorporation, LLC formation, and registered agent services.',
      features: ['All 50 states', 'LLC formation', 'Registered agent']
    }
  ]

  // Safety & Driver Management Services
  const safetyServices = [
    {
      icon: Eye,
      title: 'FMCSA Scores Monitoring',
      description: 'Continuous monitoring of your SMS scores and BASIC categories. Get alerts when scores change and strategies to improve.',
      features: ['SMS monitoring', 'Score alerts', 'Improvement strategies']
    },
    {
      icon: AlertCircle,
      title: 'DataQ Challenges & Compliance',
      description: 'Expert assistance with DataQs challenges to remove or correct inaccurate violations from your safety record.',
      features: ['Violation review', 'DataQs filing', 'Success tracking']
    },
    {
      icon: Users,
      title: 'Driver Qualification (DQ) File Management',
      description: 'Complete DQ file management including applications, MVRs, medical cards, drug tests, and all required documentation.',
      features: ['Document tracking', 'Expiration alerts', 'Audit-ready files']
    },
    {
      icon: GraduationCap,
      title: 'Driver Orientation & Training Programs',
      description: 'Comprehensive driver orientation and ongoing training programs covering DOT regulations, safety procedures, and company policies.',
      features: ['Orientation programs', 'Online training', 'Certification tracking']
    }
  ]

  // Administrative Support Services
  const adminServices = [
    {
      icon: Stamp,
      title: 'Document Notarization',
      description: 'Professional notarization services for all your trucking documents including BOC-3s, powers of attorney, and corporate documents.',
      features: ['Remote notarization', 'Same-day service', 'All document types']
    },
    {
      icon: Shield,
      title: 'Claims Management & Resolution',
      description: 'Expert handling of cargo claims, accident claims, and insurance disputes to protect your business and minimize losses.',
      features: ['Cargo claims', 'Accident claims', 'Insurance disputes']
    }
  ]

  const allAdditionalServices = [
    '24/7 ELD Monitoring & Support',
    'Safety & Recruiting Services',
    'IFTA Fuel Tax Reporting',
    'Highway Use Tax Filing',
    'Permits & Licensing Assistance',
    'IRP Account Setup & Maintenance',
    'Articles of Incorporation (All States)',
    'FMCSA Scores Monitoring',
    'DataQ Challenges & Compliance Assistance',
    'Driver Qualification (DQ) File Management',
    'Driver Orientation & Training Programs',
    'Document Notarization',
    'Claims Management & Resolution Services'
  ]

  const stats = [
    { value: '99%', label: 'Audit pass rate' },
    { value: '500+', label: 'Carriers managed' },
    { value: '15+', label: 'Years experience' },
    { value: '24/7', label: 'Support available' }
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
              <Shield className="w-10 h-10 text-gray-900" />
            </div>

            <h1 className="text-5xl lg:text-7xl font-bold mb-6 text-gray-900">
              Safety Services
            </h1>

            <p className="text-xl lg:text-2xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Comprehensive DOT compliance and safety management solutions
              to protect your authority and keep your trucks on the road.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="min-w-[200px]" onClick={() => document.getElementById('contact-form')?.scrollIntoView({ behavior: 'smooth' })}>
                Get a Safety Audit
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

      {/* Warning Banner */}
      <section className="py-8 bg-amber-50 border-y border-amber-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center gap-4">
            <AlertTriangle className="w-6 h-6 text-amber-600 flex-shrink-0" />
            <p className="text-amber-800 text-center">
              <strong>Don't risk your authority.</strong> Non-compliance can result in fines up to $16,000 per violation and out-of-service orders.
            </p>
          </div>
        </div>
      </section>

      {/* Compliance & Operations Section */}
      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl font-bold mb-4 text-gray-900">Compliance & Operations</h2>
          <p className="text-xl text-gray-500 max-w-2xl mx-auto">
            Stay compliant with all regulatory requirements. We handle the paperwork so you can focus on driving.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {complianceServices.map((service, index) => (
            <motion.div
              key={service.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.05 }}
            >
              <Card hover className="h-full">
                <div className="mb-6">
                  <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center">
                    <service.icon className="w-7 h-7 text-gray-700" />
                  </div>
                </div>

                <h3 className="text-xl font-bold mb-3 text-gray-900">{service.title}</h3>
                <p className="text-gray-500 mb-6 text-sm">{service.description}</p>

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

      {/* Safety & Driver Management Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold mb-4 text-gray-900">Safety & Driver Management</h2>
            <p className="text-xl text-gray-500 max-w-2xl mx-auto">
              Protect your authority and build a culture of safety with our comprehensive driver management services.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-8">
            {safetyServices.map((service, index) => (
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

                  <h3 className="text-xl font-bold mb-3 text-gray-900">{service.title}</h3>
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
        </div>
      </section>

      {/* Administrative Support Section */}
      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl font-bold mb-4 text-gray-900">Administrative Support</h2>
          <p className="text-xl text-gray-500 max-w-2xl mx-auto">
            Professional back-office support to keep your operation running smoothly.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {adminServices.map((service, index) => (
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

                <h3 className="text-xl font-bold mb-3 text-gray-900">{service.title}</h3>
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

      {/* All Services Summary */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-4xl font-bold mb-6 text-gray-900">Drive Your Business Forward With Confidence</h2>
              <p className="text-xl text-gray-500 mb-8">
                From compliance to operations, we provide all the services your trucking business needs to succeed.
              </p>

              <div className="grid sm:grid-cols-2 gap-3">
                {allAdditionalServices.map((service) => (
                  <div key={service} className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                    <span className="text-gray-700 text-sm">{service}</span>
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
                  <Award className="w-16 h-16 text-white mx-auto mb-6" />
                  <h3 className="text-3xl font-bold text-white mb-2">Satisfactory Rating Guaranteed</h3>
                  <p className="text-gray-300 mb-6">Pass your DOT audit or we'll work with you until you do</p>
                  <div className="text-5xl font-bold text-emerald-400 mb-2">99%</div>
                  <p className="text-gray-400">Of our clients pass their audits on the first try</p>
                </div>
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
          <h2 className="text-4xl font-bold mb-4 text-gray-900">Our Process</h2>
          <p className="text-xl text-gray-500">How we help you achieve and maintain compliance</p>
        </motion.div>

        <div className="grid md:grid-cols-4 gap-8">
          {[
            { step: '01', title: 'Assessment', desc: 'We review your current compliance status and identify any gaps or issues.' },
            { step: '02', title: 'Plan', desc: 'We create a customized compliance plan based on your specific needs.' },
            { step: '03', title: 'Implement', desc: 'We help you implement the necessary changes and documentation.' },
            { step: '04', title: 'Monitor', desc: 'We continuously monitor your compliance and alert you to any issues.' }
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
                <h3 className="text-xl font-bold mb-2 text-gray-900">{item.title}</h3>
                <p className="text-gray-500">{item.desc}</p>
              </Card>
            </motion.div>
          ))}
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
            <h2 className="text-4xl font-bold mb-4 text-gray-900">Request a Safety Consultation</h2>
            <p className="text-xl text-gray-500">
              Get a free compliance assessment and learn how we can help protect your authority.
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
                <p className="text-gray-500">A safety specialist will contact you within 24 hours.</p>
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
                    label="MC Number"
                    placeholder="MC-123456"
                    value={formData.mcNumber}
                    onChange={(e) => setFormData({ ...formData, mcNumber: e.target.value })}
                  />
                  <Select
                    label="Service Needed"
                    value={formData.serviceType}
                    onChange={(e) => setFormData({ ...formData, serviceType: e.target.value })}
                    options={[
                      { value: '', label: 'Select a service' },
                      { value: 'eld-monitoring', label: 'ELD Monitoring & Support' },
                      { value: 'ifta', label: 'IFTA Fuel Tax Reporting' },
                      { value: 'highway-tax', label: 'Highway Use Tax Filing' },
                      { value: 'permits', label: 'Permits & Licensing' },
                      { value: 'irp', label: 'IRP Account Setup' },
                      { value: 'fmcsa-scores', label: 'FMCSA Scores Monitoring' },
                      { value: 'dataq', label: 'DataQ Challenges' },
                      { value: 'dq-files', label: 'DQ File Management' },
                      { value: 'training', label: 'Driver Training Programs' },
                      { value: 'claims', label: 'Claims Management' },
                      { value: 'full-service', label: 'Full Service Package' }
                    ]}
                  />
                </div>

                <Textarea
                  label="Tell Us About Your Needs"
                  placeholder="Describe your current compliance situation and any upcoming audits..."
                  rows={4}
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                />

                <Button type="submit" fullWidth size="lg">
                  Request Free Consultation
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
            <h2 className="text-4xl font-bold mb-4 text-white">Protect Your Authority Today</h2>
            <p className="text-xl text-gray-300 mb-8">
              Don't wait for a compliance issue. Contact us now for a free assessment.
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

export default SafetyServicesPage
