import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import api from '../lib/api'

const BRANDS = [
  { label: '雀客藏居 SELECT', to: '/hotels?brand=select' },
  { label: '雀客旅館 HOTEL',  to: '/hotels?brand=hotel' },
  { label: '雀客快捷 EXPRESS', to: '/hotels?brand=express' },
]
const LINKS = [
  { label: '雀客據點', to: '/hotels' },
  { label: '促銷活動', to: '/activities' },
  { label: '最新消息', to: '/news' },
  { label: '旅人誌',   to: '/traveler' },
  { label: '雀客介紹', to: '/about' },
  { label: '住房須知', to: '/about/policy' },
  { label: '自助 Check-in', to: '/about/self-checkin' },
  { label: '查詢訂房', to: '/booking/lookup' },
]

export default function Footer() {
  const { data: tenantConfig } = useQuery({
    queryKey: ['public-tenant-config'],
    queryFn: () => api.get('/tenant-config', { params: { tenant_slug: 'checkinn' } }).then(r => r.data),
    staleTime: 10 * 60 * 1000,
  })

  const phone = tenantConfig?.contact_phone || '+886-4-3509-5396'
  const igUrl = tenantConfig?.social_instagram || 'https://www.instagram.com/checkinn_official'
  const fbUrl = tenantConfig?.social_facebook || 'https://www.facebook.com/checkinn'
  const lineUrl = tenantConfig?.social_line

  return (
    <footer className="bg-primary text-white mt-0">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-14 pb-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-10">
          {/* Brand */}
          <div className="md:col-span-1">
            <div className="text-xl font-bold tracking-widest mb-1">CHECK <span className="font-light">inn</span></div>
            <p className="text-xs text-gray-400 tracking-[0.2em] mb-4">STAY EASY. STAY SMART.</p>
            <p className="text-sm text-gray-300 leading-relaxed">
              雀客旅館集團，台灣連鎖精品旅館，<br />
              29 間旅館遍佈全台。
            </p>
            <p className="text-sm text-gray-400 mt-3">Tel: {phone}</p>
          </div>

          {/* Brand series */}
          <div>
            <h4 className="text-xs font-semibold tracking-widest uppercase text-gray-400 mb-4">品牌系列</h4>
            <ul className="space-y-2">
              {BRANDS.map(b => (
                <li key={b.label}>
                  <Link to={b.to} className="text-sm text-gray-300 hover:text-white transition-colors">{b.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Quick links */}
          <div>
            <h4 className="text-xs font-semibold tracking-widest uppercase text-gray-400 mb-4">快速連結</h4>
            <ul className="space-y-2">
              {LINKS.map(l => (
                <li key={l.label}>
                  <Link to={l.to} className="text-sm text-gray-300 hover:text-white transition-colors">{l.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Social & contact */}
          <div>
            <h4 className="text-xs font-semibold tracking-widest uppercase text-gray-400 mb-4">聯絡我們</h4>
            <div className="flex gap-4 mb-5">
              <a href={igUrl} target="_blank" rel="noreferrer"
                className="w-9 h-9 border border-white/20 rounded-full flex items-center justify-center text-gray-300 hover:text-white hover:border-white transition-colors text-xs font-bold">
                IG
              </a>
              <a href={fbUrl} target="_blank" rel="noreferrer"
                className="w-9 h-9 border border-white/20 rounded-full flex items-center justify-center text-gray-300 hover:text-white hover:border-white transition-colors text-xs font-bold">
                FB
              </a>
              {lineUrl ? (
                <a href={lineUrl} target="_blank" rel="noreferrer"
                  className="w-9 h-9 border border-white/20 rounded-full flex items-center justify-center text-gray-300 hover:text-white hover:border-white transition-colors text-xs font-bold">
                  LINE
                </a>
              ) : (
                <span className="w-9 h-9 border border-white/10 rounded-full flex items-center justify-center text-gray-600 text-xs font-bold">
                  LINE
                </span>
              )}
            </div>
            <p className="text-xs text-gray-500 leading-relaxed">
              行銷合作 / 訂房諮詢 / 企業住房<br />
              歡迎透過社群私訊聯繫
            </p>
          </div>
        </div>

        <div className="border-t border-white/10 pt-6 flex flex-col md:flex-row justify-between items-center gap-2 text-xs text-gray-500">
          <span>© {new Date().getFullYear()} 雀客國際酒店股份有限公司 CHECKinn International Hotel Corp. All rights reserved.</span>
          <div className="flex gap-4">
            <span className="hover:text-gray-300 cursor-pointer transition-colors">隱私政策</span>
            <span className="hover:text-gray-300 cursor-pointer transition-colors">會員條款</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
