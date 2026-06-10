import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Upload,
  FileText,
  CheckCircle,
  AlertCircle,
  X,
  Building,
  User,
  Mail,
  Phone,
  MapPin,
  TruckIcon,
  Shield
} from 'lucide-react'
import GlassCard from '../components/ui/GlassCard'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import Textarea from '../components/ui/Textarea'

interface UploadedFile {
  id: string
  name: string
  size: number
  type: string
  uploadedAt: Date
}

const SellerVerificationPage = () => {
  const navigate = useNavigate()
  const [currentStep, setCurrentStep] = useState(1)

  // Form data
  const [businessInfo, setBusinessInfo] = useState({
    companyName: '',
    ownerName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    mcNumber: '',
    dotNumber: '',
    yearsInBusiness: '',
    fleetSize: ''
  })

  const [uploadedFiles, setUploadedFiles] = useState<{
    businessLicense: UploadedFile[]
    insurance: UploadedFile[]
    authority: UploadedFile[]
    supporting: UploadedFile[]
  }>({
    businessLicense: [],
    insurance: [],
    authority: [],
    supporting: []
  })

  const [additionalInfo, setAdditionalInfo] = useState({
    description: '',
    specializations: '',
    servicesOffered: ''
  })

  const handleFileUpload = (category: keyof typeof uploadedFiles, event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (files) {
      const newFiles: UploadedFile[] = Array.from(files).map((file, index) => ({
        id: `${Date.now()}-${index}`,
        name: file.name,
        size: file.size,
        type: file.type,
        uploadedAt: new Date()
      }))

      setUploadedFiles(prev => ({
        ...prev,
        [category]: [...prev[category], ...newFiles]
      }))
    }
  }

  const removeFile = (category: keyof typeof uploadedFiles, fileId: string) => {
    setUploadedFiles(prev => ({
      ...prev,
      [category]: prev[category].filter(file => file.id !== fileId)
    }))
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  const handleSubmit = () => {
    alert('Verification application submitted! Our team will review your documents within 24-48 hours.')
    navigate('/seller/dashboard')
  }

  const steps = [
    { number: 1, title: 'Business Information', icon: Building },
    { number: 2, title: 'Document Upload', icon: FileText },
    { number: 3, title: 'Additional Details', icon: Shield }
  ]

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Seller Verification</h1>
          <p className="text-white/60">Complete your seller profile to start listing MC authorities</p>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={step.number} className="flex items-center flex-1">
                <div className="flex flex-col items-center flex-1">
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center mb-2 transition-colors ${
                      currentStep >= step.number
                        ? 'bg-primary-500 text-white'
                        : 'glass-subtle text-white/60'
                    }`}
                  >
                    {currentStep > step.number ? (
                      <CheckCircle className="w-6 h-6" />
                    ) : (
                      <step.icon className="w-6 h-6" />
                    )}
                  </div>
                  <div className="text-sm font-medium text-center hidden sm:block">
                    {step.title}
                  </div>
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={`h-1 flex-1 mx-2 sm:mx-4 transition-colors ${
                      currentStep > step.number ? 'bg-primary-500' : 'bg-white/10'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Step 1: Business Information */}
        {currentStep === 1 && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <GlassCard>
              <h2 className="text-2xl font-bold mb-6">Business Information</h2>

              <div className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <Input
                    label="Company Name *"
                    placeholder="Enter your company name"
                    value={businessInfo.companyName}
                    onChange={(e) => setBusinessInfo({ ...businessInfo, companyName: e.target.value })}
                    icon={<Building className="w-4 h-4" />}
                  />
                  <Input
                    label="Owner Name *"
                    placeholder="Enter owner's full name"
                    value={businessInfo.ownerName}
                    onChange={(e) => setBusinessInfo({ ...businessInfo, ownerName: e.target.value })}
                    icon={<User className="w-4 h-4" />}
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <Input
                    label="Email Address *"
                    type="email"
                    placeholder="company@example.com"
                    value={businessInfo.email}
                    onChange={(e) => setBusinessInfo({ ...businessInfo, email: e.target.value })}
                    icon={<Mail className="w-4 h-4" />}
                  />
                  <Input
                    label="Phone Number *"
                    type="tel"
                    placeholder="(555) 123-4567"
                    value={businessInfo.phone}
                    onChange={(e) => setBusinessInfo({ ...businessInfo, phone: e.target.value })}
                    icon={<Phone className="w-4 h-4" />}
                  />
                </div>

                <Input
                  label="Business Address *"
                  placeholder="Street address"
                  value={businessInfo.address}
                  onChange={(e) => setBusinessInfo({ ...businessInfo, address: e.target.value })}
                  icon={<MapPin className="w-4 h-4" />}
                />

                <div className="grid md:grid-cols-3 gap-4">
                  <Input
                    label="City *"
                    placeholder="City"
                    value={businessInfo.city}
                    onChange={(e) => setBusinessInfo({ ...businessInfo, city: e.target.value })}
                  />
                  <Input
                    label="State *"
                    placeholder="State"
                    value={businessInfo.state}
                    onChange={(e) => setBusinessInfo({ ...businessInfo, state: e.target.value })}
                  />
                  <Input
                    label="ZIP Code *"
                    placeholder="12345"
                    value={businessInfo.zipCode}
                    onChange={(e) => setBusinessInfo({ ...businessInfo, zipCode: e.target.value })}
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <Input
                    label="MC Number"
                    placeholder="Enter MC number"
                    value={businessInfo.mcNumber}
                    onChange={(e) => setBusinessInfo({ ...businessInfo, mcNumber: e.target.value })}
                    icon={<TruckIcon className="w-4 h-4" />}
                  />
                  <Input
                    label="DOT Number"
                    placeholder="Enter DOT number"
                    value={businessInfo.dotNumber}
                    onChange={(e) => setBusinessInfo({ ...businessInfo, dotNumber: e.target.value })}
                    icon={<TruckIcon className="w-4 h-4" />}
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <Input
                    label="Years in Business *"
                    type="number"
                    placeholder="5"
                    value={businessInfo.yearsInBusiness}
                    onChange={(e) => setBusinessInfo({ ...businessInfo, yearsInBusiness: e.target.value })}
                  />
                  <Input
                    label="Fleet Size *"
                    type="number"
                    placeholder="10"
                    value={businessInfo.fleetSize}
                    onChange={(e) => setBusinessInfo({ ...businessInfo, fleetSize: e.target.value })}
                  />
                </div>

                <div className="flex justify-end mt-6">
                  <Button onClick={() => setCurrentStep(2)}>
                    Next Step
                  </Button>
                </div>
              </div>
            </GlassCard>
          </motion.div>
        )}

        {/* Step 2: Document Upload */}
        {currentStep === 2 && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <GlassCard>
              <h2 className="text-2xl font-bold mb-6">Document Upload</h2>

              <div className="space-y-6">
                {/* Business License */}
                <div>
                  <label className="block text-sm font-medium mb-2">Business License *</label>
                  <div className="glass-subtle rounded-lg p-6 border-2 border-dashed border-white/20">
                    <input
                      type="file"
                      id="business-license"
                      multiple
                      accept=".pdf,.jpg,.jpeg,.png"
                      className="hidden"
                      onChange={(e) => handleFileUpload('businessLicense', e)}
                    />
                    <label
                      htmlFor="business-license"
                      className="flex flex-col items-center cursor-pointer"
                    >
                      <Upload className="w-12 h-12 text-primary-400 mb-3" />
                      <p className="text-sm font-medium mb-1">Click to upload business license</p>
                      <p className="text-xs text-white/60">PDF, JPG, PNG (Max 10MB)</p>
                    </label>
                  </div>
                  {uploadedFiles.businessLicense.length > 0 && (
                    <div className="mt-3 space-y-2">
                      {uploadedFiles.businessLicense.map((file) => (
                        <div key={file.id} className="flex items-center justify-between glass-subtle rounded-lg p-3">
                          <div className="flex items-center gap-3 min-w-0">
                            <FileText className="w-5 h-5 text-primary-400 flex-shrink-0" />
                            <div className="min-w-0">
                              <div className="text-sm font-medium truncate">{file.name}</div>
                              <div className="text-xs text-white/60">{formatFileSize(file.size)}</div>
                            </div>
                          </div>
                          <button
                            onClick={() => removeFile('businessLicense', file.id)}
                            className="p-1 hover:bg-white/10 rounded transition-colors flex-shrink-0"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Insurance Documents */}
                <div>
                  <label className="block text-sm font-medium mb-2">Insurance Documents *</label>
                  <div className="glass-subtle rounded-lg p-6 border-2 border-dashed border-white/20">
                    <input
                      type="file"
                      id="insurance"
                      multiple
                      accept=".pdf,.jpg,.jpeg,.png"
                      className="hidden"
                      onChange={(e) => handleFileUpload('insurance', e)}
                    />
                    <label htmlFor="insurance" className="flex flex-col items-center cursor-pointer">
                      <Upload className="w-12 h-12 text-primary-400 mb-3" />
                      <p className="text-sm font-medium mb-1">Click to upload insurance certificates</p>
                      <p className="text-xs text-white/60">PDF, JPG, PNG (Max 10MB each)</p>
                    </label>
                  </div>
                  {uploadedFiles.insurance.length > 0 && (
                    <div className="mt-3 space-y-2">
                      {uploadedFiles.insurance.map((file) => (
                        <div key={file.id} className="flex items-center justify-between glass-subtle rounded-lg p-3">
                          <div className="flex items-center gap-3 min-w-0">
                            <FileText className="w-5 h-5 text-primary-400 flex-shrink-0" />
                            <div className="min-w-0">
                              <div className="text-sm font-medium truncate">{file.name}</div>
                              <div className="text-xs text-white/60">{formatFileSize(file.size)}</div>
                            </div>
                          </div>
                          <button
                            onClick={() => removeFile('insurance', file.id)}
                            className="p-1 hover:bg-white/10 rounded transition-colors flex-shrink-0"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Authority Documents */}
                <div>
                  <label className="block text-sm font-medium mb-2">Authority Documents</label>
                  <div className="glass-subtle rounded-lg p-6 border-2 border-dashed border-white/20">
                    <input
                      type="file"
                      id="authority"
                      multiple
                      accept=".pdf,.jpg,.jpeg,.png"
                      className="hidden"
                      onChange={(e) => handleFileUpload('authority', e)}
                    />
                    <label htmlFor="authority" className="flex flex-col items-center cursor-pointer">
                      <Upload className="w-12 h-12 text-primary-400 mb-3" />
                      <p className="text-sm font-medium mb-1">Click to upload MC/DOT authority documents</p>
                      <p className="text-xs text-white/60">PDF, JPG, PNG (Max 10MB each)</p>
                    </label>
                  </div>
                  {uploadedFiles.authority.length > 0 && (
                    <div className="mt-3 space-y-2">
                      {uploadedFiles.authority.map((file) => (
                        <div key={file.id} className="flex items-center justify-between glass-subtle rounded-lg p-3">
                          <div className="flex items-center gap-3 min-w-0">
                            <FileText className="w-5 h-5 text-primary-400 flex-shrink-0" />
                            <div className="min-w-0">
                              <div className="text-sm font-medium truncate">{file.name}</div>
                              <div className="text-xs text-white/60">{formatFileSize(file.size)}</div>
                            </div>
                          </div>
                          <button
                            onClick={() => removeFile('authority', file.id)}
                            className="p-1 hover:bg-white/10 rounded transition-colors flex-shrink-0"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Supporting Documents */}
                <div>
                  <label className="block text-sm font-medium mb-2">Supporting Documents (Optional)</label>
                  <div className="glass-subtle rounded-lg p-6 border-2 border-dashed border-white/20">
                    <input
                      type="file"
                      id="supporting"
                      multiple
                      accept=".pdf,.jpg,.jpeg,.png"
                      className="hidden"
                      onChange={(e) => handleFileUpload('supporting', e)}
                    />
                    <label htmlFor="supporting" className="flex flex-col items-center cursor-pointer">
                      <Upload className="w-12 h-12 text-primary-400 mb-3" />
                      <p className="text-sm font-medium mb-1">Click to upload additional documents</p>
                      <p className="text-xs text-white/60">Safety reports, compliance certificates, etc.</p>
                    </label>
                  </div>
                  {uploadedFiles.supporting.length > 0 && (
                    <div className="mt-3 space-y-2">
                      {uploadedFiles.supporting.map((file) => (
                        <div key={file.id} className="flex items-center justify-between glass-subtle rounded-lg p-3">
                          <div className="flex items-center gap-3 min-w-0">
                            <FileText className="w-5 h-5 text-primary-400 flex-shrink-0" />
                            <div className="min-w-0">
                              <div className="text-sm font-medium truncate">{file.name}</div>
                              <div className="text-xs text-white/60">{formatFileSize(file.size)}</div>
                            </div>
                          </div>
                          <button
                            onClick={() => removeFile('supporting', file.id)}
                            className="p-1 hover:bg-white/10 rounded transition-colors flex-shrink-0"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Info Box */}
                <div className="glass-subtle rounded-lg p-4 flex gap-3">
                  <AlertCircle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-white/80">
                    <p className="font-semibold mb-1">Document Requirements:</p>
                    <ul className="list-disc list-inside space-y-1 text-white/60">
                      <li>All documents must be clear and legible</li>
                      <li>Documents should be current and not expired</li>
                      <li>File size should not exceed 10MB per document</li>
                      <li>Accepted formats: PDF, JPG, PNG</li>
                    </ul>
                  </div>
                </div>

                <div className="flex justify-between mt-6">
                  <Button variant="ghost" onClick={() => setCurrentStep(1)}>
                    Back
                  </Button>
                  <Button onClick={() => setCurrentStep(3)}>
                    Next Step
                  </Button>
                </div>
              </div>
            </GlassCard>
          </motion.div>
        )}

        {/* Step 3: Additional Details */}
        {currentStep === 3 && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <GlassCard>
              <h2 className="text-2xl font-bold mb-6">Additional Details</h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Business Description</label>
                  <Textarea
                    placeholder="Tell us about your business, experience, and what makes you stand out..."
                    value={additionalInfo.description}
                    onChange={(e) => setAdditionalInfo({ ...additionalInfo, description: e.target.value })}
                    rows={4}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Specializations</label>
                  <Textarea
                    placeholder="E.g., Long haul, Regional, Specialized freight, Temperature controlled..."
                    value={additionalInfo.specializations}
                    onChange={(e) => setAdditionalInfo({ ...additionalInfo, specializations: e.target.value })}
                    rows={3}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Services Offered</label>
                  <Textarea
                    placeholder="List the types of services you provide..."
                    value={additionalInfo.servicesOffered}
                    onChange={(e) => setAdditionalInfo({ ...additionalInfo, servicesOffered: e.target.value })}
                    rows={3}
                  />
                </div>

                {/* Summary */}
                <div className="mt-6 glass-subtle rounded-lg p-6">
                  <h3 className="text-lg font-bold mb-4">Application Summary</h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between gap-3">
                      <span className="text-white/60">Company Name:</span>
                      <span className="font-semibold text-right break-words min-w-0">{businessInfo.companyName || 'Not provided'}</span>
                    </div>
                    <div className="flex justify-between gap-3">
                      <span className="text-white/60">Email:</span>
                      <span className="font-semibold text-right break-all min-w-0">{businessInfo.email || 'Not provided'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/60">Business License:</span>
                      <span className={uploadedFiles.businessLicense.length > 0 ? 'text-trust-high' : 'text-red-400'}>
                        {uploadedFiles.businessLicense.length > 0 ?
                          `${uploadedFiles.businessLicense.length} file(s)` :
                          'Not uploaded'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/60">Insurance Documents:</span>
                      <span className={uploadedFiles.insurance.length > 0 ? 'text-trust-high' : 'text-red-400'}>
                        {uploadedFiles.insurance.length > 0 ?
                          `${uploadedFiles.insurance.length} file(s)` :
                          'Not uploaded'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/60">Total Documents:</span>
                      <span className="font-semibold">
                        {Object.values(uploadedFiles).reduce((sum, files) => sum + files.length, 0)} files
                      </span>
                    </div>
                  </div>
                </div>

                {/* Terms */}
                <div className="glass-subtle rounded-lg p-4 flex gap-3">
                  <input type="checkbox" id="terms" className="mt-1" />
                  <label htmlFor="terms" className="text-sm text-white/80">
                    I certify that all information provided is accurate and true. I understand that false information may result in account suspension or termination.
                  </label>
                </div>

                <div className="flex justify-between mt-6">
                  <Button variant="ghost" onClick={() => setCurrentStep(2)}>
                    Back
                  </Button>
                  <Button onClick={handleSubmit}>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Submit Application
                  </Button>
                </div>
              </div>
            </GlassCard>
          </motion.div>
        )}
      </div>
    </div>
  )
}

export default SellerVerificationPage
