import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../../lib/api'

export default function AdminTenants() {
  const qc = useQueryClient()
  const { data: tree = [], isLoading } = useQuery({
    queryKey: ['admin-tenants-tree'],
    queryFn: () => api.get('/admin/tenants/tree').then(r => r.data),
  })

  const toggleTenant = useMutation({
    mutationFn: ({ id, active }) =>
      api.patch(`/admin/tenants/${id}/${active ? 'deactivate' : 'activate'}`),
    onSuccess: () => qc.invalidateQueries(['admin-tenants-tree']),
  })

  if (isLoading) return <div className="p-6 text-gray-400">載入中...</div>

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold text-gray-900 mb-6">集團管理</h1>
      <div className="space-y-4">
        {tree.map(tenant => (
          <TenantNode
            key={tenant.id}
            tenant={tenant}
            onToggle={() => toggleTenant.mutate({ id: tenant.id, active: tenant.is_active })}
          />
        ))}
      </div>
    </div>
  )
}

function TenantNode({ tenant, onToggle }) {
  const [open, setOpen] = useState(true)
  const hotelCount = tenant.brands.reduce((s, b) => s + b.hotels.length, 0)

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden shadow-sm">
      {/* Tenant header */}
      <div className="flex items-center justify-between bg-slate-800 text-white px-4 py-3">
        <button
          onClick={() => setOpen(o => !o)}
          className="flex items-center gap-2 text-left flex-1 min-w-0"
        >
          <span className="text-sm">{open ? '▾' : '▸'}</span>
          <span className="font-semibold truncate">{tenant.name}</span>
          <span className="text-slate-400 text-xs ml-1">{tenant.slug}</span>
          <span className="ml-2 bg-slate-600 text-slate-200 text-xs px-2 py-0.5 rounded-full whitespace-nowrap">
            {tenant.brands.length} 品牌 · {hotelCount} 旅館
          </span>
        </button>
        <div className="flex items-center gap-2 ml-4 shrink-0">
          <span className={`text-xs px-2 py-0.5 rounded-full ${tenant.is_active ? 'bg-green-500' : 'bg-red-500'}`}>
            {tenant.is_active ? '啟用' : '停用'}
          </span>
          <button
            onClick={onToggle}
            className={`text-xs px-2 py-1 rounded border ${tenant.is_active
              ? 'border-red-400 text-red-300 hover:bg-red-900'
              : 'border-green-400 text-green-300 hover:bg-green-900'}`}
          >
            {tenant.is_active ? '停用' : '啟用'}
          </button>
        </div>
      </div>

      {/* Brands + Hotels */}
      {open && (
        <div className="divide-y divide-gray-100 bg-white">
          {tenant.brands.map(brand => (
            <BrandNode key={brand.id} brand={brand} />
          ))}
          {tenant.brands.length === 0 && (
            <p className="px-6 py-3 text-sm text-gray-400">尚無品牌</p>
          )}
        </div>
      )}
    </div>
  )
}

function BrandNode({ brand }) {
  const [open, setOpen] = useState(true)

  return (
    <div>
      {/* Brand row */}
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-2 px-5 py-2.5 bg-slate-50 hover:bg-slate-100 text-left"
      >
        <span className="text-xs text-slate-400">{open ? '▾' : '▸'}</span>
        <span className="text-sm font-medium text-slate-700">{brand.name}</span>
        <span className="text-slate-400 text-xs">{brand.slug}</span>
        <span className="ml-auto text-xs text-slate-500">{brand.hotels.length} 間旅館</span>
        <span className={`text-xs px-1.5 py-0.5 rounded ${brand.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
          {brand.is_active ? '啟用' : '停用'}
        </span>
      </button>

      {/* Hotels grid */}
      {open && (
        <div className="px-8 py-2 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 bg-white">
          {brand.hotels.map(hotel => (
            <div
              key={hotel.id}
              className={`border rounded-lg px-3 py-2 text-xs ${hotel.is_active ? 'border-gray-200' : 'border-red-200 bg-red-50'}`}
            >
              <div className="font-medium text-gray-800 truncate">{hotel.name}</div>
              <div className="flex items-center gap-2 mt-0.5 text-gray-400">
                {hotel.region && (
                  <span className="bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">{hotel.region}</span>
                )}
                <span className="truncate">{hotel.address || '—'}</span>
              </div>
            </div>
          ))}
          {brand.hotels.length === 0 && (
            <p className="text-gray-400 py-1">尚無旅館</p>
          )}
        </div>
      )}
    </div>
  )
}
