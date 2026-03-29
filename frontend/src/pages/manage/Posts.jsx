import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../../lib/api'

const TYPE_LABELS = {
  activity: '活動快訊',
  news: '最新消息',
  traveler: '旅人誌',
  uncategorized: '未分類',
}
const TYPE_COLORS = {
  activity: 'bg-orange-100 text-orange-700',
  news: 'bg-blue-100 text-blue-700',
  traveler: 'bg-emerald-100 text-emerald-700',
  uncategorized: 'bg-gray-100 text-gray-600',
}
const TABS = ['all', 'activity', 'news', 'traveler', 'uncategorized']

const EMPTY_FORM = {
  post_type: 'news', title: '', slug: '', excerpt: '',
  body: '', cover_image_url: '', video_url: '',
  is_published: false, published_at: '',
}

export default function ManagePosts() {
  const qc = useQueryClient()
  const [tab, setTab] = useState('all')
  const [modal, setModal] = useState(null) // null | { mode: 'add'|'edit', data }
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const { data: posts = [], isLoading } = useQuery({
    queryKey: ['posts', tab],
    queryFn: () => api.get('/posts', { params: tab !== 'all' ? { type: tab } : {} }).then(r => r.data),
  })

  function openAdd() {
    setForm(EMPTY_FORM)
    setError('')
    setModal({ mode: 'add' })
  }

  function openEdit(p) {
    setForm({
      post_type: p.post_type,
      title: p.title,
      slug: p.slug,
      excerpt: p.excerpt || '',
      body: p.body || '',
      cover_image_url: p.cover_image_url || '',
      video_url: p.video_url || '',
      is_published: p.is_published,
      published_at: p.published_at ? p.published_at.slice(0, 16) : '',
    })
    setError('')
    setModal({ mode: 'edit', id: p.id })
  }

  async function save() {
    if (!form.title.trim()) { setError('請填寫標題'); return }
    setSaving(true); setError('')
    try {
      const payload = {
        ...form,
        slug: form.slug.trim() || undefined,
        excerpt: form.excerpt || null,
        body: form.body || null,
        cover_image_url: form.cover_image_url || null,
        video_url: form.video_url || null,
        published_at: form.published_at || null,
      }
      if (modal.mode === 'add') {
        await api.post('/posts', payload)
      } else {
        await api.put(`/posts/${modal.id}`, payload)
      }
      qc.invalidateQueries(['posts'])
      setModal(null)
    } catch (e) {
      setError(e.response?.data?.detail || '儲存失敗')
    } finally { setSaving(false) }
  }

  const togglePublish = useMutation({
    mutationFn: (p) => p.is_published
      ? api.patch(`/posts/${p.id}/unpublish`)
      : api.patch(`/posts/${p.id}/publish`),
    onSuccess: () => qc.invalidateQueries(['posts']),
  })

  const del = useMutation({
    mutationFn: (id) => api.delete(`/posts/${id}`),
    onSuccess: () => qc.invalidateQueries(['posts']),
  })

  function handleDelete(p) {
    if (!window.confirm(`確認刪除「${p.title}」？`)) return
    del.mutate(p.id)
  }

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }))

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-gray-900">內容管理</h1>
        <button onClick={openAdd} className="bg-slate-800 text-white px-4 py-2 rounded-lg text-sm hover:bg-slate-700">
          + 新增文章
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-4 border-b border-gray-200">
        {TABS.map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
              tab === t ? 'border-slate-700 text-slate-800' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {t === 'all' ? '全部' : TYPE_LABELS[t]}
          </button>
        ))}
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="text-gray-400 py-8 text-center">載入中...</div>
      ) : posts.length === 0 ? (
        <div className="text-gray-400 py-8 text-center">尚無文章</div>
      ) : (
        <div className="bg-white rounded-xl shadow overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600 text-xs uppercase">
              <tr>
                <th className="px-4 py-3 text-left w-16">封面</th>
                <th className="px-4 py-3 text-left">標題</th>
                <th className="px-4 py-3 text-left w-24">類型</th>
                <th className="px-4 py-3 text-left w-20">狀態</th>
                <th className="px-4 py-3 text-left w-32">發佈日</th>
                <th className="px-4 py-3 text-right w-32">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {posts.map(p => (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    {p.cover_image_url
                      ? <img src={p.cover_image_url} alt="" className="w-14 h-10 object-cover rounded" />
                      : <div className={`w-14 h-10 rounded flex items-center justify-center text-xs font-bold ${TYPE_COLORS[p.post_type] || 'bg-gray-100'}`}>
                          {TYPE_LABELS[p.post_type]?.[0]}
                        </div>
                    }
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-800">{p.title}</div>
                    <div className="text-xs text-gray-400 font-mono">{p.slug}</div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${TYPE_COLORS[p.post_type] || 'bg-gray-100'}`}>
                      {TYPE_LABELS[p.post_type] || p.post_type}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${p.is_published ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {p.is_published ? '已發佈' : '草稿'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">
                    {p.published_at ? new Date(p.published_at).toLocaleDateString('zh-TW') : '—'}
                  </td>
                  <td className="px-4 py-3 text-right space-x-2">
                    <button
                      onClick={() => togglePublish.mutate(p)}
                      className="text-xs text-blue-500 hover:text-blue-700"
                    >
                      {p.is_published ? '取消發佈' : '發佈'}
                    </button>
                    <button onClick={() => openEdit(p)} className="text-xs text-gray-600 hover:text-gray-800">編輯</button>
                    <button onClick={() => handleDelete(p)} className="text-xs text-red-400 hover:text-red-600">刪除</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {modal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between shrink-0">
              <h2 className="font-semibold text-gray-800">{modal.mode === 'add' ? '新增文章' : '編輯文章'}</h2>
              <button onClick={() => setModal(null)} className="text-gray-400 hover:text-gray-600 text-xl leading-none">&times;</button>
            </div>
            <div className="overflow-y-auto flex-1 px-6 py-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">類型</label>
                  <select value={form.post_type} onChange={set('post_type')} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-500">
                    {Object.entries(TYPE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Slug（留空自動生成）</label>
                  <input value={form.slug} onChange={set('slug')} placeholder="url-safe-slug" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-500 font-mono" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">標題 *</label>
                <input value={form.title} onChange={set('title')} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-500" />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">摘要</label>
                <textarea value={form.excerpt} onChange={set('excerpt')} rows={2} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-500 resize-none" />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">封面圖片 URL</label>
                <input value={form.cover_image_url} onChange={set('cover_image_url')} type="url" placeholder="https://..." className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-500" />
                {form.cover_image_url && (
                  <img src={form.cover_image_url} alt="preview" className="mt-2 h-24 rounded object-cover" onError={e => e.target.style.display='none'} />
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">影音 URL</label>
                <input value={form.video_url} onChange={set('video_url')} type="url" placeholder="YouTube 連結或 MP4 URL" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-500" />
                {form.video_url && <p className="text-xs text-gray-400 mt-1">支援 YouTube 連結或 MP4 URL</p>}
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">全文（HTML）</label>
                <textarea value={form.body} onChange={set('body')} rows={8} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-500 font-mono text-xs resize-y" placeholder="<p>內文...</p>" />
              </div>

              <div className="grid grid-cols-2 gap-4 items-end">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">發佈時間</label>
                  <input type="datetime-local" value={form.published_at} onChange={set('published_at')} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-500" />
                </div>
                <div className="flex items-center gap-2 pb-2">
                  <input type="checkbox" id="is_published" checked={form.is_published} onChange={set('is_published')} className="w-4 h-4 accent-slate-700" />
                  <label htmlFor="is_published" className="text-sm text-gray-700">立即發佈</label>
                </div>
              </div>

              {error && <p className="text-red-500 text-xs">{error}</p>}
            </div>
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3 shrink-0">
              <button onClick={() => setModal(null)} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800">取消</button>
              <button onClick={save} disabled={saving} className="px-6 py-2 bg-slate-800 text-white rounded-lg text-sm hover:bg-slate-700 disabled:opacity-50">
                {saving ? '儲存中...' : '儲存'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
