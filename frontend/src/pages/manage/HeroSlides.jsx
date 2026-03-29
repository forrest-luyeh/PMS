import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../../lib/api'

const EMPTY = { image_url: '', label: '', headline: '', subline: '', link_url: '', link_label: '', sort_order: 0, is_active: true }

export default function ManageHeroSlides() {
  const qc = useQueryClient()
  const [modal, setModal] = useState(null)
  const [form, setForm] = useState(EMPTY)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const { data: items = [], isLoading } = useQuery({
    queryKey: ['hero-slides'],
    queryFn: () => api.get('/hero-slides').then(r => r.data),
  })

  function openAdd() { setForm(EMPTY); setError(''); setModal({ mode: 'add' }) }
  function openEdit(s) {
    setForm({
      image_url: s.image_url, label: s.label || '', headline: s.headline,
      subline: s.subline || '', link_url: s.link_url || '', link_label: s.link_label || '',
      sort_order: s.sort_order, is_active: s.is_active,
    })
    setError('')
    setModal({ mode: 'edit', id: s.id })
  }

  const saveMutation = useMutation({
    mutationFn: (payload) =>
      modal.mode === 'add'
        ? api.post('/hero-slides', payload)
        : api.put(`/hero-slides/${modal.id}`, payload),
    onSuccess: () => { qc.invalidateQueries(['hero-slides']); setModal(null) },
    onError: (e) => setError(e.response?.data?.detail || 'Error'),
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/hero-slides/${id}`),
    onSuccess: () => qc.invalidateQueries(['hero-slides']),
  })

  function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSaving(true)
    saveMutation.mutate({ ...form, sort_order: Number(form.sort_order) }, { onSettled: () => setSaving(false) })
  }

  function field(key, label, opts = {}) {
    return (
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">{label}</label>
        <input
          value={form[key]}
          onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
          className="w-full border rounded-lg px-3 py-2 text-sm"
          {...opts}
        />
      </div>
    )
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">首頁輪播管理</h1>
        <button onClick={openAdd} className="px-4 py-2 bg-black text-white rounded-lg text-sm hover:bg-gray-800">
          + 新增輪播
        </button>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-gray-400">載入中...</div>
      ) : items.length === 0 ? (
        <div className="text-center py-12 text-gray-400">尚無輪播，點擊右上角新增。</div>
      ) : (
        <div className="space-y-3">
          {items.map(s => (
            <div key={s.id} className="bg-white rounded-xl border overflow-hidden flex">
              {s.image_url && (
                <img src={s.image_url} alt={s.headline} className="w-32 h-20 object-cover shrink-0" />
              )}
              <div className="flex-1 p-3 flex gap-3 items-start">
                <div className="flex-1">
                  {s.label && <p className="text-xs text-gray-400 uppercase tracking-wider mb-0.5">{s.label}</p>}
                  <p className="font-semibold text-sm">{s.headline}</p>
                  {s.subline && <p className="text-xs text-gray-500">{s.subline}</p>}
                  <div className="flex items-center gap-3 mt-1">
                    {!s.is_active && <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded">隱藏</span>}
                    <span className="text-xs text-gray-400">排序 {s.sort_order}</span>
                  </div>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button onClick={() => openEdit(s)} className="text-xs px-3 py-1 border rounded hover:bg-gray-50">編輯</button>
                  <button
                    onClick={() => { if (confirm('確定刪除？')) deleteMutation.mutate(s.id) }}
                    className="text-xs px-3 py-1 border border-red-200 text-red-600 rounded hover:bg-red-50"
                  >刪除</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {modal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 space-y-4 my-8">
            <h2 className="text-lg font-bold">{modal.mode === 'add' ? '新增輪播' : '編輯輪播'}</h2>

            {error && <p className="text-sm text-red-600 bg-red-50 p-2 rounded">{error}</p>}

            {field('image_url', '圖片 URL *', { required: true, placeholder: 'https://picsum.photos/seed/slide1/1200/800' })}

            {form.image_url && (
              <img src={form.image_url} alt="preview" className="w-full h-32 object-cover rounded-lg" />
            )}

            {field('label', '小標（如 Brand Series）')}
            {field('headline', '主標題 *', { required: true })}
            {field('subline', '副標題')}

            <div className="grid grid-cols-2 gap-3">
              {field('link_url', '連結 URL')}
              {field('link_label', '連結文字')}
            </div>

            <div className="grid grid-cols-2 gap-3 items-center">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">排序</label>
                <input type="number" value={form.sort_order} onChange={e => setForm(f => ({ ...f, sort_order: e.target.value }))}
                  className="w-full border rounded-lg px-3 py-2 text-sm" />
              </div>
              <label className="flex items-center gap-2 text-sm mt-4 cursor-pointer">
                <input type="checkbox" checked={form.is_active} onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))} />
                顯示於首頁
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
