import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../lib/api'
import { useAuth } from '../contexts/AuthContext'

const STATUS_COLORS = {
  AVAILABLE:    'bg-green-500',
  RESERVED:     'bg-blue-500',
  OCCUPIED:     'bg-orange-500',
  DIRTY:        'bg-yellow-400',
  OUT_OF_ORDER: 'bg-red-500',
}
const STATUS_LABELS = {
  AVAILABLE: '空淨', RESERVED: '已訂', OCCUPIED: '住中', DIRTY: '待清', OUT_OF_ORDER: '停用',
}
const STATUS_ORDER = ['AVAILABLE', 'RESERVED', 'OCCUPIED', 'DIRTY', 'OUT_OF_ORDER']
const VALID_NEXT = {
  AVAILABLE: ['OUT_OF_ORDER'],
  RESERVED:  ['AVAILABLE', 'OUT_OF_ORDER'],
  OCCUPIED:  ['OUT_OF_ORDER'],
  DIRTY:     ['AVAILABLE', 'OUT_OF_ORDER'],
  OUT_OF_ORDER: ['AVAILABLE'],
}

export default function Rooms() {
  const { user } = useAuth()
  const qc = useQueryClient()
  const [selected, setSelected] = useState(null)
  const [filterStatus, setFilterStatus] = useState('')

  const { data: rooms = [], isLoading } = useQuery({
    queryKey: ['rooms', filterStatus],
    queryFn: () => api.get('/rooms', { params: filterStatus ? { status: filterStatus } : {} }).then(r => r.data),
  })

  const updateStatus = useMutation({
    mutationFn: ({ id, status, notes }) => api.patch(`/rooms/${id}/status`, { status, notes }),
    onSuccess: () => { qc.invalidateQueries(['rooms']); setSelected(null) },
  })

  // Group by floor
  const byFloor = rooms.reduce((acc, r) => {
    const f = r.floor; (acc[f] = acc[f] || []).push(r); return acc
  }, {})

  const canEdit = ['ADMIN', 'FRONT_DESK', 'MANAGER'].includes(user?.role)

  return (
    <div className="p-6 flex gap-6">
      <div className="flex-1">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-bold text-gray-900">房態看板</h1>
          <div className="flex items-center gap-3">
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-500">
              <option value="">全部狀態</option>
              {STATUS_ORDER.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
            </select>
          </div>
        </div>

        {/* Legend */}
        <div className="flex gap-3 mb-4 flex-wrap">
          {STATUS_ORDER.map(s => (
            <div key={s} className="flex items-center gap-1.5 text-xs text-gray-600">
              <div className={`w-3 h-3 rounded-sm ${STATUS_COLORS[s]}`}></div>
              {STATUS_LABELS[s]}
            </div>
          ))}
        </div>

        {isLoading ? <p className="text-gray-400">載入中...</p> : (
          <div className="space-y-6">
            {Object.entries(byFloor).sort(([a], [b]) => a - b).map(([floor, floorRooms]) => (
              <div key={floor}>
                <div className="text-xs font-semibold text-gray-500 uppercase mb-2">{floor} 樓</div>
                <div className="flex flex-wrap gap-3">
                  {floorRooms.sort((a, b) => a.number.localeCompare(b.number)).map(room => (
                    <button
                      key={room.id}
                      onClick={() => setSelected(room)}
                      className={`w-20 h-16 rounded-lg text-white text-center flex flex-col items-center justify-center shadow-sm hover:opacity-80 transition-opacity ${STATUS_COLORS[room.status]}`}
                    >
                      <span className="text-base font-bold">{room.number}</span>
                      <span className="text-xs opacity-90">{room.room_type_name}</span>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Side panel */}
      {selected && (
        <RoomPanel
          room={selected}
          canEdit={canEdit}
          onClose={() => setSelected(null)}
          onStatusChange={(status, notes) => updateStatus.mutate({ id: selected.id, status, notes })}
          loading={updateStatus.isPending}
        />
      )}
    </div>
  )
}

function RoomPanel({ room, canEdit, onClose, onStatusChange, loading }) {
  const [newStatus, setNewStatus] = useState('')
  const [notes, setNotes] = useState(room.notes || '')
  const next = VALID_NEXT[room.status] || []

  return (
    <div className="w-72 bg-white rounded-xl shadow-lg p-5 shrink-0 h-fit">
      <div className="flex justify-between items-start mb-4">
        <div>
          <div className="text-xl font-bold text-gray-900">房號 {room.number}</div>
          <div className="text-sm text-gray-500">{room.floor} 樓 · {room.room_type_name}</div>
        </div>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">&times;</button>
      </div>

      <div className="mb-4">
        <span className={`inline-block px-3 py-1 rounded-full text-white text-sm ${STATUS_COLORS[room.status]}`}>
          {STATUS_LABELS[room.status]}
        </span>
      </div>

      {room.current_guest && (
        <div className="mb-4 p-3 bg-gray-50 rounded-lg text-sm">
          <div className="font-medium text-gray-700">住客：{room.current_guest}</div>
        </div>
      )}

      {canEdit && next.length > 0 && (
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">手動更新狀態</label>
            <select value={newStatus} onChange={e => setNewStatus(e.target.value)} className="input">
              <option value="">選擇新狀態</option>
              {next.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">備註</label>
            <input value={notes} onChange={e => setNotes(e.target.value)} className="input" placeholder="選填" />
          </div>
          <button
            onClick={() => newStatus && onStatusChange(newStatus, notes)}
            disabled={!newStatus || loading}
            className="w-full bg-slate-800 text-white py-2 rounded-lg text-sm hover:bg-slate-700 disabled:opacity-50">
            {loading ? '更新中...' : '更新狀態'}
          </button>
        </div>
      )}
    </div>
  )
}
