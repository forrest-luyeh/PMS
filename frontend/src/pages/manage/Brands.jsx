import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../../contexts/AuthContext'
import api from '../../lib/api'
import Modal from '../../components/Modal'

export default function ManageBrands() {
  const { user } = useAuth()
  const qc = useQueryClient()
  const [modal, setModal] = useState(null) // null | { mode: 'add'|'edit', data }

  const { data: brands = [], isLoading } = useQuery({
    queryKey: ['admin-brands'],
    queryFn: () => api.get('/admin/brands').then(r => r.data),
  })

  const save = useMutation({
    mutationFn: (form) => modal.mode === 'add'
      ? api.post('/admin/brands', { name: form.name, slug: form.slug, tenant_id: user.tenant_id })
      : api.put(`/admin/brands/${modal.data.id}`, { name: form.name }),
    onSuccess: () => { qc.invalidateQueries(['admin-brands']); setModal(null) },
  })

  const toggle = useMutation({
    mutationFn: ({ id, active }) =>
      api.patch(`/admin/brands/${id}/${active ? 'deactivate' : 'activate'}`),
    onSuccess: () => qc.invalidateQueries(['admin-brands']),
  })

  if (isLoading) return <div className="p-6 text-gray-400">載入中...</div>

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-gray-900">品牌管理</h1>
        <button
          onClick={() => setModal({ mode: 'add', data: { name: '', slug: '' } })}
          className="bg-slate-800 text-white px-4 py-2 rounded-lg text-sm hover:bg-slate-700"
        >
          + 新增品牌
        </button>
      </div>

      <div className="bg-white rounded-xl shadow overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-600 text-xs uppercase">
            <tr>
              {['品牌名稱', 'Slug', '狀態', ''].map(h => (
                <th key={h} className="px-4 py-3 text-left">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {brands.map(b => (
              <tr key={b.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-900">{b.name}</td>
                <td className="px-4 py-3 text-gray-400 text-xs">{b.slug}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${b.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                    {b.is_active ? '啟用' : '停用'}
                  </span>
                </td>
                <td className="px-4 py-3 text-right space-x-3">
                  <button onClick={() => setModal({ mode: 'edit', data: { ...b } })}
                    className="text-slate-600 hover:text-slate-900 text-xs">編輯</button>
                  <button onClick={() => toggle.mutate({ id: b.id, active: b.is_active })}
                    className={`text-xs ${b.is_active ? 'text-red-400 hover:text-red-600' : 'text-green-600 hover:text-green-700'}`}>
                    {b.is_active ? '停用' : '啟用'}
                  </button>
                </td>
              </tr>
            ))}
            {brands.length === 0 && (
              <tr><td colSpan={4} className="px-4 py-8 text-center text-gray-400">尚無品牌</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {modal && (
        <BrandModal
          mode={modal.mode}
          initial={modal.data}
          loading={save.isPending}
          error={save.error?.response?.data?.detail}
          onClose={() => setModal(null)}
          onSubmit={(form) => save.mutate(form)}
        />
      )}
    </div>
  )
}

function BrandModal({ mode, initial, loading, error, onClose, onSubmit }) {
  const [form, setForm] = useState(initial)
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  return (
    <Modal title={mode === 'add' ? '新增品牌' : '編輯品牌'} onClose={onClose}>
      <div className="space-y-3">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">品牌名稱</label>
          <input value={form.name} onChange={e => set('name', e.target.value)}
            className="input" placeholder="雀客旅館 CHECKinn Hotel" />
        </div>
        {mode === 'add' && (
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Slug（英文唯一識別）</label>
            <input value={form.slug} onChange={e => set('slug', e.target.value)}
              className="input" placeholder="hotel" />
          </div>
        )}
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
