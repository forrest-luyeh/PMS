/**
 * /manage/rooms — 房型 & 房間管理（針對目前切換的旅館）
 */
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

import { useAuth } from '../../contexts/AuthContext'
import api from '../../lib/api'
import Modal from '../../components/Modal'

const BED_TYPES = ['DOUBLE', 'TWIN', 'FAMILY', 'SINGLE']
const STATUS_LIST = ['AVAILABLE', 'OUT_OF_ORDER']
const STATUS_LABELS = { AVAILABLE: '可用', RESERVED: '已訂', OCCUPIED: '住中', DIRTY: '待清', OUT_OF_ORDER: '停用' }
const STATUS_COLORS = { AVAILABLE: 'bg-green-100 text-green-700', RESERVED: 'bg-blue-100 text-blue-700', OCCUPIED: 'bg-orange-100 text-orange-700', DIRTY: 'bg-yellow-100 text-yellow-700', OUT_OF_ORDER: 'bg-red-100 text-red-600' }

const EMPTY_RT = { name: '', room_code: '', bed_type: 'DOUBLE', has_window: true, base_rate: '', max_occupancy: 2, description: '' }
const EMPTY_ROOM = { number: '', floor: '', room_type_id: '', status: 'AVAILABLE', notes: '' }

export default function RoomSetup() {
  const { hotelCtx } = useAuth()
  const qc = useQueryClient()
  const [tab, setTab] = useState('types') // 'types' | 'rooms'
  const [rtModal, setRtModal] = useState(null)
  const [roomModal, setRoomModal] = useState(null)

  const { data: roomTypes = [] } = useQuery({
    queryKey: ['room-types', hotelCtx?.hotel_id],
    queryFn: () => api.get('/room-types').then(r => r.data),
    enabled: !!hotelCtx?.hotel_id,
  })
  const { data: rooms = [] } = useQuery({
    queryKey: ['rooms', hotelCtx?.hotel_id],
    queryFn: () => api.get('/rooms').then(r => r.data),
    enabled: !!hotelCtx?.hotel_id,
  })

  const saveRt = useMutation({
    mutationFn: (form) => rtModal.mode === 'add'
      ? api.post('/room-types', form)
      : api.put(`/room-types/${rtModal.data.id}`, form),
    onSuccess: () => { qc.invalidateQueries(['room-types']); setRtModal(null) },
  })

  const deleteRt = useMutation({
    mutationFn: (id) => api.delete(`/room-types/${id}`),
    onSuccess: () => qc.invalidateQueries(['room-types']),
  })

  const saveRoom = useMutation({
    mutationFn: (form) => roomModal.mode === 'add'
      ? api.post('/rooms', form)
      : api.put(`/rooms/${roomModal.data.id}`, form),
    onSuccess: () => { qc.invalidateQueries(['rooms']); setRoomModal(null) },
  })

  const deleteRoom = useMutation({
    mutationFn: (id) => api.delete(`/rooms/${id}`),
    onSuccess: () => qc.invalidateQueries(['rooms']),
  })

  if (!hotelCtx?.hotel_id) {
    return <div className="p-8 text-gray-500">請先在「管理旗下旅館」頁切換旅館。</div>
  }

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold text-gray-900 mb-4">房型 & 房間管理</h1>

      {/* Tab */}
      <div className="flex gap-1 mb-6 border-b border-gray-200">
        {[['types', '房型'], ['rooms', '房間']].map(([key, label]) => (
          <button key={key} onClick={() => setTab(key)}
            className={`px-5 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${tab === key ? 'border-slate-800 text-slate-800' : 'border-transparent text-gray-400 hover:text-gray-600'}`}>
            {label}
            <span className="ml-1.5 text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full">
              {key === 'types' ? roomTypes.length : rooms.length}
            </span>
          </button>
        ))}
      </div>

      {/* Room Types Tab */}
      {tab === 'types' && (
        <>
          <div className="flex justify-end mb-3">
            <button onClick={() => setRtModal({ mode: 'add', data: { ...EMPTY_RT } })}
              className="bg-slate-800 text-white px-4 py-2 rounded-lg text-sm hover:bg-slate-700">
              + 新增房型
            </button>
          </div>
          <div className="bg-white rounded-xl shadow overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-600 text-xs uppercase">
                <tr>
                  {['房型名稱', '代碼', '床型', '有窗', '定價', '最多入住', ''].map(h => (
                    <th key={h} className="px-4 py-3 text-left">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {roomTypes.map(rt => (
                  <tr key={rt.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">{rt.name}</td>
                    <td className="px-4 py-3 text-gray-500">{rt.room_code || '—'}</td>
                    <td className="px-4 py-3 text-gray-500">{rt.bed_type || '—'}</td>
                    <td className="px-4 py-3">{rt.has_window ? '✓' : '✗'}</td>
                    <td className="px-4 py-3">NT$ {Number(rt.base_rate).toLocaleString()}</td>
                    <td className="px-4 py-3">{rt.max_occupancy} 人</td>
                    <td className="px-4 py-3 text-right space-x-2">
                      <button onClick={() => setRtModal({ mode: 'edit', data: { ...rt } })}
                        className="text-slate-600 hover:text-slate-900 text-xs">編輯</button>
                      <button onClick={() => { if (confirm('確定刪除此房型？')) deleteRt.mutate(rt.id) }}
                        className="text-red-400 hover:text-red-600 text-xs">刪除</button>
                    </td>
                  </tr>
                ))}
                {roomTypes.length === 0 && (
                  <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">尚無房型</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Rooms Tab */}
      {tab === 'rooms' && (
        <>
          <div className="flex justify-end mb-3">
            <button onClick={() => setRoomModal({ mode: 'add', data: { ...EMPTY_ROOM, room_type_id: roomTypes[0]?.id ?? '' } })}
              className="bg-slate-800 text-white px-4 py-2 rounded-lg text-sm hover:bg-slate-700">
              + 新增房間
            </button>
          </div>
          <div className="bg-white rounded-xl shadow overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-600 text-xs uppercase">
                <tr>
                  {['房號', '樓層', '房型', '狀態', '備註', ''].map(h => (
                    <th key={h} className="px-4 py-3 text-left">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {rooms.map(r => (
                  <tr key={r.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">{r.number}</td>
                    <td className="px-4 py-3 text-gray-500">{r.floor} F</td>
                    <td className="px-4 py-3 text-gray-600">{r.room_type_name || roomTypes.find(rt => rt.id === r.room_type_id)?.name || '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_COLORS[r.status]}`}>
                        {STATUS_LABELS[r.status]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-400 text-xs truncate max-w-xs">{r.notes || '—'}</td>
                    <td className="px-4 py-3 text-right space-x-2">
                      <button onClick={() => setRoomModal({ mode: 'edit', data: { ...r } })}
                        className="text-slate-600 hover:text-slate-900 text-xs">編輯</button>
                      <button onClick={() => { if (confirm('確定刪除此房間？')) deleteRoom.mutate(r.id) }}
                        className="text-red-400 hover:text-red-600 text-xs">刪除</button>
                    </td>
                  </tr>
                ))}
                {rooms.length === 0 && (
                  <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">尚無房間</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Room Type Modal */}
      {rtModal && (
        <RoomTypeModal
          mode={rtModal.mode}
          initial={rtModal.data}
          loading={saveRt.isPending}
          error={saveRt.error?.response?.data?.detail}
          onClose={() => setRtModal(null)}
          onSubmit={(form) => saveRt.mutate(form)}
        />
      )}

      {/* Room Modal */}
      {roomModal && (
        <RoomModal
          mode={roomModal.mode}
          initial={roomModal.data}
          roomTypes={roomTypes}
          loading={saveRoom.isPending}
          error={saveRoom.error?.response?.data?.detail}
          onClose={() => setRoomModal(null)}
          onSubmit={(form) => saveRoom.mutate(form)}
        />
      )}
    </div>
  )
}

function RoomTypeModal({ mode, initial, loading, error, onClose, onSubmit }) {
  const [form, setForm] = useState(initial)
  const [tab, setTab] = useState('basic')
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))
  const rtId = initial?.id
  const qc = useQueryClient()

  const { data: images = [] } = useQuery({
    queryKey: ['rt-images', rtId],
    queryFn: () => api.get(`/room-types/${rtId}/images`).then(r => r.data),
    enabled: mode === 'edit' && !!rtId,
  })
  const [newImgUrl, setNewImgUrl] = useState('')
  const [newImgAlt, setNewImgAlt] = useState('')
  const addImg = useMutation({
    mutationFn: () => api.post(`/room-types/${rtId}/images`, { url: newImgUrl, alt_text: newImgAlt, sort_order: images.length }),
    onSuccess: () => { qc.invalidateQueries(['rt-images', rtId]); setNewImgUrl(''); setNewImgAlt('') },
  })
  const delImg = useMutation({
    mutationFn: (id) => api.delete(`/room-types/${rtId}/images/${id}`),
    onSuccess: () => qc.invalidateQueries(['rt-images', rtId]),
  })

  const { data: amenities = [] } = useQuery({
    queryKey: ['rt-amenities', rtId],
    queryFn: () => api.get(`/room-types/${rtId}/amenities`).then(r => r.data),
    enabled: mode === 'edit' && !!rtId,
  })
  const [newName, setNewName] = useState('')
  const [newCat, setNewCat] = useState('')
  const addAmenity = useMutation({
    mutationFn: () => api.post(`/room-types/${rtId}/amenities`, { name: newName, category: newCat }),
    onSuccess: () => { qc.invalidateQueries(['rt-amenities', rtId]); setNewName(''); setNewCat('') },
  })
  const delAmenity = useMutation({
    mutationFn: (id) => api.delete(`/room-types/${rtId}/amenities/${id}`),
    onSuccess: () => qc.invalidateQueries(['rt-amenities', rtId]),
  })

  const TABS = mode === 'edit'
    ? [['basic', '基本資訊'], ['images', `圖片 (${images.length})`], ['amenities', `設施 (${amenities.length})`]]
    : [['basic', '基本資訊']]

  return (
    <Modal title={mode === 'add' ? '新增房型' : '編輯房型'} onClose={onClose}>
      <div className="flex gap-1 border-b border-gray-200 mb-4 -mt-1">
        {TABS.map(([key, label]) => (
          <button key={key} onClick={() => setTab(key)}
            className={`px-4 py-2 text-xs font-medium border-b-2 -mb-px ${tab === key ? 'border-slate-700 text-slate-800' : 'border-transparent text-gray-400 hover:text-gray-600'}`}>
            {label}
          </button>
        ))}
      </div>

      {tab === 'basic' && (
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <Field label="房型名稱"><input value={form.name} onChange={e => set('name', e.target.value)} className="input" /></Field>
          <Field label="代碼（選填）"><input value={form.room_code || ''} onChange={e => set('room_code', e.target.value)} className="input" placeholder="CD / JD / WVD" /></Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="床型">
            <select value={form.bed_type || 'DOUBLE'} onChange={e => set('bed_type', e.target.value)} className="input">
              {BED_TYPES.map(b => <option key={b} value={b}>{b}</option>)}
            </select>
          </Field>
          <Field label="最多入住人數">
            <input type="number" min={1} max={10} value={form.max_occupancy} onChange={e => set('max_occupancy', Number(e.target.value))} className="input" />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="定價（NT$）">
            <input type="number" min={0} value={form.base_rate} onChange={e => set('base_rate', e.target.value)} className="input" />
          </Field>
          <Field label="坪數（m²，選填）">
            <input type="number" min={0} step="0.1" value={form.size_sqm || ''} onChange={e => set('size_sqm', e.target.value || null)} className="input" />
          </Field>
        </div>
        <Field label="有窗">
          <label className="flex items-center gap-2 mt-1 cursor-pointer">
            <input type="checkbox" checked={!!form.has_window} onChange={e => set('has_window', e.target.checked)} />
            <span className="text-sm text-gray-700">有窗戶</span>
          </label>
        </Field>
        <Field label="描述（選填）">
          <textarea value={form.description || ''} onChange={e => set('description', e.target.value)} rows={2} className="input" />
        </Field>
        {error && <p className="text-red-500 text-xs">{error}</p>}
        <div className="flex justify-end gap-2 pt-2">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900">取消</button>
          <button onClick={() => onSubmit(form)} disabled={loading}
            className="px-4 py-2 text-sm bg-slate-800 text-white rounded-lg hover:bg-slate-700 disabled:opacity-50">
            {loading ? '儲存中...' : '儲存'}
          </button>
        </div>
      </div>
      )}

      {tab === 'images' && (
        <div className="space-y-3">
          <div className="space-y-2">
            {images.map(img => (
              <div key={img.id} className="flex items-center gap-2 border rounded-lg p-2">
                <img src={img.url} alt={img.alt_text || ''} className="w-16 h-12 object-cover rounded" onError={e => { e.target.style.display='none' }} />
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-gray-700 truncate">{img.url}</div>
                  {img.alt_text && <div className="text-xs text-gray-400">{img.alt_text}</div>}
                </div>
                <button onClick={() => delImg.mutate(img.id)} className="text-red-400 hover:text-red-600 text-xs shrink-0">刪除</button>
              </div>
            ))}
            {images.length === 0 && <p className="text-gray-400 text-xs py-2">尚無圖片</p>}
          </div>
          <div className="border-t pt-3 space-y-2">
            <Field label="圖片 URL">
              <input value={newImgUrl} onChange={e => setNewImgUrl(e.target.value)} className="input" placeholder="https://..." />
            </Field>
            <Field label="說明文字（選填）">
              <input value={newImgAlt} onChange={e => setNewImgAlt(e.target.value)} className="input" />
            </Field>
            <button onClick={() => newImgUrl && addImg.mutate()} disabled={!newImgUrl || addImg.isPending}
              className="text-xs px-3 py-1.5 bg-slate-800 text-white rounded-lg hover:bg-slate-700 disabled:opacity-50">
              + 新增圖片
            </button>
          </div>
        </div>
      )}

      {tab === 'amenities' && (
        <div className="space-y-3">
          <div className="space-y-1.5">
            {amenities.map(a => (
              <div key={a.id} className="flex items-center justify-between border rounded-lg px-3 py-2">
                <div>
                  <span className="text-sm text-gray-800">{a.name}</span>
                  {a.category && <span className="ml-2 text-xs bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded">{a.category}</span>}
                </div>
                <button onClick={() => delAmenity.mutate(a.id)} className="text-red-400 hover:text-red-600 text-xs">刪除</button>
              </div>
            ))}
            {amenities.length === 0 && <p className="text-gray-400 text-xs py-2">尚無設施</p>}
          </div>
          <div className="border-t pt-3 grid grid-cols-2 gap-2">
            <Field label="設施名稱">
              <input value={newName} onChange={e => setNewName(e.target.value)} className="input" placeholder="SIMMONS 床墊" />
            </Field>
            <Field label="分類（選填）">
              <input value={newCat} onChange={e => setNewCat(e.target.value)} className="input" placeholder="床寢 / 設備 / 衛浴" />
            </Field>
          </div>
          <button onClick={() => newName && addAmenity.mutate()} disabled={!newName || addAmenity.isPending}
            className="text-xs px-3 py-1.5 bg-slate-800 text-white rounded-lg hover:bg-slate-700 disabled:opacity-50">
            + 新增設施
          </button>
        </div>
      )}
    </Modal>
  )
}

function RoomModal({ mode, initial, roomTypes, loading, error, onClose, onSubmit }) {
  const [form, setForm] = useState({ ...initial, room_type_id: initial.room_type_id || roomTypes[0]?.id || '' })
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))
  return (
    <Modal title={mode === 'add' ? '新增房間' : '編輯房間'} onClose={onClose}>
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <Field label="房號"><input value={form.number} onChange={e => set('number', e.target.value)} className="input" placeholder="101" /></Field>
          <Field label="樓層"><input type="number" min={1} value={form.floor} onChange={e => set('floor', Number(e.target.value))} className="input" /></Field>
        </div>
        <Field label="房型">
          <select value={form.room_type_id} onChange={e => set('room_type_id', Number(e.target.value))} className="input">
            {roomTypes.map(rt => <option key={rt.id} value={rt.id}>{rt.name}</option>)}
          </select>
        </Field>
        <Field label="狀態">
          <select value={form.status} onChange={e => set('status', e.target.value)} className="input">
            {STATUS_LIST.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
          </select>
        </Field>
        <Field label="備註（選填）">
          <textarea value={form.notes || ''} onChange={e => set('notes', e.target.value)} rows={2} className="input" />
        </Field>
        {error && <p className="text-red-500 text-xs">{error}</p>}
        <div className="flex justify-end gap-2 pt-2">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900">取消</button>
          <button onClick={() => onSubmit(form)} disabled={loading}
            className="px-4 py-2 text-sm bg-slate-800 text-white rounded-lg hover:bg-slate-700 disabled:opacity-50">
            {loading ? '儲存中...' : '儲存'}
          </button>
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
