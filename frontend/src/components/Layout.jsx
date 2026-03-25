import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

const ROLE_LABELS = { ADMIN: '管理員', FRONT_DESK: '前台', HOUSEKEEPING: '房務', MANAGER: '主管' }

const navItems = [
  { to: '/',              label: '儀表板',   roles: ['ADMIN','FRONT_DESK','MANAGER'] },
  { to: '/rooms',         label: '房態看板', roles: ['ADMIN','FRONT_DESK','MANAGER','HOUSEKEEPING'] },
  { to: '/reservations',  label: '訂房管理', roles: ['ADMIN','FRONT_DESK','MANAGER'] },
  { to: '/guests',        label: '客人管理', roles: ['ADMIN','FRONT_DESK','MANAGER'] },
  { to: '/housekeeping',  label: '房務看板', roles: ['ADMIN','HOUSEKEEPING','MANAGER'] },
  { to: '/users',         label: '用戶管理', roles: ['ADMIN'] },
]

export default function Layout() {
  const { user, logout } = useAuth()
  const visible = navItems.filter(n => !user || n.roles.includes(user.role))

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
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  )
}
