import ReportedItemsPanel from '../components/admin/ReportedItemsPanel'

const AdminReportedItemsPage = () => (
  <div className="p-4 sm:p-8">
    <div className="max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Reported Items</h1>
        <p className="text-gray-500">Listings and equipment users have flagged for review</p>
      </div>
      <ReportedItemsPanel />
    </div>
  </div>
)

export default AdminReportedItemsPage
