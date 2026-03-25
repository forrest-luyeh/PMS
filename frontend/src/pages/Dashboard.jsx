import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../lib/api'
import { useNavigate } from 'react-router-dom'

const STATUS_COLORS = {
  AVAILABLE: 'bg-green-100 text-green-700',
  RESERVED:  'bg-blue-100 text-blue-700',
  OCCUPIED:  'bg-orange-100 text-orange-700',
  DIRTY:     'bg-yellow-100 text-yellow-700',
  OUT_OF_ORDER: 'bg-red-100 text-red-700',
}
const STATUS_LABELS = {
  AVAILABLE: '空淨', RESERVED: '已訂', OCCUPIED: '住中', DIRTY: '待清', OUT_OF_ORDER: '停用',
}

export default function Dashboard() {
  const navigate = useNavigate()
  const qc = useQueryClient()

  const { data: today } = useQuery({ queryKey: ['dashboard-today'], queryFn: () => api.get('/dashboard/today').then(r => r.data) })
  const { data: roomStatus } = useQuery({ queryKey: ['dashboard-rooms'], queryFn: () => api.get('/dashboard/room-status').then(r => r.data) })
  const { data: arrivals = [] } = useQuery({ queryKey: ['dashboard-arrivals'], queryFn: () => api.get('/dashboard/arrivals').then(r => r.data) })
  const { data: departures = [] } = useQuery({ queryKey: ['dashboard-departures'], queryFn: () => api.get('/dashboard/departures').then(r => r.data) })

  const checkin = useMutation({
    mutationFn: ({ id, room_id }) => api.post(`/reservations/${id}/checkin`, { room_id }),
    onSuccess: () => { qc.invalidateQueries(['dashboard-arrivals']); qc.invalidateQueries(['dashboard-rooms']); qc.invalidateQueries(['dashboard-today']) },
  })

  const checkout = useMutation({
    mutationFn: (id) => api.post(`/reservations/${id}/checkout`),
    onSuccess: () => { qc.invalidateQueries(['dashboard-departures']); qc.invalidateQueries(['dashboard-rooms']); qc.invalidateQueries(['dashboard-today']) },
  })

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-xl font-bold text-gray-900">今日儀表板</h1>

      {/* Stats cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="今日抵達" value={today?.arrivals_today ?? '-'} color="text-blue-600" />
        <StatCard label="今日退房" value={today?.departures_today ?? '-'} color="text-orange-600" />
        <StatCard label="目前住客" value={today?.current_occupied ?? '-'} color="text-green-600" />
        <StatCard label="住房率" value={today ? `${today.occupancy_rate}%` : '-'} color="text-slate-700" />
      </div>

      {/* Room status summary */}
      {roomStatus && (
        <div className="bg-white rounded-xl shadow p-4">
          <h2 className="text-sm font-semibold text-gray-700 mb-3">房態總覽</h2>
          <div className="flex flex-wrap gap-3">
            {Object.entries(roomStatus).map(([status, count]) => (
              <span key={status} className={`px-3 py-1.5 rounded-full text-xs font-medium ${STATUS_COLORS[status] || 'bg-gray-100 text-gray-600'}`}>
                {STATUS_LABELS[status] || status} · {count}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Arrivals */}
        <div className="bg-white rounded-xl shadow">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-700">今日抵達 ({arrivals.length})</h2>
            <button onClick={() => navigate('/reservations')} className="text-xs text-slate-500 hover:text-slate-700">查看全部</button>
          </div>
          <div className="divide-y divide-gray-50 max-h-72 overflow-auto">
            {arrivals.length === 0 && <p className="p-4 text-gray-400 text-sm">今日無預計抵達</p>}
            {arrivals.map(r => (
              <div key={r.id} className="px-4 py-3 flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-gray-900">{r.guest?.name ?? r.guest_name}</div>
                  <div className="text-xs text-gray-400">{r.room_type?.name ?? r.room_type_name} · {r.nights} 晚</div>
                </div>
                {r.status === 'CONFIRMED' && (
                  <button
                    onClick={() => {
                      const room_id = prompt('請輸入房號 ID（數字）')
                      if (room_id) checkin.mutate({ id: r.id, room_id: parseInt(room_id) })
                    }}
                    className="text-xs bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700">
                    Check-in
                  </button>
                )}
                {r.status === 'CHECKED_IN' && (
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-lg">已入住</span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Departures */}
        <div className="bg-white rounded-xl shadow">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-700">今日退房 ({departures.length})</h2>
            <button onClick={() => navigate('/reservations')} className="text-xs text-slate-500 hover:text-slate-700">查看全部</button>
          </div>
          <div className="divide-y divide-gray-50 max-h-72 overflow-auto">
            {departures.length === 0 && <p className="p-4 text-gray-400 text-sm">今日無預計退房</p>}
            {departures.map(r => (
              <div key={r.id} className="px-4 py-3 flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-gray-900">{r.guest?.name ?? r.guest_name}</div>
                  <div className="text-xs text-gray-400">{(r.room?.number ?? r.room_number) ? `房號 ${r.room?.number ?? r.room_number}` : (r.room_type?.name ?? r.room_type_name)}</div>
                </div>
                {r.status === 'CHECKED_IN' && (
                  <button
                    onClick={() => checkout.mutate(r.id)}
                    className="text-xs bg-orange-500 text-white px-3 py-1.5 rounded-lg hover:bg-orange-600">
                    Check-out
                  </button>
                )}
                {r.status === 'CHECKED_OUT' && (
                  <span className="text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded-lg">已退房</span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function StatCard({ label, value, color }) {
  return (
    <div className="bg-white rounded-xl shadow p-4">
      <div className="text-xs text-gray-500 mb-1">{label}</div>
      <div className={`text-3xl font-bold ${color}`}>{value}</div>
    </div>
  )
}
