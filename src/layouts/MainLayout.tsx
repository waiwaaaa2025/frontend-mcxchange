import { Outlet } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import FreePulsePromoBanner from '../components/FreePulsePromoBanner'

const MainLayout = () => {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Navbar />
      {/* Add padding-top to account for fixed navbar */}
      <main className="pt-16 flex-1">
        <FreePulsePromoBanner />
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}

export default MainLayout
