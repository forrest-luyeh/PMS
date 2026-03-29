import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import Home from './pages/Home'
import Hotels from './pages/Hotels'
import HotelDetail from './pages/HotelDetail'
import BookingForm from './pages/BookingForm'
import BookingConfirm from './pages/BookingConfirm'
import BookingLookup from './pages/BookingLookup'
import ContentList from './pages/ContentList'
import ContentDetail from './pages/ContentDetail'
import About from './pages/About'
import AboutPolicy from './pages/AboutPolicy'
import AboutSelfCheckin from './pages/AboutSelfCheckin'

const qc = new QueryClient({ defaultOptions: { queries: { retry: 1, staleTime: 30000 } } })

export default function App() {
  return (
    <QueryClientProvider client={qc}>
      <BrowserRouter>
        <div className="min-h-screen flex flex-col">
          <Navbar />
          <main className="flex-1">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/hotels" element={<Hotels />} />
              <Route path="/hotels/:slug" element={<HotelDetail />} />
              <Route path="/hotels/:slug/book" element={<BookingForm />} />
              <Route path="/booking/confirm/:code" element={<BookingConfirm />} />
              <Route path="/booking/lookup" element={<BookingLookup />} />
              <Route path="/activities" element={<ContentList type="activity" />} />
              <Route path="/news" element={<ContentList type="news" />} />
              <Route path="/traveler" element={<ContentList type="traveler" />} />
              <Route path="/posts/:slug" element={<ContentDetail />} />
              <Route path="/about" element={<About />} />
              <Route path="/about/policy" element={<AboutPolicy />} />
              <Route path="/about/self-checkin" element={<AboutSelfCheckin />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </BrowserRouter>
    </QueryClientProvider>
  )
}
