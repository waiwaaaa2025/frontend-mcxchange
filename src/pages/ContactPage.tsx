import { useState } from 'react'
import { Phone, Mail, MessageSquare, ArrowRight } from 'lucide-react'
import TalkToMariaModal from '../components/TalkToMariaModal'

const PHONE_DISPLAY = '(877) 814-1807'
const PHONE_TEL = '+18778141807'
const EMAIL = 'info@domilea.com'

export default function ContactPage() {
  const [consultOpen, setConsultOpen] = useState(false)

  return (
    <div className="min-h-screen bg-white">
      <section className="bg-gradient-to-b from-slate-50 to-white px-4 py-12 sm:py-20">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-5xl">
            Contact Domilea
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-base text-slate-600 sm:text-lg">
            Questions about buying, monitoring, or growing a trucking business? Reach our team — or
            book a consultation and we'll walk you through it.
          </p>
        </div>
      </section>

      <section className="px-4 pb-16">
        <div className="mx-auto grid max-w-4xl gap-4 sm:grid-cols-3 sm:gap-6">
          {/* Call */}
          <a
            href={`tel:${PHONE_TEL}`}
            className="flex flex-col items-center rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm transition hover:border-indigo-300 hover:shadow-md"
          >
            <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50">
              <Phone className="h-6 w-6 text-indigo-600" />
            </span>
            <h2 className="mt-4 text-lg font-semibold text-slate-900">Call us</h2>
            <p className="mt-1 text-sm text-slate-500">Mon–Fri, 9am–6pm ET</p>
            <span className="mt-3 break-all font-medium text-indigo-600">{PHONE_DISPLAY}</span>
          </a>

          {/* Email */}
          <a
            href={`mailto:${EMAIL}`}
            className="flex flex-col items-center rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm transition hover:border-indigo-300 hover:shadow-md"
          >
            <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50">
              <Mail className="h-6 w-6 text-emerald-600" />
            </span>
            <h2 className="mt-4 text-lg font-semibold text-slate-900">Email us</h2>
            <p className="mt-1 text-sm text-slate-500">We reply within 1 business day</p>
            <span className="mt-3 break-all font-medium text-emerald-600">{EMAIL}</span>
          </a>

          {/* Book consultation */}
          <button
            onClick={() => setConsultOpen(true)}
            className="flex flex-col items-center rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm transition hover:border-indigo-300 hover:shadow-md"
          >
            <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-50">
              <MessageSquare className="h-6 w-6 text-purple-600" />
            </span>
            <h2 className="mt-4 text-lg font-semibold text-slate-900">Book a consultation</h2>
            <p className="mt-1 text-sm text-slate-500">Talk through your goals with our team</p>
            <span className="mt-3 inline-flex items-center gap-1 font-medium text-purple-600">
              Get started <ArrowRight className="h-4 w-4" />
            </span>
          </button>
        </div>

        <div className="mx-auto mt-10 max-w-4xl rounded-2xl bg-slate-50 p-6 text-center sm:p-8">
          <p className="text-sm text-slate-600">
            Domilea provides carrier data, AI tools, and guided support for legitimate trucking
            business opportunities. We do not sell MC or USDOT numbers.
          </p>
        </div>
      </section>

      <TalkToMariaModal isOpen={consultOpen} onClose={() => setConsultOpen(false)} />
    </div>
  )
}
