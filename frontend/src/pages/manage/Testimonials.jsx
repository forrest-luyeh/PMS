import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../../lib/api'

const EMPTY = { author_name: '', author_tag: '', quote: '', sort_order: 0, is_active: true }

export default function ManageTestimonials() {
  const qc = useQueryClient()
  const [modal, setModal] = useState(null) // null | { mode: 'add'|'edit', id? }
  const [form, setForm] = useState(EMPTY)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const { data: items = [], isLoading } = useQuery({
    queryKey: ['testimonials'],
    queryFn: () => api.get('/testimonials').then(r => r.data),
  })

  function openAdd() { setForm(EMPTY); setError(''); setModal({ mode: 'add' }) }
  function openEdit(t) {
    setForm({ author_name: t.author_name, author_tag: t.author_tag || '', quote: t.quote, sort_order: t.sort_order, is_active: t.is_active })
    setError('')
    setModal({ mode: 'edit', id: t.id })
  }

  const saveMutation = useMutation({
    mutationFn: (payload) =>
      modal.mode === 'add'
        ? api.post('/testimonials', payload)
        : api.put(`/testimonials/${modal.id}`, payload),
    onSuccess: () => { qc.invalidateQueries(['testimonials']); setModal(null) },
    onError: (e) => setError(e.response?.data?.detail || 'Error'),
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/testimonials/${id}`),
    onSuccess: () => qc.invalidateQueries(['testimonials']),
  })

  function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSaving(true)
    saveMutation.mutate({ ...form, sort_order: Number(form.sort_order) }, { onSettled: () => setSaving(false) })
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">旅客評語管理</h1>
        <button onClick={openAdd} className="px-4 py-2 bg-black text-white rounded-lg text-sm hover:bg-gray-800">
          + 新增評語
        </button>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-gray-400">載入中...</div>
      ) : items.length === 0 ? (
        <div className="text-center py-12 text-gray-400">尚無評語，點擊右上角新增。</div>
      ) : (
        <div className="space-y-3">
          {items.map(t => (
            <div key={t.id} className="bg-white rounded-xl border p-4 flex gap-4 items-start">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold text-sm">{t.author_name}</span>
                  {t.author_tag && <span className="text-xs text-gray-500">{t.author_tag}</span>}
                  {!t.is_active && <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded">隱藏</span>}
                  <span className="text-xs text-gray-400 ml-auto">排序 {t.sort_order}</span>
                </div>
                <p className="text-sm text-gray-600 italic">"{t.quote}"</p>
              </div>
              <div className="flex gap-2 shrink-0">
                <button onClick={() => openEdit(t)} className="text-xs px-3 py-1 border rounded hover:bg-gray-50">編輯</button>
                <button
                  onClick={() => { if (confirm('確定刪除？')) deleteMutation.mutate(t.id) }}
                  className="text-xs px-3 py-1 border border-red-200 text-red-600 rounded hover:bg-red-50"
                >刪除</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {modal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 space-y-4">
            <h2 className="text-lg font-bold">{modal.mode === 'add' ? '新增評語' : '編輯評語'}</h2>

            {error && <p className="text-sm text-red-600 bg-red-50 p-2 rounded">{error}</p>}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">旅客姓名 *</label>
                <input value={form.author_name} onChange={e => setForm(f => ({ ...f, author_name: e.target.value }))}
                  required className="w-full border rounded-lg px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">標籤（如：台北 Google 評論）</label>
                <input value={form.author_tag} onChange={e => setForm(f => ({ ...f, author_tag: e.target.value }))}
                  className="w-full border rounded-lg px-3 py-2 text-sm" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">評語內容 *</label>
              <textarea value={form.quote} onChange={e => setForm(f => ({ ...f, quote: e.target.value }))}
                required rows={3} className="w-full border rounded-lg px-3 py-2 text-sm resize-none" />
            </div>

            <div className="grid grid-cols-2 gap-3 items-center">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">排序</label>
                <input type="number" value={form.sort_order} onChange={e => setForm(f => ({ ...f, sort_order: e.target.value }))}
                  className="w-full border rounded-lg px-3 py-2 text-sm" />
              </div>
              <label className="flex items-center gap-2 text-sm mt-4 cursor-pointer">
                <input type="checkbox" checked={form.is_active} onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))} />
                顯示於網站
              </label>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setModal(null)} className="px-4 py-2 text-sm border rounded-lg hover:bg-gray-50">取消</button>
              <button type="submit" disabled={saving} className="px-4 py-2 text-sm bg-black text-white rounded-lg hover:bg-gray-800 disabled:opacity-50">
                {saving ? '儲存中...' : '儲存'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
