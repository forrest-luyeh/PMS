import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../lib/api'
import Modal from '../components/Modal'
import { useNavigate } from 'react-router-dom'

const STATUS_LABELS = { CONFIRMED: '已確認', CHECKED_IN: '住中', CHECKED_OUT: '已退', CANCELLED: '已取消', NO_SHOW: '未到' }
const STATUS_COLORS = {
  CONFIRMED:   'bg-blue-100 text-blue-700',
  CHECKED_IN:  'bg-green-100 text-green-700',
  CHECKED_OUT: 'bg-gray-100 text-gray-600',
  CANCELLED:   'bg-red-100 text-red-600',
  NO_SHOW:     'bg-orange-100 text-orange-700',
}

export default function Reservations() {
  const qc = useQueryClient()
  const navigate = useNavigate()
  const [filters, setFilters] = useState({ date: '', status: '', search: '' })
  const [modal, setModal] = useState(null) // null | {type: 'create'|'detail'|'checkin', data}

  const { data: reservations = [], isLoading } = useQuery({
    queryKey: ['reservations', filters],
    queryFn: () => {
      const params = {}
      if (filters.date) params.date = filters.date
      if (filters.status) params.status = filters.status
      if (filters.search) params.search = filters.search
      return api.get('/reservations', { params }).then(r => r.data.items ?? r.data)
    },
  })

  const cancelRes = useMutation({
    mutationFn: (id) => api.post(`/reservations/${id}/cancel`),
    onSuccess: () => qc.invalidateQueries(['reservations']),
  })

  const noShow = useMutation({
    mutationFn: (id) => api.post(`/reservations/${id}/no-show`),
    onSuccess: () => qc.invalidateQueries(['reservations']),
  })

  const setFilter = (k, v) => setFilters(f => ({ ...f, [k]: v }))

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-gray-900">訂房管理</h1>
        <button onClick={() => setModal({ type: 'create', data: null })}
          className="bg-slate-800 text-white px-4 py-2 rounded-lg text-sm hover:bg-slate-700">
          + 新增訂房
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-4 flex-wrap">
        <input type="date" value={filters.date} onChange={e => setFilter('date', e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-500" />
        <select value={filters.status} onChange={e => setFilter('status', e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-500">
          <option value="">全部狀態</option>
          {Object.entries(STATUS_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
        <input placeholder="搜尋客人姓名..." value={filters.search} onChange={e => setFilter('search', e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-500 w-48" />
      </div>

      {isLoading ? <p className="text-gray-400">載入中...</p> : (
        <div className="bg-white rounded-xl shadow overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600 text-xs uppercase">
              <tr>
                {['客人', '房型', '房號', '入住', '退房', '狀態', ''].map(h => (
                  <th key={h} className="px-4 py-3 text-left">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {reservations.map(r => (
                <tr key={r.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{r.guest?.name ?? r.guest_name}</td>
                  <td className="px-4 py-3 text-gray-600">{r.room_type?.name ?? r.room_type_name}</td>
                  <td className="px-4 py-3 text-gray-600">{r.room?.number ?? r.room_number ?? '-'}</td>
                  <td className="px-4 py-3 text-gray-600">{r.check_in_date}</td>
                  <td className="px-4 py-3 text-gray-600">{r.check_out_date}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded text-xs ${STATUS_COLORS[r.status]}`}>
                      {STATUS_LABELS[r.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => setModal({ type: 'detail', data: r })}
                      className="text-slate-600 hover:text-slate-900 text-xs">詳細</button>
                  </td>
                </tr>
              ))}
              {reservations.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">無訂房記錄</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {modal?.type === 'create' && (
        <CreateReservationModal
          onClose={() => setModal(null)}
          onSuccess={() => { qc.invalidateQueries(['reservations']); setModal(null) }}
        />
      )}

      {modal?.type === 'detail' && (
        <ReservationDetailPanel
          reservation={modal.data}
          onClose={() => setModal(null)}
          onCancel={() => cancelRes.mutate(modal.data.id)}
          onNoShow={() => noShow.mutate(modal.data.id)}
          onCheckin={() => setModal({ type: 'checkin', data: modal.data })}
          onCheckout={() => api.post(`/reservations/${modal.data.id}/checkout`)
            .then(() => { qc.invalidateQueries(['reservations']); setModal(null) })
            .catch(e => alert(e.response?.data?.detail || '退房失敗'))}
          onViewFolio={() => modal.data.folio_id && navigate(`/folios/${modal.data.folio_id}`)}
        />
      )}

      {modal?.type === 'checkin' && (
        <CheckinModal
          reservation={modal.data}
          onClose={() => setModal(null)}
          onSuccess={() => { qc.invalidateQueries(['reservations']); setModal(null) }}
        />
      )}
    </div>
  )
}

function CreateReservationModal({ onClose, onSuccess }) {
  const [form, setForm] = useState({ guest_id: '', room_type_id: '', check_in_date: '', check_out_date: '', adults: 1, children: 0, rate_per_night: '', source: 'WALK_IN', notes: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const { data: guests = [] } = useQuery({ queryKey: ['guests-list'], queryFn: () => api.get('/guests', { params: { limit: 1000 } }).then(r => r.data.items ?? r.data) })
  const { data: roomTypes = [] } = useQuery({ queryKey: ['room-types'], queryFn: () => api.get('/room-types').then(r => r.data) })

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleRoomTypeChange = (e) => {
    const id = e.target.value
    const rt = roomTypes.find(t => String(t.id) === id)
    setForm(f => ({ ...f, room_type_id: id, rate_per_night: rt ? rt.base_rate : '' }))
  }

  const submit = async () => {
    setLoading(true); setError('')
    try {
      await api.post('/reservations', {
        ...form,
        guest_id: parseInt(form.guest_id),
        room_type_id: parseInt(form.room_type_id),
        adults: parseInt(form.adults),
        children: parseInt(form.children),
        rate_per_night: parseFloat(form.rate_per_night),
      })
      onSuccess()
    } catch(e) {
      const detail = e.response?.data?.detail
      setError(typeof detail === 'string' ? detail : JSON.stringify(detail) || '建立失敗')
    }
    finally { setLoading(false) }
  }

  return (
    <Modal title="新增訂房" onClose={onClose}>
      <div className="space-y-3">
        <Field label="客人">
          <select value={form.guest_id} onChange={e => set('guest_id', e.target.value)} className="input" required>
            <option value="">選擇客人</option>
            {guests.map(g => <option key={g.id} value={g.id}>{g.name} ({g.phone})</option>)}
          </select>
        </Field>
        <Field label="房型">
          <select value={form.room_type_id} onChange={handleRoomTypeChange} className="input" required>
            <option value="">選擇房型</option>
            {roomTypes.map(t => <option key={t.id} value={t.id}>{t.name} (${t.base_rate}/晚)</option>)}
          </select>
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="入住日期">
            <input type="date" value={form.check_in_date} onChange={e => set('check_in_date', e.target.value)} className="input" required />
          </Field>
          <Field label="退房日期">
            <input type="date" value={form.check_out_date} onChange={e => set('check_out_date', e.target.value)} className="input" required />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="大人">
            <input type="number" min="1" value={form.adults} onChange={e => set('adults', e.target.value)} className="input" />
          </Field>
          <Field label="小孩">
            <input type="number" min="0" value={form.children} onChange={e => set('children', e.target.value)} className="input" />
          </Field>
        </div>
        <Field label="來源">
          <select value={form.source} onChange={e => set('source', e.target.value)} className="input">
            <option value="WALK_IN">現場</option>
            <option value="PHONE">電話</option>
            <option value="OTA">OTA</option>
            <option value="DIRECT">直訂</option>
          </select>
        </Field>
        {error && <p className="text-red-500 text-xs">{error}</p>}
        <div className="flex justify-end gap-2 pt-2">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900">取消</button>
          <button onClick={submit} disabled={loading}
            className="px-4 py-2 text-sm bg-slate-800 text-white rounded-lg hover:bg-slate-700 disabled:opacity-50">
            {loading ? '建立中...' : '建立訂房'}
          </button>
        </div>
      </div>
    </Modal>
  )
}

function CheckinModal({ reservation, onClose, onSuccess }) {
  const [roomId, setRoomId] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const { data: rooms = [] } = useQuery({
    queryKey: ['available-rooms', reservation.room_type_id],
    queryFn: () => api.get('/rooms', { params: { status: 'AVAILABLE' } }).then(r =>
      r.data.filter(rm => rm.room_type_id === reservation.room_type_id)
    ),
  })

  const submit = async () => {
    if (!roomId) { setError('請選擇房間'); return }
    setLoading(true); setError('')
    try {
      await api.post(`/reservations/${reservation.id}/checkin`, { room_id: parseInt(roomId) })
      onSuccess()
    } catch(e) { setError(e.response?.data?.detail || 'Check-in 失敗') }
    finally { setLoading(false) }
  }

  return (
    <Modal title={`Check-in - ${reservation.guest?.name ?? reservation.guest_name ?? ''}`} onClose={onClose}>
      <div className="space-y-4">
        <div className="p-3 bg-gray-50 rounded-lg text-sm text-gray-700">
          <div>{reservation.room_type?.name ?? reservation.room_type_name}</div>
          <div>{reservation.check_in_date} ~ {reservation.check_out_date}</div>
        </div>
        <Field label="選擇房間">
          <select value={roomId} onChange={e => setRoomId(e.target.value)} className="input">
            <option value="">請選擇可用房間</option>
            {rooms.map(r => <option key={r.id} value={r.id}>{r.number} ({r.floor}F) - {r.room_type_name}</option>)}
          </select>
        </Field>
        {rooms.length === 0 && <p className="text-orange-500 text-xs">此房型目前無可用房間</p>}
        {error && <p className="text-red-500 text-xs">{error}</p>}
        <div className="flex justify-end gap-2 pt-2">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600">取消</button>
          <button onClick={submit} disabled={loading || rooms.length === 0}
            className="px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50">
            {loading ? '處理中...' : '確認入住'}
          </button>
        </div>
      </div>
    </Modal>
  )
}

function ReservationDetailPanel({ reservation: r, onClose, onCancel, onNoShow, onCheckin, onCheckout, onViewFolio }) {
  return (
    <Modal title="訂房詳細" onClose={onClose}>
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-2 text-sm">
          <InfoRow label="客人" value={r.guest?.name ?? r.guest_name} />
          <InfoRow label="房型" value={r.room_type?.name ?? r.room_type_name} />
          <InfoRow label="房號" value={r.room?.number ?? r.room_number ?? '-'} />
          <InfoRow label="狀態" value={STATUS_LABELS[r.status]} />
          <InfoRow label="入住" value={r.check_in_date} />
          <InfoRow label="退房" value={r.check_out_date} />
          <InfoRow label="大人" value={r.adults} />
          <InfoRow label="小孩" value={r.children} />
          <InfoRow label="來源" value={r.source} />
          <InfoRow label="房價/晚" value={`$${r.rate_per_night}`} />
        </div>
        {r.notes && <p className="text-xs text-gray-500 bg-gray-50 p-2 rounded">備註：{r.notes}</p>}
        <div className="flex flex-wrap gap-2 pt-2">
          {r.status === 'CONFIRMED' && <>
            <button onClick={onCheckin} className="px-3 py-1.5 bg-green-600 text-white text-xs rounded-lg hover:bg-green-700">Check-in</button>
            <button onClick={onNoShow} className="px-3 py-1.5 bg-orange-500 text-white text-xs rounded-lg hover:bg-orange-600">No-show</button>
            <button onClick={onCancel} className="px-3 py-1.5 bg-red-500 text-white text-xs rounded-lg hover:bg-red-600">取消</button>
          </>}
          {r.status === 'CHECKED_IN' && <>
            <button onClick={onCheckout} className="px-3 py-1.5 bg-orange-500 text-white text-xs rounded-lg hover:bg-orange-600">Check-out</button>
            {r.folio_id && <button onClick={onViewFolio} className="px-3 py-1.5 bg-slate-600 text-white text-xs rounded-lg hover:bg-slate-700">查看帳單</button>}
          </>}
        </div>
      </div>
    </Modal>
  )
}

function Field({ label, children }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
      {children}
    </div>
  )
}

function InfoRow({ label, value }) {
  return (
    <div>
      <div className="text-xs text-gray-500">{label}</div>
      <div className="text-sm font-medium text-gray-800">{value}</div>
    </div>
  )
}
