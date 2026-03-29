import { useState, useEffect, useRef } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'

const ABOUT_LINKS = [
  { label: '雀客介紹',       to: '/about' },
  { label: '住房須知',       to: '/about/policy' },
  { label: '自助 Check-in', to: '/about/self-checkin' },
]

const BRAND_LINKS = [
  { label: '雀客藏居 SELECT',  to: '/hotels?brand=select' },
  { label: '雀客旅館 HOTEL',   to: '/hotels?brand=hotel' },
  { label: '雀客快捷 EXPRESS', to: '/hotels?brand=express' },
]

const REGION_LINKS = [
  { label: '台灣北部', to: '/hotels?region=北部' },
  { label: '台灣中部', to: '/hotels?region=中部' },
  { label: '台灣南部', to: '/hotels?region=南部' },
  { label: '台灣東部', to: '/hotels?region=東部' },
]

function Dropdown({ label, items }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className="px-3 py-2 text-sm text-gray-300 hover:text-white transition-colors rounded flex items-center gap-1"
      >
        {label}
        <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor" className={`transition-transform duration-200 ${open ? 'rotate-180' : ''}`}>
          <path d="M1 3l4 4 4-4" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
        </svg>
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-1 bg-gray-900 border border-white/10 rounded-lg py-1.5 w-44 shadow-xl z-50">
          {items.map(item => (
            <Link key={item.to} to={item.to} onClick={() => setOpen(false)}
              className="block px-4 py-2 text-sm text-gray-300 hover:text-white hover:bg-white/5 transition-colors">
              {item.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

export default function Navbar() {
  const [open, setOpen] = useState(false)
  const [mobileAbout, setMobileAbout] = useState(false)
  const [mobileBrand, setMobileBrand] = useState(false)
  const [mobileRegion, setMobileRegion] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const location = useLocation()
  const isHome = location.pathname === '/'

  // Close mobile menu on route change
  useEffect(() => { setOpen(false); setMobileAbout(false); setMobileBrand(false) }, [location.pathname])

  useEffect(() => {
    if (!isHome) return
    const onScroll = () => setScrolled(window.scrollY > 60)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [isHome])

  const opaque = !isHome || scrolled

  return (
    <nav className={`sticky top-0 z-50 transition-colors duration-300 ${
      opaque ? 'bg-primary shadow-md' : 'bg-transparent'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 font-bold text-white tracking-widest text-base shrink-0">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" className="shrink-0">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z" fill="currentColor" opacity=".3"/>
              <path d="M12 3.5c-2.5 0-4.7 1.1-6.2 2.9L9 9.5l2-2 2 2 3.2-3.1C14.7 4.6 12.5 3.5 12 3.5zM5 12c0 1.1.3 2.2.8 3.1L9 12l-2-2-2 2zm2.8 4.5C9.3 17.8 10.6 18.5 12 18.5s2.7-.7 4.2-2L15 15l-2 2-2-2-3.2 1.5zm9.4-1.4c.5-.9.8-2 .8-3.1l-2-2-2 2 3.2 3.1z" fill="currentColor"/>
            </svg>
            <span className="text-lg">CHECK <span className="font-light">inn</span></span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-0.5">
            <NavLink to="/"
              className="px-3 py-2 text-sm text-gray-300 hover:text-white transition-colors rounded">
              首頁
            </NavLink>
            <Dropdown label="品牌系列" items={BRAND_LINKS} />
            <Dropdown label="雀客據點" items={REGION_LINKS} />
            <NavLink to="/activities"
              className="px-3 py-2 text-sm text-gray-300 hover:text-white transition-colors rounded">
              促銷活動
            </NavLink>
            <NavLink to="/news"
              className="px-3 py-2 text-sm text-gray-300 hover:text-white transition-colors rounded">
              最新消息
            </NavLink>
            <Dropdown label="關於雀客" items={ABOUT_LINKS} />
            <NavLink to="/traveler"
              className="px-3 py-2 text-sm text-gray-300 hover:text-white transition-colors rounded">
              旅人誌
            </NavLink>
            <Link to="/booking/lookup"
              className="ml-3 px-4 py-1.5 border border-white/40 text-white text-sm rounded hover:bg-white hover:text-primary transition-colors">
              查詢訂房
            </Link>
          </div>

          {/* Mobile hamburger */}
          <button className="md:hidden p-2 text-white" onClick={() => setOpen(o => !o)} aria-label="選單">
            <div className={`w-5 h-0.5 bg-current transition-all mb-1.5 ${open ? 'rotate-45 translate-y-2' : ''}`} />
            <div className={`w-5 h-0.5 bg-current transition-all mb-1.5 ${open ? 'opacity-0' : ''}`} />
            <div className={`w-5 h-0.5 bg-current transition-all ${open ? '-rotate-45 -translate-y-2' : ''}`} />
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden bg-primary border-t border-white/10 px-4 py-3 space-y-1">
          <Link to="/" className="block text-sm text-gray-200 py-2.5 border-b border-white/10 hover:text-white">首頁</Link>

          {/* 品牌系列 accordion */}
          <div className="border-b border-white/10">
            <button onClick={() => setMobileBrand(o => !o)}
              className="w-full flex items-center justify-between text-sm text-gray-200 py-2.5 hover:text-white">
              品牌系列
              <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor" className={`transition-transform ${mobileBrand ? 'rotate-180' : ''}`}>
                <path d="M1 3l4 4 4-4" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
              </svg>
            </button>
            {mobileBrand && (
              <div className="pl-4 pb-1 space-y-1">
                {BRAND_LINKS.map(l => (
                  <Link key={l.to} to={l.to} className="block text-sm text-gray-400 py-1.5 hover:text-white">{l.label}</Link>
                ))}
              </div>
            )}
          </div>

          {/* 雀客據點 accordion */}
          <div className="border-b border-white/10">
            <button onClick={() => setMobileRegion(o => !o)}
              className="w-full flex items-center justify-between text-sm text-gray-200 py-2.5 hover:text-white">
              雀客據點
              <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor" className={`transition-transform ${mobileRegion ? 'rotate-180' : ''}`}>
                <path d="M1 3l4 4 4-4" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
              </svg>
            </button>
            {mobileRegion && (
              <div className="pl-4 pb-1 space-y-1">
                {REGION_LINKS.map(l => (
                  <Link key={l.to} to={l.to} className="block text-sm text-gray-400 py-1.5 hover:text-white">{l.label}</Link>
                ))}
              </div>
            )}
          </div>

          <Link to="/activities" className="block text-sm text-gray-200 py-2.5 border-b border-white/10 hover:text-white">促銷活動</Link>
          <Link to="/news" className="block text-sm text-gray-200 py-2.5 border-b border-white/10 hover:text-white">最新消息</Link>

          {/* 關於雀客 accordion */}
          <div className="border-b border-white/10">
            <button onClick={() => setMobileAbout(o => !o)}
              className="w-full flex items-center justify-between text-sm text-gray-200 py-2.5 hover:text-white">
              關於雀客
              <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor" className={`transition-transform ${mobileAbout ? 'rotate-180' : ''}`}>
                <path d="M1 3l4 4 4-4" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
              </svg>
            </button>
            {mobileAbout && (
              <div className="pl-4 pb-1 space-y-1">
                {ABOUT_LINKS.map(l => (
                  <Link key={l.to} to={l.to} className="block text-sm text-gray-400 py-1.5 hover:text-white">{l.label}</Link>
                ))}
              </div>
            )}
          </div>

          <Link to="/traveler" className="block text-sm text-gray-200 py-2.5 border-b border-white/10 hover:text-white">旅人誌</Link>
          <Link to="/booking/lookup" className="block text-sm text-white py-2.5 font-medium">查詢訂房</Link>
        </div>
      )}
    </nav>
  )
}
