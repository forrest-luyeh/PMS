import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import api from '../lib/api'

const today = () => new Date().toISOString().split('T')[0]
const tomorrow = () => {
  const d = new Date(); d.setDate(d.getDate() + 1); return d.toISOString().split('T')[0]
}

export default function BookingWidget() {
  const navigate = useNavigate()
  const [region, setRegion] = useState('')
  const [hotelSlug, setHotelSlug] = useState('')
  const [checkIn, setCheckIn] = useState(today())
  const [checkOut, setCheckOut] = useState(tomorrow())
  const [adults, setAdults] = useState(2)

  const { data: hotels = [] } = useQuery({
    queryKey: ['public-hotels'],
    queryFn: () => api.get('/hotels', { params: { tenant_slug: 'checkinn' } }).then(r => r.data),
  })

  const regions = useMemo(() => [...new Set(hotels.map(h => h.region).filter(Boolean))].sort(), [hotels])
  const filteredHotels = region ? hotels.filter(h => h.region === region) : hotels

  const handleSearch = () => {
    if (!hotelSlug) return
    navigate(`/hotels/${hotelSlug}/book?check_in=${checkIn}&check_out=${checkOut}&adults=${adults}`)
  }

  return (
    <div className="bg-white rounded-2xl shadow-xl p-4 md:p-6 w-full max-w-3xl mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Region */}
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">地區</label>
          <select value={region} onChange={e => { setRegion(e.target.value); setHotelSlug('') }}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary">
            <option value="">全部地區</option>
            {regions.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>

        {/* Hotel */}
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">旅館</label>
          <select value={hotelSlug} onChange={e => setHotelSlug(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary">
            <option value="">選擇旅館</option>
            {filteredHotels.map(h => <option key={h.slug} value={h.slug}>{h.name}</option>)}
          </select>
        </div>

        {/* Dates */}
        <div className="grid grid-cols-2 gap-2 md:col-span-1 lg:col-span-1">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">入住</label>
            <input type="date" value={checkIn} min={today()} onChange={e => setCheckIn(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">退房</label>
            <input type="date" value={checkOut} min={checkIn || today()} onChange={e => setCheckOut(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
          </div>
        </div>

        {/* Adults + CTA */}
        <div className="flex gap-2">
          <div className="flex-1">
            <label className="block text-xs font-medium text-gray-500 mb-1">人數</label>
            <select value={adults} onChange={e => setAdults(Number(e.target.value))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary">
              {[1,2,3,4].map(n => <option key={n} value={n}>{n} 人</option>)}
            </select>
          </div>
          <div className="flex items-end">
            <button onClick={handleSearch} disabled={!hotelSlug}
              className="px-5 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-hover disabled:opacity-40 disabled:cursor-not-allowed transition-colors whitespace-nowrap">
              立刻預訂
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
