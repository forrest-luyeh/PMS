import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useSearchParams } from 'react-router-dom'
import api from '../lib/api'
import HotelCard from '../components/HotelCard'
import BrandPill from '../components/BrandPill'

const REGIONS = ['北部', '中部', '南部', '東部']

export default function Hotels() {
  const [searchParams] = useSearchParams()
  const [brand, setBrand] = useState(searchParams.get('brand'))
  const [region, setRegion] = useState(searchParams.get('region') || '')

  const { data: hotels = [], isLoading } = useQuery({
    queryKey: ['public-hotels'],
    queryFn: () => api.get('/hotels', { params: { tenant_slug: 'checkinn' } }).then(r => r.data),
  })

  const filtered = useMemo(() => hotels.filter(h =>
    (!brand || h.brand_slug === brand) &&
    (!region || h.region === region)
  ), [hotels, brand, region])

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="text-2xl font-bold text-primary mb-6">全部旅館</h1>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4 mb-8">
        <BrandPill selected={brand} onChange={setBrand} />
        <select value={region} onChange={e => setRegion(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary">
          <option value="">全部地區</option>
          {REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
        </select>
        <span className="text-sm text-gray-400 ml-auto">{filtered.length} 間旅館</span>
      </div>

      {isLoading && <p className="text-gray-400 text-center py-20">載入中...</p>}

      {!isLoading && filtered.length === 0 && (
        <p className="text-center text-gray-400 py-20">無符合條件的旅館</p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {filtered.map(h => <HotelCard key={h.id} hotel={h} />)}
      </div>
    </div>
  )
}
