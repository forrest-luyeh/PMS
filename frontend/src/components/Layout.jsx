import { NavLink, Outlet } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '../contexts/AuthContext'
import api from '../lib/api'

const ROLE_LABELS = {
  SUPER_ADMIN: '超級管理員', TENANT_ADMIN: '集團管理員', BRAND_ADMIN: '品牌管理員',
  ADMIN: '管理員', FRONT_DESK: '前台', HOUSEKEEPING: '房務', MANAGER: '主管',
}

const navItems = [
  { to: '/',              label: '儀表板',   roles: ['ADMIN','FRONT_DESK','MANAGER','TENANT_ADMIN','BRAND_ADMIN'] },
  { to: '/rooms',         label: '房態看板', roles: ['ADMIN','FRONT_DESK','MANAGER','HOUSEKEEPING','TENANT_ADMIN','BRAND_ADMIN'] },
  { to: '/reservations',  label: '訂房管理', roles: ['ADMIN','FRONT_DESK','MANAGER','TENANT_ADMIN','BRAND_ADMIN'] },
  { to: '/guests',        label: '客人管理', roles: ['ADMIN','FRONT_DESK','MANAGER','TENANT_ADMIN','BRAND_ADMIN'] },
  { to: '/housekeeping',  label: '房務看板', roles: ['ADMIN','HOUSEKEEPING','MANAGER','TENANT_ADMIN','BRAND_ADMIN'] },
  { to: '/users',         label: '用戶管理', roles: ['ADMIN','TENANT_ADMIN','BRAND_ADMIN'] },
  { to: '/admin/tenants',   label: '集團管理',     roles: ['SUPER_ADMIN'] },
  { to: '/admin/hotels',    label: '旅館列表',     roles: ['SUPER_ADMIN','TENANT_ADMIN','BRAND_ADMIN'] },
  { to: '/admin/dashboard', label: '跨集團儀表板', roles: ['SUPER_ADMIN'] },
  { to: '/manage/hotels', label: '管理旗下旅館', roles: ['TENANT_ADMIN','BRAND_ADMIN'] },
  { to: '/manage/rooms',  label: '房型/房間設定', roles: ['TENANT_ADMIN','BRAND_ADMIN','ADMIN'] },
  { to: '/manage/brands', label: '品牌管理',     roles: ['TENANT_ADMIN'] },
]

const HOTEL_MGMT_ROLES = ['TENANT_ADMIN', 'BRAND_ADMIN']

function HotelContextBar({ hotelCtx }) {
  const { data: hotels = [] } = useQuery({
    queryKey: ['admin-hotels'],
    queryFn: () => api.get('/admin/hotels').then(r => r.data),
    staleTime: 5 * 60 * 1000,
  })
  const { data: brands = [] } = useQuery({
    queryKey: ['admin-brands'],
    queryFn: () => api.get('/admin/brands').then(r => r.data),
    staleTime: 5 * 60 * 1000,
  })

  const hotel = hotels.find(h => h.id === hotelCtx.hotel_id)
  const brand = brands.find(b => b.id === hotelCtx.brand_id)

  if (!hotel) return null

  return (
    <div className="bg-slate-700 border-b border-slate-600 px-4 py-1.5 flex items-center gap-2 text-xs shrink-0">
      <span className="text-slate-400">目前旅館</span>
      {brand && <span className="text-slate-300">{brand.name}</span>}
      {brand && <span className="text-slate-500">·</span>}
      <span className="text-white font-medium">{hotel.name}</span>
      {hotel.region && (
        <span className="ml-1 bg-slate-600 text-slate-300 px-1.5 py-0.5 rounded">{hotel.region}</span>
      )}
    </div>
  )
}

export default function Layout() {
  const { user, logout, hotelCtx } = useAuth()
  const visible = navItems.filter(n => !user || n.roles.includes(user.role))
  const showContextBar = user && HOTEL_MGMT_ROLES.includes(user.role) && hotelCtx?.hotel_id

  return (
    <div className="flex h-screen bg-gray-50 text-sm">
      <aside className="w-52 bg-slate-800 text-slate-200 flex flex-col shrink-0">
        <div className="px-5 py-4 border-b border-slate-700">
          <div className="font-bold text-white text-base">旅館管理系統</div>
          <div className="text-slate-400 text-xs mt-0.5">Hotel PMS</div>
        </div>
        <nav className="flex-1 px-2 py-3 space-y-0.5">
          {visible.map(({ to, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `block px-3 py-2 rounded text-sm transition-colors ${
                  isActive ? 'bg-slate-600 text-white' : 'text-slate-300 hover:bg-slate-700'
                }`
              }
            >
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="px-4 py-3 border-t border-slate-700">
          <div className="text-slate-300 text-xs">{user?.name}</div>
          <div className="text-slate-500 text-xs">{ROLE_LABELS[user?.role]}</div>
          <button onClick={logout} className="text-xs text-red-400 hover:text-red-300 mt-1">登出</button>
        </div>
      </aside>
      <main className="flex-1 overflow-auto flex flex-col">
        {showContextBar && <HotelContextBar hotelCtx={hotelCtx} />}
        <div className="flex-1 overflow-auto">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
