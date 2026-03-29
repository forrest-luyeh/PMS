import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import api from '../../lib/api'
import Modal from '../../components/Modal'

const EMPTY = { name: '', slug: '', address: '', phone: '', region: '', check_in_time: '15:00', check_out_time: '11:00', description: '', is_featured: false }
const REGIONS = ['北部', '中部', '南部', '東部', '離島']

export default function ManageHotels() {
  const { user, switchHotel, hotelCtx } = useAuth()
  const qc = useQueryClient()
  const navigate = useNavigate()
  const [selectedBrandId, setSelectedBrandId] = useState(null)
  const [modal, setModal] = useState(null)

  const { data: brands = [] } = useQuery({
    queryKey: ['admin-brands'],
    queryFn: () => api.get('/admin/brands').then(r => r.data),
  })
  const { data: hotels = [] } = useQuery({
    queryKey: ['admin-hotels'],
    queryFn: () => api.get('/admin/hotels').then(r => r.data),
  })

  // Auto-select first brand on load
  const activeBrandId = selectedBrandId ?? brands[0]?.id ?? null
  const filteredHotels = hotels.filter(h => h.brand_id === activeBrandId)
  const activeBrand = brands.find(b => b.id === activeBrandId)

  const handleSwitch = async (hotelId) => {
    try { await switchHotel(hotelId); qc.clear() }
    catch { alert('切換失敗') }
  }

  const save = useMutation({
    mutationFn: (form) => modal.mode === 'add'
      ? api.post('/admin/hotels', { ...form, tenant_id: user.tenant_id })
      : api.put(`/admin/hotels/${modal.data.id}`, form),
    onSuccess: () => { qc.invalidateQueries(['admin-hotels']); setModal(null) },
  })

  const toggle = useMutation({
    mutationFn: ({ id, active }) =>
      api.patch(`/admin/hotels/${id}/${active ? 'deactivate' : 'activate'}`),
    onSuccess: () => qc.invalidateQueries(['admin-hotels']),
  })

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold text-gray-900 mb-4">管理旗下旅館</h1>

      {/* Brand selector */}
      <div className="flex items-center gap-2 mb-5 flex-wrap">
        {brands.map(b => (
          <button
            key={b.id}
            onClick={() => setSelectedBrandId(b.id)}
            className={`px-4 py-2 rounded-full text-sm font-medium border transition-colors ${
              b.id === activeBrandId
                ? 'bg-slate-800 text-white border-slate-800'
                : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400'
            }`}
          >
            {b.name}
            <span className="ml-1.5 text-xs opacity-70">
              ({hotels.filter(h => h.brand_id === b.id).length})
            </span>
          </button>
        ))}
      </div>

      {/* Hotels for selected brand */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-medium text-gray-500">
          {activeBrand?.name ?? '—'} · {filteredHotels.length} 間旅館
        </h2>
        <button
          onClick={() => setModal({ mode: 'add', data: { ...EMPTY, brand_id: activeBrandId } })}
          className="bg-slate-800 text-white px-3 py-1.5 rounded-lg text-xs hover:bg-slate-700"
        >
          + 新增旅館
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filteredHotels.map(h => {
          const isCurrent = h.id === hotelCtx?.hotel_id
          return (
            <div key={h.id} className={`border rounded-xl p-4 bg-white shadow-sm flex flex-col gap-3 ${isCurrent ? 'border-blue-500 ring-1 ring-blue-300' : 'border-gray-200'}`}>
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="font-semibold text-gray-900 truncate">{h.name}</div>
                  <div className="text-xs text-gray-400 mt-0.5 flex items-center gap-1 flex-wrap">
                    {h.region && <span className="bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">{h.region}</span>}
                    <span className="truncate">{h.address || '—'}</span>
                  </div>
                  {h.phone && <div className="text-xs text-gray-400 mt-0.5">{h.phone}</div>}
                  {(h.check_in_time || h.check_out_time) && (
                    <div className="text-xs text-gray-400 mt-0.5">
                      入住 {h.check_in_time} · 退房 {h.check_out_time}
                    </div>
                  )}
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className={`text-xs px-2 py-0.5 rounded-full shrink-0 ${h.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                    {h.is_active ? '啟用' : '停用'}
                  </span>
                  {h.is_featured && <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700">精選</span>}
                </div>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                {isCurrent ? (
                  <span className="text-xs text-blue-600 font-medium">● 目前使用中</span>
                ) : (
                  <button onClick={() => handleSwitch(h.id)}
                    className="text-xs px-3 py-1.5 bg-slate-800 text-white rounded-lg hover:bg-slate-700">
                    切換
                  </button>
                )}
                <button
                  onClick={() => setModal({ mode: 'edit', data: { ...h } })}
                  className="text-xs px-3 py-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-600"
                >
                  編輯
                </button>
                <button
                  onClick={() => handleSwitch(h.id).then(() => navigate('/manage/rooms'))}
                  className="text-xs px-3 py-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-600"
                >
                  房型/房間
                </button>
                <button
                  onClick={() => toggle.mutate({ id: h.id, active: h.is_active })}
                  className={`text-xs px-3 py-1.5 rounded-lg ml-auto ${h.is_active ? 'text-red-500 hover:bg-red-50' : 'text-green-600 hover:bg-green-50'}`}
                >
                  {h.is_active ? '停用' : '啟用'}
                </button>
              </div>
            </div>
          )
        })}
        {filteredHotels.length === 0 && (
          <p className="text-gray-400 text-sm col-span-3 py-8 text-center">此品牌尚無旅館</p>
        )}
      </div>

      {modal && (
        <HotelModal
          mode={modal.mode}
          initial={modal.data}
          brands={brands}
          loading={save.isPending}
          error={save.error?.response?.data?.detail}
          onClose={() => setModal(null)}
          onSubmit={(form) => save.mutate(form)}
        />
      )}
    </div>
  )
}

function HotelModal({ mode, initial, brands, loading, error, onClose, onSubmit }) {
  const [form, setForm] = useState(initial)
  const [tab, setTab] = useState('basic')
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))
  const hotelId = initial?.id
  const qc = useQueryClient()

  // Images
  const { data: images = [] } = useQuery({
    queryKey: ['hotel-images', hotelId],
    queryFn: () => api.get(`/admin/hotels/${hotelId}/images`).then(r => r.data),
    enabled: mode === 'edit' && !!hotelId,
  })
  const [newImgUrl, setNewImgUrl] = useState('')
  const [newImgAlt, setNewImgAlt] = useState('')
  const addImg = useMutation({
    mutationFn: () => api.post(`/admin/hotels/${hotelId}/images`, { url: newImgUrl, alt_text: newImgAlt, sort_order: images.length }),
    onSuccess: () => { qc.invalidateQueries(['hotel-images', hotelId]); setNewImgUrl(''); setNewImgAlt('') },
  })
  const delImg = useMutation({
    mutationFn: (imgId) => api.delete(`/admin/hotels/${hotelId}/images/${imgId}`),
    onSuccess: () => qc.invalidateQueries(['hotel-images', hotelId]),
  })

  // Amenities
  const { data: amenities = [] } = useQuery({
    queryKey: ['hotel-amenities', hotelId],
    queryFn: () => api.get(`/admin/hotels/${hotelId}/amenities`).then(r => r.data),
    enabled: mode === 'edit' && !!hotelId,
  })
  const [newAmenityName, setNewAmenityName] = useState('')
  const [newAmenityCategory, setNewAmenityCategory] = useState('')
  const addAmenity = useMutation({
    mutationFn: () => api.post(`/admin/hotels/${hotelId}/amenities`, { name: newAmenityName, category: newAmenityCategory }),
    onSuccess: () => { qc.invalidateQueries(['hotel-amenities', hotelId]); setNewAmenityName(''); setNewAmenityCategory('') },
  })
  const delAmenity = useMutation({
    mutationFn: (id) => api.delete(`/admin/hotels/${hotelId}/amenities/${id}`),
    onSuccess: () => qc.invalidateQueries(['hotel-amenities', hotelId]),
  })

  const TABS = mode === 'edit'
    ? [['basic', '基本資訊'], ['images', `圖片 (${images.length})`], ['amenities', `設施 (${amenities.length})`]]
    : [['basic', '基本資訊']]

  return (
    <Modal title={mode === 'add' ? '新增旅館' : '編輯旅館'} onClose={onClose}>
      {/* Tab bar */}
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
        <Field label="旅館名稱">
          <input value={form.name} onChange={e => set('name', e.target.value)} className="input" required />
        </Field>
        {mode === 'add' && (
          <>
            <Field label="Slug（英文唯一識別）">
              <input value={form.slug} onChange={e => set('slug', e.target.value)} className="input" placeholder="e.g. taipei-main" />
            </Field>
            <Field label="所屬品牌">
              <select value={form.brand_id} onChange={e => set('brand_id', Number(e.target.value))} className="input">
                {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </Field>
          </>
        )}
        <div className="grid grid-cols-2 gap-3">
          <Field label="地區">
            <select value={form.region || ''} onChange={e => set('region', e.target.value)} className="input">
              <option value="">—</option>
              {REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </Field>
          <Field label="電話">
            <input value={form.phone || ''} onChange={e => set('phone', e.target.value)} className="input" placeholder="+886-2-..." />
          </Field>
        </div>
        <Field label="地址">
          <input value={form.address || ''} onChange={e => set('address', e.target.value)} className="input" />
        </Field>
        <Field label="旅館執照號碼">
          <input value={form.license_number || ''} onChange={e => set('license_number', e.target.value)} className="input" placeholder="臺北市旅館463號" />
        </Field>
        <Field label="旅館介紹（選填）">
          <textarea value={form.description || ''} onChange={e => set('description', e.target.value)} rows={3} className="input" placeholder="2~3 句旅館特色說明..." />
        </Field>
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input type="checkbox" checked={!!form.is_featured} onChange={e => set('is_featured', e.target.checked)} />
          在公開網站首頁精選顯示
        </label>
        <div className="grid grid-cols-2 gap-3">
          <Field label="入住時間">
            <input value={form.check_in_time || ''} onChange={e => set('check_in_time', e.target.value)} className="input" placeholder="15:00" />
          </Field>
          <Field label="退房時間">
            <input value={form.check_out_time || ''} onChange={e => set('check_out_time', e.target.value)} className="input" placeholder="11:00" />
          </Field>
        </div>
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
              <input value={newAmenityName} onChange={e => setNewAmenityName(e.target.value)} className="input" placeholder="免費 Wi-Fi" />
            </Field>
            <Field label="分類（選填）">
              <input value={newAmenityCategory} onChange={e => setNewAmenityCategory(e.target.value)} className="input" placeholder="服務 / 交通 / 安全" />
            </Field>
          </div>
          <button onClick={() => newAmenityName && addAmenity.mutate()} disabled={!newAmenityName || addAmenity.isPending}
            className="text-xs px-3 py-1.5 bg-slate-800 text-white rounded-lg hover:bg-slate-700 disabled:opacity-50">
            + 新增設施
          </button>
        </div>
      )}
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
