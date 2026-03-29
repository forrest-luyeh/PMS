import { Link } from 'react-router-dom'

const BRAND_COLORS = {
  select:  'bg-amber-100 text-amber-800',
  hotel:   'bg-blue-100 text-blue-800',
  express: 'bg-green-100 text-green-700',
}

const BRAND_LABELS = {
  select:  '藏居 SELECT',
  hotel:   '旅館 HOTEL',
  express: '快捷 EXPRESS',
}

export default function HotelCard({ hotel }) {
  const brandColor = BRAND_COLORS[hotel.brand_slug] ?? 'bg-gray-100 text-gray-700'
  const brandLabel = BRAND_LABELS[hotel.brand_slug] ?? hotel.brand_name

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow group">
      {/* Image */}
      <div className="h-44 bg-gray-200 relative overflow-hidden">
        {hotel.images?.[0] ? (
          <img src={hotel.images[0].url} alt={hotel.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400 text-4xl">🏨</div>
        )}
        <span className={`absolute top-2 left-2 text-xs px-2 py-0.5 rounded-full font-medium ${brandColor}`}>
          {brandLabel}
        </span>
      </div>

      {/* Info */}
      <div className="p-4">
        <h3 className="font-semibold text-primary text-sm mb-1">{hotel.name}</h3>
        <p className="text-xs text-gray-500 mb-1">{hotel.region} · {hotel.address}</p>
        {hotel.check_in_time && (
          <p className="text-xs text-gray-400">入住 {hotel.check_in_time} / 退房 {hotel.check_out_time}</p>
        )}
        <Link to={`/hotels/${hotel.slug}`}
          className="mt-3 block text-center py-2 text-xs bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors">
          查看詳情
        </Link>
      </div>
    </div>
  )
}
