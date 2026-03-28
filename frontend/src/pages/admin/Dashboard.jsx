import { useQuery } from '@tanstack/react-query'
import api from '../../lib/api'

export default function SuperAdminDashboard() {
  const { data } = useQuery({ queryKey: ['admin-dashboard'], queryFn: () => api.get('/admin/dashboard').then(r => r.data) })

  const stats = data ?? {}
  const cards = [
    { label: '集團數', value: stats.tenants },
    { label: '啟用集團', value: stats.active_tenants },
    { label: '旅館數', value: stats.hotels },
    { label: '啟用旅館', value: stats.active_hotels },
    { label: '總房間數', value: stats.total_rooms },
    { label: '總訂單數', value: stats.total_reservations },
  ]

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold mb-6">跨集團彙總儀表板</h1>
      <div className="grid grid-cols-3 gap-4">
        {cards.map(({ label, value }) => (
          <div key={label} className="bg-white rounded-xl shadow p-5 border">
            <div className="text-gray-500 text-sm">{label}</div>
            <div className="text-3xl font-bold mt-1">{value ?? '—'}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
