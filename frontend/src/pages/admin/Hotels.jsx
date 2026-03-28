import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../../lib/api'

export default function AdminHotels() {
  const qc = useQueryClient()
  const { data } = useQuery({ queryKey: ['admin-hotels'], queryFn: () => api.get('/admin/hotels').then(r => r.data) })
  const hotels = data ?? []

  const toggle = useMutation({
    mutationFn: ({ id, active }) => api.patch(`/admin/hotels/${id}/${active ? 'deactivate' : 'activate'}`),
    onSuccess: () => qc.invalidateQueries(['admin-hotels']),
  })

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold mb-4">旅館列表</h1>
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="bg-slate-100 text-left">
            <th className="px-3 py-2 border">ID</th>
            <th className="px-3 py-2 border">旅館名稱</th>
            <th className="px-3 py-2 border">Slug</th>
            <th className="px-3 py-2 border">地址</th>
            <th className="px-3 py-2 border">狀態</th>
            <th className="px-3 py-2 border">操作</th>
          </tr>
        </thead>
        <tbody>
          {hotels.map(h => (
            <tr key={h.id} className="border-b">
              <td className="px-3 py-2 border">{h.id}</td>
              <td className="px-3 py-2 border font-medium">{h.name}</td>
              <td className="px-3 py-2 border text-gray-500">{h.slug}</td>
              <td className="px-3 py-2 border">{h.address || '—'}</td>
              <td className="px-3 py-2 border">
                <span className={`px-2 py-0.5 rounded text-xs ${h.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  {h.is_active ? '啟用' : '停用'}
                </span>
              </td>
              <td className="px-3 py-2 border">
                <button onClick={() => toggle.mutate({ id: h.id, active: h.is_active })}
                  className={`text-xs px-2 py-1 rounded ${h.is_active ? 'bg-red-500 text-white' : 'bg-green-500 text-white'}`}>
                  {h.is_active ? '停用' : '啟用'}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
