import { useNavigate } from 'react-router-dom'

const BED_LABELS = { DOUBLE: '雙人床', TWIN: '雙床', SINGLE: '單人床', KING: '特大床', QUEEN: '大床' }

export default function RoomTypeCard({ rt, hotelSlug, checkIn, checkOut, availableCount }) {
  const navigate = useNavigate()
  const available = availableCount ?? null
  const sold = available === 0

  const handleBook = () => {
    const params = new URLSearchParams({ room_type_id: rt.id })
    if (checkIn) params.set('check_in', checkIn)
    if (checkOut) params.set('check_out', checkOut)
    navigate(`/hotels/${hotelSlug}/book?${params}`)
  }

  return (
    <div className={`bg-white rounded-xl border overflow-hidden flex flex-col md:flex-row shadow-sm ${sold ? 'opacity-60' : ''}`}>
      {/* Image */}
      <div className="md:w-56 h-40 md:h-auto bg-gray-100 flex-shrink-0">
        {rt.images?.[0] ? (
          <img src={rt.images[0].url} alt={rt.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-4xl text-gray-300">🛏</div>
        )}
      </div>

      {/* Details */}
      <div className="p-4 flex flex-col flex-1">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="font-semibold text-primary">{rt.name}</h3>
            <p className="text-xs text-gray-500 mt-0.5">
              {BED_LABELS[rt.bed_type] ?? rt.bed_type} · 最多 {rt.max_occupancy} 人
              {rt.has_window && ' · 有窗'}
            </p>
          </div>
          <div className="text-right flex-shrink-0">
            <div className="text-primary font-bold">NT$ {Number(rt.base_rate).toLocaleString()}</div>
            <div className="text-xs text-gray-400">/ 晚</div>
          </div>
        </div>

        {rt.description && <p className="text-xs text-gray-500 mt-2 flex-1">{rt.description}</p>}

        {/* Amenities */}
        {rt.amenities?.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {rt.amenities.slice(0, 5).map(a => (
              <span key={a.name} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">{a.name}</span>
            ))}
          </div>
        )}

        <div className="mt-3 flex items-center justify-between">
          {available !== null && (
            <span className={`text-xs ${sold ? 'text-red-500' : 'text-green-600'}`}>
              {sold ? '客滿' : `剩餘 ${available} 間`}
            </span>
          )}
          <button onClick={handleBook} disabled={sold}
            className="ml-auto px-4 py-2 text-sm bg-primary text-white rounded-lg hover:bg-primary-hover disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
            立刻訂房
          </button>
        </div>
      </div>
    </div>
  )
}
