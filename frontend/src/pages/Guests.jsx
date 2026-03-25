import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../lib/api'
import Modal from '../components/Modal'

const EMPTY_FORM = { name: '', id_type: 'ID_CARD', id_number: '', phone: '', email: '', nationality: '台灣' }
const ID_TYPES = { ID_CARD: '身分證', PASSPORT: '護照', RESIDENCE_PERMIT: '居留證', OTHER: '其他' }

export default function Guests() {
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [modal, setModal] = useState(null) // null | {type: 'form'|'detail', data}

  const { data: guests = [], isLoading } = useQuery({
    queryKey: ['guests', search],
    queryFn: () => api.get('/guests', { params: search ? { search } : {} }).then(r => r.data.items ?? r.data),
  })

  const save = useMutation({
    mutationFn: (form) => modal.data?.id
      ? api.put(`/guests/${modal.data.id}`, form)
      : api.post('/guests', form),
    onSuccess: () => { qc.invalidateQueries(['guests']); setModal(null) },
  })

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-gray-900">客人管理</h1>
        <button onClick={() => setModal({ type: 'form', data: { ...EMPTY_FORM } })}
          className="bg-slate-800 text-white px-4 py-2 rounded-lg text-sm hover:bg-slate-700">
          + 新增客人
        </button>
      </div>

      <div className="mb-4">
        <input placeholder="搜尋姓名、電話或證件號碼..." value={search} onChange={e => setSearch(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-500 w-72" />
      </div>

      {isLoading ? <p className="text-gray-400">載入中...</p> : (
        <div className="bg-white rounded-xl shadow overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600 text-xs uppercase">
              <tr>
                {['姓名', '電話', '電子郵件', '國籍', ''].map(h => (
                  <th key={h} className="px-4 py-3 text-left">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {guests.map(g => (
                <tr key={g.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{g.name}</td>
                  <td className="px-4 py-3 text-gray-600">{g.phone || '-'}</td>
                  <td className="px-4 py-3 text-gray-600">{g.email || '-'}</td>
                  <td className="px-4 py-3 text-gray-600">{g.nationality || '-'}</td>
                  <td className="px-4 py-3 text-right flex gap-3 justify-end">
                    <button onClick={() => setModal({ type: 'detail', data: g })}
                      className="text-slate-600 hover:text-slate-900 text-xs">歷史</button>
                    <button onClick={() => setModal({ type: 'form', data: { ...g } })}
                      className="text-slate-600 hover:text-slate-900 text-xs">編輯</button>
                  </td>
                </tr>
              ))}
              {guests.length === 0 && (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400">無客人記錄</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {modal?.type === 'form' && (
        <GuestModal
          initial={modal.data}
          loading={save.isPending}
          error={save.error?.response?.data?.detail}
          onClose={() => setModal(null)}
          onSubmit={(form) => save.mutate(form)}
        />
      )}

      {modal?.type === 'detail' && (
        <GuestDetailModal
          guest={modal.data}
          onClose={() => setModal(null)}
          onEdit={() => setModal({ type: 'form', data: { ...modal.data } })}
        />
      )}
    </div>
  )
}

function GuestModal({ initial, loading, error, onClose, onSubmit }) {
  const [form, setForm] = useState(initial)
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  return (
    <Modal title={initial.id ? '編輯客人' : '新增客人'} onClose={onClose}>
      <div className="space-y-3">
        <Field label="姓名">
          <input value={form.name} onChange={e => set('name', e.target.value)} required className="input" />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="證件類型">
            <select value={form.id_type} onChange={e => set('id_type', e.target.value)} className="input">
              {Object.entries(ID_TYPES).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </Field>
          <Field label="證件號碼">
            <input value={form.id_number} onChange={e => set('id_number', e.target.value)} className="input" />
          </Field>
        </div>
        <Field label="電話">
          <input value={form.phone} onChange={e => set('phone', e.target.value)} className="input" />
        </Field>
        <Field label="電子郵件">
          <input value={form.email} onChange={e => set('email', e.target.value)} className="input" />
        </Field>
        <Field label="國籍">
          <input value={form.nationality} onChange={e => set('nationality', e.target.value)} className="input" />
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

function GuestDetailModal({ guest, onClose, onEdit }) {
  const { data } = useQuery({
    queryKey: ['guest-detail', guest.id],
    queryFn: () => api.get(`/guests/${guest.id}`).then(r => r.data),
  })

  const STATUS_LABELS = { CONFIRMED: '已確認', CHECKED_IN: '住中', CHECKED_OUT: '已退', CANCELLED: '已取消', NO_SHOW: '未到' }

  return (
    <Modal title={`${guest.name} - 入住記錄`} onClose={onClose}>
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-2 text-sm">
          <InfoRow label="電話" value={guest.phone || '-'} />
          <InfoRow label="國籍" value={guest.nationality || '-'} />
          <InfoRow label="電子郵件" value={guest.email || '-'} />
        </div>
        <div>
          <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">入住歷史</h4>
          {!data ? <p className="text-gray-400 text-sm">載入中...</p> : (
            data.reservations?.length === 0
              ? <p className="text-gray-400 text-sm">尚無入住記錄</p>
              : <div className="space-y-2 max-h-48 overflow-auto">
                  {data.reservations?.map(r => (
                    <div key={r.id} className="flex justify-between items-center text-sm bg-gray-50 px-3 py-2 rounded">
                      <div>
                        <div className="font-medium text-gray-800">{r.room_type_name}</div>
                        <div className="text-xs text-gray-400">{r.check_in_date} ~ {r.check_out_date}</div>
                      </div>
                      <span className="text-xs text-gray-500">{STATUS_LABELS[r.status]}</span>
                    </div>
                  ))}
                </div>
          )}
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900">關閉</button>
          <button onClick={onEdit} className="px-4 py-2 text-sm bg-slate-800 text-white rounded-lg hover:bg-slate-700">編輯</button>
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
