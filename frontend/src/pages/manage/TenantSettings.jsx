import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../../lib/api'

export default function TenantSettings() {
  const qc = useQueryClient()
  const [form, setForm] = useState({
    contact_phone: '', social_instagram: '', social_facebook: '', social_line: '',
  })
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['tenant-settings'],
    queryFn: () => api.get('/admin/tenant-settings').then(r => r.data),
  })

  useEffect(() => {
    if (data) {
      setForm({
        contact_phone: data.contact_phone || '',
        social_instagram: data.social_instagram || '',
        social_facebook: data.social_facebook || '',
        social_line: data.social_line || '',
      })
    }
  }, [data])

  const saveMutation = useMutation({
    mutationFn: (payload) => api.put('/admin/tenant-settings', payload),
    onSuccess: () => {
      qc.invalidateQueries(['tenant-settings'])
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    },
    onError: (e) => setError(e.response?.data?.detail || 'Error'),
  })

  function handleSubmit(e) {
    e.preventDefault()
    setError('')
    const payload = {}
    Object.entries(form).forEach(([k, v]) => { if (v !== '') payload[k] = v })
    saveMutation.mutate(payload)
  }

  function field(key, label, placeholder = '') {
    return (
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
        <input
          value={form[key]}
          onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
          placeholder={placeholder}
          className="w-full border rounded-lg px-3 py-2 text-sm"
        />
      </div>
    )
  }

  if (isLoading) return <div className="p-6 text-gray-400">載入中...</div>

  return (
    <div className="p-6 max-w-xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">集團設定</h1>

      {data && (
        <div className="bg-gray-50 rounded-xl p-4 mb-6 text-sm text-gray-600">
          <p><span className="font-medium">集團名稱：</span>{data.name}</p>
          <p><span className="font-medium">Slug：</span>{data.slug}</p>
          <p><span className="font-medium">聯絡 Email：</span>{data.contact_email}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border p-6 space-y-4">
        <h2 className="text-base font-semibold mb-1">聯絡資訊</h2>
        {field('contact_phone', '聯絡電話', '02-12345678')}

        <h2 className="text-base font-semibold mt-4 mb-1">社群媒體</h2>
        {field('social_instagram', 'Instagram URL', 'https://instagram.com/checkinn')}
        {field('social_facebook', 'Facebook URL', 'https://facebook.com/checkinn')}
        {field('social_line', 'LINE 官方帳號 URL', 'https://line.me/R/ti/p/@checkinn')}

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex items-center gap-3 pt-2">
          <button
            type="submit"
            disabled={saveMutation.isPending}
            className="px-5 py-2 bg-black text-white rounded-lg text-sm hover:bg-gray-800 disabled:opacity-50"
          >
            {saveMutation.isPending ? '儲存中...' : '儲存設定'}
          </button>
          {saved && <span className="text-sm text-green-600">已儲存</span>}
        </div>
      </form>
    </div>
  )
}
