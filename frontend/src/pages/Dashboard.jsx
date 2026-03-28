import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import api from '../lib/api'

const STATUS_COLORS = {
  AVAILABLE:    'bg-green-100 text-green-700',
  RESERVED:     'bg-blue-100 text-blue-700',
  OCCUPIED:     'bg-orange-100 text-orange-700',
  DIRTY:        'bg-yellow-100 text-yellow-700',
  OUT_OF_ORDER: 'bg-red-100 text-red-700',
}
const STATUS_LABELS = {
  AVAILABLE: '空淨', RESERVED: '已訂', OCCUPIED: '住中', DIRTY: '待清', OUT_OF_ORDER: '停用',
}

const HOTEL_MGMT_ROLES = ['TENANT_ADMIN', 'BRAND_ADMIN']

export default function Dashboard() {
  const { user, hotelCtx, switchHotel } = useAuth()
  const navigate = useNavigate()
  const qc = useQueryClient()

  const isHotelMgmt = HOTEL_MGMT_ROLES.includes(user?.role)
  const [selectedBrandId, setSelectedBrandId] = useState(null)
  const [selectedHotelId, setSelectedHotelId] = useState(
    isHotelMgmt && hotelCtx?.hotel_id ? hotelCtx.hotel_id : null
  )

  // ── 品牌 / 旅館清單
  const { data: brands = [] } = useQuery({
    queryKey: ['admin-brands'],
    queryFn: () => api.get('/admin/brands').then(r => r.data),
    enabled: isHotelMgmt,
  })
  const { data: allHotels = [] } = useQuery({
    queryKey: ['admin-hotels'],
    queryFn: () => api.get('/admin/hotels').then(r => r.data),
    enabled: isHotelMgmt,
  })

  // ── 彙總儀表板（層次 0 / 1）
  const aggParams = selectedBrandId ? `?brand_id=${selectedBrandId}` : ''
  const { data: agg } = useQuery({
    queryKey: ['agg-dashboard', selectedBrandId],
    queryFn: () => api.get(`/admin/aggregate-dashboard${aggParams}`).then(r => r.data),
    enabled: isHotelMgmt && !selectedHotelId,
  })

  // ── 單館今日資料（層次 2）
  const hasHotel = !!selectedHotelId && hotelCtx?.hotel_id === selectedHotelId
  const { data: today }         = useQuery({ queryKey: ['dashboard-today'],      queryFn: () => api.get('/dashboard/today').then(r => r.data),        enabled: hasHotel })
  const { data: roomStatus }    = useQuery({ queryKey: ['dashboard-rooms'],      queryFn: () => api.get('/dashboard/room-status').then(r => r.data),  enabled: hasHotel })
  const { data: arrivals = [] } = useQuery({ queryKey: ['dashboard-arrivals'],   queryFn: () => api.get('/dashboard/arrivals').then(r => r.data),     enabled: hasHotel })
  const { data: departures = []}= useQuery({ queryKey: ['dashboard-departures'], queryFn: () => api.get('/dashboard/departures').then(r => r.data),   enabled: hasHotel })

  // ── 一般角色（無 hotel mgmt）
  const { data: stdToday }      = useQuery({ queryKey: ['dashboard-today'],      queryFn: () => api.get('/dashboard/today').then(r => r.data),        enabled: !isHotelMgmt })
  const { data: stdRoomStatus } = useQuery({ queryKey: ['dashboard-rooms'],      queryFn: () => api.get('/dashboard/room-status').then(r => r.data),  enabled: !isHotelMgmt })
  const { data: stdArrivals = []}   = useQuery({ queryKey: ['dashboard-arrivals'],   queryFn: () => api.get('/dashboard/arrivals').then(r => r.data),   enabled: !isHotelMgmt })
  const { data: stdDepartures = []} = useQuery({ queryKey: ['dashboard-departures'], queryFn: () => api.get('/dashboard/departures').then(r => r.data), enabled: !isHotelMgmt })

  const checkin = useMutation({
    mutationFn: ({ id, room_id }) => api.post(`/reservations/${id}/checkin`, { room_id }),
    onSuccess: () => { qc.invalidateQueries(['dashboard-arrivals']); qc.invalidateQueries(['dashboard-rooms']); qc.invalidateQueries(['dashboard-today']) },
  })
  const checkout = useMutation({
    mutationFn: (id) => api.post(`/reservations/${id}/checkout`),
    onSuccess: () => { qc.invalidateQueries(['dashboard-departures']); qc.invalidateQueries(['dashboard-rooms']); qc.invalidateQueries(['dashboard-today']) },
  })

  const handleBrandChange = (e) => {
    const bid = e.target.value ? Number(e.target.value) : null
    setSelectedBrandId(bid)
    setSelectedHotelId(null)
  }

  const handleHotelChange = async (e) => {
    const hid = e.target.value ? Number(e.target.value) : null
    setSelectedHotelId(hid)
    if (hid) {
      try { await switchHotel(hid); qc.invalidateQueries() }
      catch { alert('切換失敗') }
    }
  }

  const brandHotels = selectedBrandId ? allHotels.filter(h => h.brand_id === selectedBrandId) : allHotels
  const currentHotel = allHotels.find(h => h.id === selectedHotelId)
  const currentBrand = selectedBrandId
    ? brands.find(b => b.id === selectedBrandId)
    : (currentHotel ? brands.find(b => b.id === currentHotel.brand_id) : null)

  // ── 一般帳號（ADMIN, FRONT_DESK 等）
  if (!isHotelMgmt) {
    return (
      <div className="p-6 space-y-6">
        <h1 className="text-xl font-bold text-gray-900">今日儀表板</h1>
        <StatsGrid today={stdToday} />
        <RoomStatusBar roomStatus={stdRoomStatus} />
        <ArrivalsDepartures
          arrivals={stdArrivals} departures={stdDepartures}
          onCheckin={(id, room_id) => checkin.mutate({ id, room_id })}
          onCheckout={(id) => checkout.mutate(id)}
          onNavigate={() => navigate('/reservations')}
        />
      </div>
    )
  }

  // ── TENANT_ADMIN / BRAND_ADMIN
  const viewHotels = selectedBrandId ? allHotels.filter(h => h.brand_id === selectedBrandId) : allHotels

  // 顯示的彙總資料（層次 0 / 1）
  const showAgg = !selectedHotelId
  const aggToday = agg?.today
  const aggRoomStatus = agg?.room_status
  const aggArrivals = agg?.arrivals ?? []
  const aggDepartures = agg?.departures ?? []

  // 層次 0 標題
  const title = selectedHotelId
    ? currentHotel?.name ?? '—'
    : selectedBrandId
      ? currentBrand?.name ?? '—'
      : '集團總覽'

  return (
    <div className="p-6 space-y-6">
      {/* 下拉選擇器 */}
      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <label className="text-xs text-gray-500 shrink-0">品牌</label>
          <select value={selectedBrandId ?? ''} onChange={handleBrandChange}
            className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm text-gray-700 bg-white focus:outline-none focus:ring-1 focus:ring-slate-400">
            <option value="">全部品牌</option>
            {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs text-gray-500 shrink-0">旅館</label>
          <select value={selectedHotelId ?? ''} onChange={handleHotelChange}
            className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm text-gray-700 bg-white focus:outline-none focus:ring-1 focus:ring-slate-400 min-w-44">
            <option value="">— 全部旅館 —</option>
            {brandHotels.map(h => (
              <option key={h.id} value={h.id} disabled={!h.is_active}>
                {h.name}{!h.is_active ? ' (停用)' : ''}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 標題 */}
      <div className="flex items-center gap-2">
        {selectedHotelId && <span className="text-base">📍</span>}
        <h1 className="text-xl font-bold text-gray-900">{title}</h1>
        {currentBrand && selectedHotelId && (
          <span className="text-sm text-gray-400">{currentBrand.name}</span>
        )}
      </div>

      {/* 層次 0：集團統計摘要（品牌卡片） */}
      {!selectedBrandId && !selectedHotelId && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {brands.map(b => {
            const bHotels = allHotels.filter(h => h.brand_id === b.id)
            return (
              <div key={b.id} data-testid="brand-card" className="bg-white rounded-xl shadow px-5 py-4 flex items-center justify-between">
                <div>
                  <div className="font-semibold text-gray-800 text-sm">{b.name}</div>
                  <div className="text-xs text-gray-400 mt-0.5">{b.slug}</div>
                </div>
                <div className="text-right text-sm">
                  <div><strong className="text-gray-900">{bHotels.length}</strong> <span className="text-gray-400 text-xs">間</span></div>
                  <div className="text-green-600 text-xs">{bHotels.filter(h => h.is_active).length} 啟用</div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* 層次 1：品牌旅館卡片 */}
      {selectedBrandId && !selectedHotelId && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {viewHotels.map(h => (
            <div key={h.id} data-testid="hotel-card" className="bg-white rounded-xl shadow-sm border border-gray-100 px-4 py-3 flex items-center justify-between">
              <div className="min-w-0">
                <div className="font-medium text-gray-900 text-sm truncate">{h.name}</div>
                <div className="text-xs text-gray-400 flex gap-1 mt-0.5">
                  {h.region && <span className="bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">{h.region}</span>}
                  <span className="truncate">{h.address || '—'}</span>
                </div>
              </div>
              <span className={`text-xs px-2 py-0.5 rounded-full shrink-0 ml-2 ${h.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                {h.is_active ? '啟用' : '停用'}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* 統計卡片（層次 0/1 用彙總，層次 2 用單館） */}
      {showAgg ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="旅館數"   value={viewHotels.length}                              color="text-slate-700" />
          <StatCard label="今日抵達" value={aggToday?.arrivals_today ?? '-'}                color="text-blue-600" />
          <StatCard label="今日退房" value={aggToday?.departures_today ?? '-'}              color="text-orange-600" />
          <StatCard label="住房率"   value={aggToday ? `${aggToday.occupancy_rate}%` : '-'} color="text-green-600" />
        </div>
      ) : (
        hasHotel && <StatsGrid today={today} />
      )}

      {/* 房態總覽 */}
      {showAgg
        ? aggRoomStatus && <RoomStatusBar roomStatus={aggRoomStatus} />
        : hasHotel && roomStatus && <RoomStatusBar roomStatus={roomStatus} />
      }

      {/* 抵達 / 退房列表 */}
      {showAgg ? (
        <AggArrivalsDepartures arrivals={aggArrivals} departures={aggDepartures} onNavigate={() => navigate('/reservations')} />
      ) : (
        hasHotel && (
          <ArrivalsDepartures
            arrivals={arrivals} departures={departures}
            onCheckin={(id, room_id) => checkin.mutate({ id, room_id })}
            onCheckout={(id) => checkout.mutate(id)}
            onNavigate={() => navigate('/reservations')}
          />
        )
      )}
    </div>
  )
}

// ── 共用元件 ──────────────────────────────────────────────

function StatCard({ label, value, color }) {
  return (
    <div className="bg-white rounded-xl shadow p-4">
      <div className="text-xs text-gray-500 mb-1">{label}</div>
      <div className={`text-3xl font-bold ${color}`}>{value}</div>
    </div>
  )
}

function StatsGrid({ today }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard label="今日抵達" value={today?.arrivals_today ?? '-'}   color="text-blue-600" />
      <StatCard label="今日退房" value={today?.departures_today ?? '-'} color="text-orange-600" />
      <StatCard label="目前住客" value={today?.current_occupied ?? '-'} color="text-green-600" />
      <StatCard label="住房率"   value={today ? `${today.occupancy_rate}%` : '-'} color="text-slate-700" />
    </div>
  )
}

function RoomStatusBar({ roomStatus }) {
  return (
    <div className="bg-white rounded-xl shadow p-4">
      <h2 className="text-sm font-semibold text-gray-700 mb-3">房態總覽</h2>
      <div className="flex flex-wrap gap-3">
        {Object.entries(roomStatus).map(([status, count]) => (
          <span key={status} className={`px-3 py-1.5 rounded-full text-xs font-medium ${
            { AVAILABLE: 'bg-green-100 text-green-700', RESERVED: 'bg-blue-100 text-blue-700',
              OCCUPIED: 'bg-orange-100 text-orange-700', DIRTY: 'bg-yellow-100 text-yellow-700',
              OUT_OF_ORDER: 'bg-red-100 text-red-700' }[status] || 'bg-gray-100 text-gray-600'}`}>
            {{ AVAILABLE: '空淨', RESERVED: '已訂', OCCUPIED: '住中', DIRTY: '待清', OUT_OF_ORDER: '停用' }[status] || status} · {count}
          </span>
        ))}
      </div>
    </div>
  )
}

// 單館版：有 check-in / check-out 按鈕
function ArrivalsDepartures({ arrivals, departures, onCheckin, onCheckout, onNavigate }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <ListCard title={`今日抵達 (${arrivals.length})`} onNavigate={onNavigate}>
        {arrivals.length === 0 && <Empty text="今日無預計抵達" />}
        {arrivals.map(r => (
          <div key={r.id} className="px-4 py-3 flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-gray-900">{r.guest?.name ?? r.guest_name}</div>
              <div className="text-xs text-gray-400">{r.room_type?.name ?? r.room_type_name} · {r.nights} 晚</div>
            </div>
            {r.status === 'CONFIRMED' && (
              <button onClick={() => { const rid = prompt('請輸入房號 ID（數字）'); if (rid) onCheckin(r.id, parseInt(rid)) }}
                className="text-xs bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700">Check-in</button>
            )}
            {r.status === 'CHECKED_IN' && (
              <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-lg">已入住</span>
            )}
          </div>
        ))}
      </ListCard>
      <ListCard title={`今日退房 (${departures.length})`} onNavigate={onNavigate}>
        {departures.length === 0 && <Empty text="今日無預計退房" />}
        {departures.map(r => (
          <div key={r.id} className="px-4 py-3 flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-gray-900">{r.guest?.name ?? r.guest_name}</div>
              <div className="text-xs text-gray-400">{r.room?.number ? `房號 ${r.room.number}` : (r.room_type?.name ?? r.room_type_name)}</div>
            </div>
            {r.status === 'CHECKED_IN' && (
              <button onClick={() => onCheckout(r.id)}
                className="text-xs bg-orange-500 text-white px-3 py-1.5 rounded-lg hover:bg-orange-600">Check-out</button>
            )}
            {r.status === 'CHECKED_OUT' && (
              <span className="text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded-lg">已退房</span>
            )}
          </div>
        ))}
      </ListCard>
    </div>
  )
}

// 彙總版（層次 0/1）：顯示旅館名，無操作按鈕
function AggArrivalsDepartures({ arrivals, departures, onNavigate }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <ListCard title={`今日抵達 (${arrivals.length})`} onNavigate={onNavigate}>
        {arrivals.length === 0 && <Empty text="今日無預計抵達" />}
        {arrivals.map(r => (
          <div key={r.id} className="px-4 py-3 flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-gray-900">{r.guest_name}</div>
              <div className="text-xs text-gray-400">{r.room_type_name} · {r.nights} 晚</div>
            </div>
            <span className="text-xs text-gray-400 shrink-0">{r.hotel_name}</span>
          </div>
        ))}
      </ListCard>
      <ListCard title={`今日退房 (${departures.length})`} onNavigate={onNavigate}>
        {departures.length === 0 && <Empty text="今日無預計退房" />}
        {departures.map(r => (
          <div key={r.id} className="px-4 py-3 flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-gray-900">{r.guest_name}</div>
              <div className="text-xs text-gray-400">{r.room_number ? `房號 ${r.room_number}` : r.room_type_name}</div>
            </div>
            <span className="text-xs text-gray-400 shrink-0">{r.hotel_name}</span>
          </div>
        ))}
      </ListCard>
    </div>
  )
}

function ListCard({ title, onNavigate, children }) {
  return (
    <div className="bg-white rounded-xl shadow">
      <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-gray-700">{title}</h2>
        <button onClick={onNavigate} className="text-xs text-slate-500 hover:text-slate-700">查看全部</button>
      </div>
      <div className="divide-y divide-gray-50 max-h-72 overflow-auto">{children}</div>
    </div>
  )
}

function Empty({ text }) {
  return <p className="p-4 text-gray-400 text-sm">{text}</p>
}
