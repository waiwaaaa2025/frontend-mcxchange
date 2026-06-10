import { useState } from 'react'
import { motion } from 'framer-motion'
import { FileText } from 'lucide-react'
import Card from '../components/ui/Card'
import { SellerTermsContent, BuyerTermsContent } from '../components/LegalDocumentContent'

const TermsPage = () => {
  const [activeTab, setActiveTab] = useState<'buyer' | 'seller'>('buyer')

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-3xl mx-auto"
      >
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center">
              <FileText className="w-8 h-8 text-gray-600" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Terms and Conditions</h1>
        </div>

        <div className="flex justify-center mb-6">
          <div className="flex w-full flex-col sm:inline-flex sm:w-auto sm:flex-row rounded-lg border border-gray-200 bg-white p-1 gap-1 sm:gap-0">
            <button
              onClick={() => setActiveTab('buyer')}
              className={`w-full sm:w-auto px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                activeTab === 'buyer'
                  ? 'bg-gray-900 text-white'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Buyer Terms of Service
            </button>
            <button
              onClick={() => setActiveTab('seller')}
              className={`w-full sm:w-auto px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                activeTab === 'seller'
                  ? 'bg-gray-900 text-white'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Seller User Agreement
            </button>
          </div>
        </div>

        <Card>
          {activeTab === 'seller' ? <SellerTermsContent /> : <BuyerTermsContent />}
        </Card>
      </motion.div>
    </div>
  )
}

export default TermsPage
