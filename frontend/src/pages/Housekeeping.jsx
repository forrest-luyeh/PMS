import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../lib/api'
import Modal from '../components/Modal'

export default function Housekeeping() {
  const qc = useQueryClient()
  const [cleaning, setCleaning] = useState(null) // room being cleaned

  const { data: rooms = [], isLoading } = useQuery({
    queryKey: ['housekeeping-board'],
    queryFn: () => api.get('/housekeeping/board').then(r => r.data),
    refetchInterval: 30000,
  })

  const markClean = useMutation({
    mutationFn: ({ id, notes }) => api.patch(`/housekeeping/rooms/${id}`, { status: 'AVAILABLE', notes }),
    onSuccess: () => { qc.invalidateQueries(['housekeeping-board']); setCleaning(null) },
  })

  // Group by floor
  const byFloor = rooms.reduce((acc, r) => {
    const f = r.floor; (acc[f] = acc[f] || []).push(r); return acc
  }, {})

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-gray-900">房務看板</h1>
        <span className="text-sm text-gray-500">待清潔 {rooms.length} 間</span>
      </div>

      {isLoading ? <p className="text-gray-400">載入中...</p> : rooms.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <div className="text-4xl mb-3">✓</div>
          <div>所有房間清潔完成</div>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(byFloor).sort(([a], [b]) => a - b).map(([floor, floorRooms]) => (
            <div key={floor}>
              <div className="text-xs font-semibold text-gray-500 uppercase mb-3">{floor} 樓</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {floorRooms.map(room => (
                  <div key={room.id} className="bg-white rounded-xl shadow p-4 flex items-center justify-between">
                    <div>
                      <div className="font-bold text-gray-900 text-lg">{room.number}</div>
                      <div className="text-xs text-gray-500">{room.room_type_name}</div>
                      {room.notes && <div className="text-xs text-gray-400 mt-1 truncate max-w-32">{room.notes}</div>}
                    </div>
                    <button
                      onClick={() => setCleaning(room)}
                      className="bg-yellow-400 hover:bg-yellow-500 text-gray-900 px-3 py-2 rounded-lg text-sm font-medium transition-colors">
                      標記清潔
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {cleaning && (
        <CleanModal
          room={cleaning}
          loading={markClean.isPending}
          onClose={() => setCleaning(null)}
          onConfirm={(notes) => markClean.mutate({ id: cleaning.id, notes })}
        />
      )}
    </div>
  )
}

function CleanModal({ room, loading, onClose, onConfirm }) {
  const [notes, setNotes] = useState('')
  return (
    <Modal title={`標記清潔完成 - 房號 ${room.number}`} onClose={onClose}>
      <div className="space-y-4">
        <p className="text-sm text-gray-600">確認 {room.floor} 樓 {room.number} 號房清潔完成？</p>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">備註（選填）</label>
          <textarea value={notes} onChange={e => setNotes(e.target.value)}
            className="input resize-none h-20" placeholder="例：更換備品、回報維修需求..." />
        </div>
        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900">取消</button>
          <button onClick={() => onConfirm(notes)} disabled={loading}
            className="px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50">
            {loading ? '更新中...' : '確認完成'}
          </button>
        </div>
      </div>
    </Modal>
  )
}
