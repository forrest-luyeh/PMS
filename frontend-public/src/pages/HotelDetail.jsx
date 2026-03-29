import { useState } from 'react'
import { useParams, useSearchParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import api from '../lib/api'
import RoomTypeCard from '../components/RoomTypeCard'

export default function HotelDetail() {
  const { slug } = useParams()
  const [searchParams] = useSearchParams()
  const checkIn = searchParams.get('check_in') || ''
  const checkOut = searchParams.get('check_out') || ''
  const [imgIdx, setImgIdx] = useState(0)

  const { data: hotel, isLoading: loadingHotel } = useQuery({
    queryKey: ['public-hotel', slug],
    queryFn: () => api.get(`/hotels/${slug}`).then(r => r.data),
  })

  const { data: roomTypes = [] } = useQuery({
    queryKey: ['public-room-types', slug],
    queryFn: () => api.get(`/hotels/${slug}/room-types`).then(r => r.data),
  })

  const { data: availability = [] } = useQuery({
    queryKey: ['public-availability', slug, checkIn, checkOut],
    queryFn: () => api.get(`/hotels/${slug}/availability`, { params: { check_in: checkIn, check_out: checkOut } }).then(r => r.data),
    enabled: !!(checkIn && checkOut),
  })

  const availMap = Object.fromEntries(availability.map(a => [a.room_type_id, a.available_count]))

  if (loadingHotel) return <div className="text-center py-20 text-gray-400">載入中...</div>
  if (!hotel) return <div className="text-center py-20 text-gray-500">找不到旅館</div>

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Breadcrumb */}
      <nav className="text-xs text-gray-400 mb-4">
        <Link to="/" className="hover:text-primary">首頁</Link>
        <span className="mx-1">/</span>
        <Link to="/hotels" className="hover:text-primary">旅館</Link>
        <span className="mx-1">/</span>
        <span className="text-gray-600">{hotel.name}</span>
      </nav>

      {/* Images */}
      {hotel.images?.length > 0 && (
        <div className="mb-6">
          <div className="h-72 md:h-96 rounded-xl overflow-hidden bg-gray-200">
            <img src={hotel.images[imgIdx].url} alt={hotel.name} className="w-full h-full object-cover" />
          </div>
          {hotel.images.length > 1 && (
            <div className="flex gap-2 mt-2 overflow-x-auto pb-1">
              {hotel.images.map((img, i) => (
                <button key={i} onClick={() => setImgIdx(i)}
                  className={`flex-shrink-0 w-16 h-12 rounded overflow-hidden border-2 transition-colors
                    ${imgIdx === i ? 'border-primary' : 'border-transparent'}`}>
                  <img src={img.url} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Info */}
      <div className="grid md:grid-cols-3 gap-6 mb-8">
        <div className="md:col-span-2">
          <h1 className="text-2xl font-bold text-primary mb-1">{hotel.name}</h1>
          <p className="text-sm text-gray-500 mb-3">{hotel.brand_name} · {hotel.region}</p>
          {hotel.description && (
            <p className="text-sm text-gray-700 leading-relaxed mb-3">{hotel.description}</p>
          )}
          {hotel.address && <p className="text-sm text-gray-600 mb-1">📍 {hotel.address}</p>}
          {hotel.phone && <p className="text-sm text-gray-600 mb-1">📞 {hotel.phone}</p>}
          {hotel.check_in_time && (
            <p className="text-sm text-gray-600">
              🕐 入住 {hotel.check_in_time} / 退房 {hotel.check_out_time}
            </p>
          )}
        </div>

        {/* Quick booking */}
        <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
          <p className="text-xs font-medium text-gray-500 mb-2">快速訂房</p>
          <div className="space-y-2">
            <input type="date" defaultValue={checkIn}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="入住日期"
              onChange={e => {
                const url = new URL(window.location)
                url.searchParams.set('check_in', e.target.value)
                window.history.replaceState(null, '', url)
              }} />
            <input type="date" defaultValue={checkOut}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="退房日期"
              onChange={e => {
                const url = new URL(window.location)
                url.searchParams.set('check_out', e.target.value)
                window.history.replaceState(null, '', url)
              }} />
          </div>
        </div>
      </div>

      {/* Amenities */}
      {hotel.amenities?.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-primary mb-3">旅館設施</h2>
          <div className="flex flex-wrap gap-2">
            {hotel.amenities.map(a => (
              <span key={a.name} className="bg-gray-100 text-gray-700 text-xs px-3 py-1.5 rounded-full">{a.name}</span>
            ))}
          </div>
        </div>
      )}

      {/* Room types */}
      <div>
        <h2 className="text-lg font-semibold text-primary mb-4">房型選擇</h2>
        {roomTypes.length === 0 && <p className="text-gray-400 text-sm">暫無可用房型</p>}
        <div className="space-y-4">
          {roomTypes.map(rt => (
            <RoomTypeCard key={rt.id} rt={rt} hotelSlug={slug}
              checkIn={checkIn} checkOut={checkOut}
              availableCount={checkIn && checkOut ? (availMap[rt.id] ?? null) : null} />
          ))}
        </div>
      </div>
    </div>
  )
}
