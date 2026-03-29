import { useState, useEffect, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import api from '../lib/api'
import BookingWidget from '../components/BookingWidget'
import HotelCard from '../components/HotelCard'

// ── Brand data ─────────────────────────────────────────────────────────────────

const DEFAULT_SLIDES = [
  {
    image_url: 'https://picsum.photos/seed/checkinn-hero-main/1920/1080',
    label: "Taiwan's Smartest Hotel Chain",
    headline: 'STAY EASY.',
    subline: 'STAY SMART.',
  },
]

const BRANDS = [
  {
    slug: 'select',
    name: '雀客藏居',
    en: 'CHECK inn Select',
    tagline: '精品溫泉 · 私人湯屋 · 靜謐奢華',
    // representative hotel slug for cover image
    hotelSlug: 'yangmingshan',
  },
  {
    slug: 'hotel',
    name: '雀客旅館',
    en: 'CHECK inn Hotel',
    tagline: '城市核心 · 智能設施 · 輕鬆商旅',
    hotelSlug: 'songjiang',
  },
  {
    slug: 'express',
    name: '雀客快捷',
    en: 'CHECK inn Express',
    tagline: '超值平價 · 交通便利 · 聰明旅行',
    hotelSlug: 'taipei-station',
  },
]

// ── Helpers ────────────────────────────────────────────────────────────────────

function SectionHeading({ label, title, subtitle, link, linkLabel = '查看全部 →', light = false }) {
  return (
    <div className="flex items-end justify-between mb-8">
      <div>
        {label && <p className={`text-xs tracking-[0.3em] uppercase mb-2 ${light ? 'text-gray-500' : 'text-gray-400'}`}>{label}</p>}
        <h2 className={`text-2xl md:text-3xl font-bold ${light ? 'text-white' : 'text-primary'}`}>{title}</h2>
        {subtitle && <p className={`text-sm mt-1 ${light ? 'text-gray-400' : 'text-gray-500'}`}>{subtitle}</p>}
      </div>
      {link && (
        <Link to={link} className={`text-sm shrink-0 ml-4 transition-colors ${light ? 'text-gray-400 hover:text-white' : 'text-gray-400 hover:text-primary'}`}>
          {linkLabel}
        </Link>
      )}
    </div>
  )
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function Home() {
  const [slide, setSlide] = useState(0)
  const navigate = useNavigate()

  const { data: slides = DEFAULT_SLIDES } = useQuery({
    queryKey: ['public-hero-slides'],
    queryFn: () => api.get('/hero-slides', { params: { tenant_slug: 'checkinn' } }).then(r => r.data.length ? r.data : DEFAULT_SLIDES),
    staleTime: 5 * 60 * 1000,
  })

  const { data: testimonials = [] } = useQuery({
    queryKey: ['public-testimonials'],
    queryFn: () => api.get('/testimonials', { params: { tenant_slug: 'checkinn' } }).then(r => r.data),
    staleTime: 5 * 60 * 1000,
  })

  const next = useCallback(() => setSlide(s => (s + 1) % slides.length), [slides.length])
  const prev = useCallback(() => setSlide(s => (s - 1 + slides.length) % slides.length), [slides.length])

  useEffect(() => {
    const id = setInterval(next, 5000)
    return () => clearInterval(id)
  }, [next])

  const { data: hotels = [] } = useQuery({
    queryKey: ['public-hotels'],
    queryFn: () => api.get('/hotels', { params: { tenant_slug: 'checkinn' } }).then(r => r.data),
  })
  const { data: featuredHotels = [] } = useQuery({
    queryKey: ['public-featured-hotels'],
    queryFn: () => api.get('/hotels', { params: { tenant_slug: 'checkinn', featured: true } }).then(r => r.data),
    staleTime: 5 * 60 * 1000,
  })
  const { data: activities = [] } = useQuery({
    queryKey: ['public-posts', 'activity'],
    queryFn: () => api.get('/posts', { params: { tenant_slug: 'checkinn', type: 'activity', limit: 3 } }).then(r => r.data),
  })
  const { data: newsList = [] } = useQuery({
    queryKey: ['public-posts', 'news'],
    queryFn: () => api.get('/posts', { params: { tenant_slug: 'checkinn', type: 'news', limit: 4 } }).then(r => r.data),
  })

  const hotelMap = Object.fromEntries(hotels.map(h => [h.slug, h]))

  return (
    <div className="overflow-x-hidden">

      {/* ── Hero Carousel ──────────────────────────────────────────────── */}
      <section className="relative h-[85vh] min-h-[500px] overflow-hidden bg-gray-950">
        {slides.map((s, i) => (
          <div key={i} className={`absolute inset-0 transition-opacity duration-1000 ${i === slide ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
            <img src={s.image_url} alt={s.headline} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/30 to-black/70" />
          </div>
        ))}

        {slides[slide] && (
          <div className="relative h-full flex flex-col items-center justify-center text-center px-4">
            {slides[slide].label && (
              <p className="text-xs md:text-sm tracking-[0.4em] text-gray-300 uppercase mb-5">
                {slides[slide].label}
              </p>
            )}
            <h1 className="text-5xl md:text-7xl font-bold text-white leading-none tracking-tight mb-3">
              {slides[slide].headline}
            </h1>
            {slides[slide].subline && (
              <p className="text-gray-300 text-lg md:text-xl mb-8">
                {slides[slide].subline}
              </p>
            )}
            {slides[slide].link_url && (
              <Link to={slides[slide].link_url}
                className="px-8 py-2.5 border border-white/50 text-white text-sm rounded hover:bg-white hover:text-primary transition-colors">
                {slides[slide].link_label || '了解更多'}
              </Link>
            )}
          </div>
        )}

        {/* Arrows */}
        {slides.length > 1 && <>
          <button onClick={prev} aria-label="上一張"
            className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center text-white/60 hover:text-white bg-black/20 hover:bg-black/50 rounded-full transition-colors z-10">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button onClick={next} aria-label="下一張"
            className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center text-white/60 hover:text-white bg-black/20 hover:bg-black/50 rounded-full transition-colors z-10">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </>}

        {/* Dots */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-10">
          {slides.map((_, i) => (
            <button key={i} onClick={() => setSlide(i)} aria-label={`第 ${i + 1} 張`}
              className={`transition-all duration-300 rounded-full ${i === slide ? 'w-6 h-2 bg-white' : 'w-2 h-2 bg-white/40 hover:bg-white/70'}`} />
          ))}
        </div>
      </section>

      {/* ── Booking Widget ─────────────────────────────────────────────── */}
      <section className="bg-white py-10 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-xs tracking-[0.3em] text-gray-400 uppercase mb-4">Online Reservation</p>
          <BookingWidget />
        </div>
      </section>

      {/* ── Brand Series ───────────────────────────────────────────────── */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeading label="Brand Series" title="三大品牌系列" />
          <div className="grid md:grid-cols-3 gap-6">
            {BRANDS.map(b => {
              const hotel = hotelMap[b.hotelSlug]
              const imgUrl = hotel?.images?.[0]?.url || `https://picsum.photos/seed/${b.hotelSlug}/800/600`
              return (
                <button key={b.slug} onClick={() => navigate(`/hotels?brand=${b.slug}`)}
                  className="group text-left rounded-2xl overflow-hidden shadow hover:shadow-xl transition-shadow">
                  <div className="relative h-52 overflow-hidden bg-gray-200">
                    <img src={imgUrl} alt={b.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                    <div className="absolute bottom-4 left-4">
                      <p className="text-xs text-gray-300 tracking-widest uppercase mb-0.5">{b.en}</p>
                      <h3 className="text-xl font-bold text-white">{b.name}</h3>
                    </div>
                  </div>
                  <div className="bg-white px-5 py-4">
                    <p className="text-sm text-gray-500 mb-3">{b.tagline}</p>
                    <span className="text-xs text-primary font-medium group-hover:underline">查看旅館 →</span>
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      </section>

      {/* ── Featured Properties ────────────────────────────────────────── */}
      {featuredHotels.length > 0 && (
        <section className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <SectionHeading label="Featured Properties" title="精選旅館" subtitle="三大品牌代表旅館" link="/hotels" />
            <div className="grid md:grid-cols-3 gap-6">
              {featuredHotels.map(h => <HotelCard key={h.id} hotel={h} />)}
            </div>
          </div>
        </section>
      )}

      {/* ── Promotions ─────────────────────────────────────────────────── */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeading label="Promotions" title="促銷活動" subtitle="最新優惠與限時活動" link="/activities" />
          {activities.length === 0 ? (
            <p className="text-center text-gray-400 py-12">暫無活動，敬請期待</p>
          ) : (
            <div className="grid md:grid-cols-3 gap-6">
              {activities.map(p => (
                <Link key={p.id} to={`/posts/${p.slug}?tenant_slug=checkinn`}
                  className="group overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm hover:shadow-lg transition-all duration-300">
                  <div className="relative h-52 overflow-hidden bg-gray-100">
                    {p.cover_image_url
                      ? <img src={p.cover_image_url} alt={p.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      : <div className="w-full h-full bg-gradient-to-br from-amber-100 to-orange-200 flex items-center justify-center">
                          <span className="text-4xl font-black text-orange-300/50">活動</span>
                        </div>
                    }
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                    <span className="absolute top-3 left-3 text-xs bg-amber-400 text-amber-900 px-2.5 py-0.5 rounded-full font-semibold">促銷活動</span>
                  </div>
                  <div className="p-5">
                    <h3 className="font-semibold text-primary mb-2 line-clamp-2 leading-snug">{p.title}</h3>
                    {p.excerpt && <p className="text-sm text-gray-500 line-clamp-2 leading-relaxed">{p.excerpt}</p>}
                    <p className="text-xs text-gray-400 mt-3">
                      {p.published_at ? new Date(p.published_at).toLocaleDateString('zh-TW') : ''}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── Latest News ────────────────────────────────────────────────── */}
      <section className="bg-gray-950 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeading label="Latest News" title="最新消息" subtitle="集團公告與重要訊息" link="/news" light />
          {newsList.length === 0 ? (
            <p className="text-center text-gray-500 py-12">暫無消息</p>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {newsList.map(p => (
                <Link key={p.id} to={`/posts/${p.slug}?tenant_slug=checkinn`}
                  className="group bg-white/5 border border-white/10 rounded-xl overflow-hidden hover:bg-white/10 transition-colors">
                  {p.cover_image_url && (
                    <div className="h-36 overflow-hidden">
                      <img src={p.cover_image_url} alt={p.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-80 group-hover:opacity-100" />
                    </div>
                  )}
                  <div className="p-4">
                    <span className="inline-block text-xs bg-sky-900/60 text-sky-300 px-2 py-0.5 rounded-full mb-2">最新消息</span>
                    <h3 className="text-sm font-medium text-gray-200 group-hover:text-white transition-colors line-clamp-3 leading-relaxed">{p.title}</h3>
                    <p className="text-xs text-gray-600 mt-2">
                      {p.published_at ? new Date(p.published_at).toLocaleDateString('zh-TW') : ''}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── Testimonials ───────────────────────────────────────────────── */}
      {testimonials.length > 0 && (
        <section className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <SectionHeading label="Guest Reviews" title="旅客好評" subtitle="來自真實住客的分享" />
            <div className="grid md:grid-cols-3 gap-6">
              {testimonials.map((t) => (
                <div key={t.id} className="bg-gray-50 border border-gray-100 rounded-2xl p-6 flex flex-col">
                  {/* Stars */}
                  <div className="flex gap-1 mb-4">
                    {Array.from({ length: 5 }).map((_, j) => (
                      <svg key={j} className="w-4 h-4 text-amber-400" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                  <p className="text-sm text-gray-600 leading-relaxed flex-1 italic">"{t.quote}"</p>
                  <div className="mt-5 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                      {t.author_name[0]}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-800">{t.author_name}</p>
                      {t.author_tag && <p className="text-xs text-gray-400">{t.author_tag}</p>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── CTA ────────────────────────────────────────────────────────── */}
      <section className="bg-primary py-16">
        <div className="max-w-2xl mx-auto px-4 text-center">
          <p className="text-xs tracking-[0.3em] text-gray-500 uppercase mb-3">Ready to Stay?</p>
          <h2 className="text-3xl font-bold text-white mb-3">立刻開始您的旅程</h2>
          <p className="text-gray-400 mb-8 text-sm">全台 29 間旅館，隨時為您準備好最舒適的落腳地</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/hotels"
              className="px-8 py-3 bg-white text-primary font-semibold rounded-xl hover:bg-gray-100 transition-colors text-sm">
              瀏覽所有旅館
            </Link>
            <Link to="/booking/lookup"
              className="px-8 py-3 border border-white/30 text-white rounded-xl hover:bg-white/10 transition-colors text-sm">
              查詢已有訂房
            </Link>
          </div>
        </div>
      </section>

    </div>
  )
}
