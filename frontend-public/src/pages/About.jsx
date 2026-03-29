import { Link } from 'react-router-dom'

const ABOUT_NAV = [
  { label: '雀客介紹',       to: '/about', active: true },
  { label: '住房須知',       to: '/about/policy' },
  { label: '自助 Check-in', to: '/about/self-checkin' },
]

const BRANDS = [
  {
    slug: 'select',
    name: '雀客藏居 SELECT',
    tagline: '城市裡的精緻隱所',
    desc: '以精品旅館規格打造，坐落於城市核心地帶，提供寬敞舒適的客房空間與細膩貼心的服務，是商務出行與品味旅遊的首選。',
    color: 'bg-amber-900',
  },
  {
    slug: 'hotel',
    name: '雀客旅館 HOTEL',
    tagline: '輕旅，正式出發',
    desc: '融合現代設計與實用機能，以合理的價格提供乾淨舒適的住宿體驗，適合各類旅人自由往返台灣各地。',
    color: 'bg-slate-700',
  },
  {
    slug: 'express',
    name: '雀客快捷 EXPRESS',
    tagline: '快速、簡單、到位',
    desc: '講求效率的智能旅宿，提供最精簡的住房流程、全程自助服務，讓每一次的旅途輕盈無負擔。',
    color: 'bg-emerald-800',
  },
]

const STEPS = [
  { num: '01', title: '官網預訂', desc: '在雀客官網或 APP 完成訂房，取得訂房確認碼。' },
  { num: '02', title: '收到確認信', desc: '訂房完成後，確認碼將寄送至您的電子信箱，請妥善保存。' },
  { num: '03', title: '抵達自助機台', desc: '依照旅館指引，前往大廳自助 Check-in 機台。' },
  { num: '04', title: '取得房卡入住', desc: '輸入確認碼及證件末四碼，機台自動出卡，即刻入住。' },
]

export default function About() {
  return (
    <div className="text-gray-800">

      {/* Hero */}
      <section className="bg-primary text-white py-20 px-4 text-center">
        <p className="text-xs tracking-[0.3em] text-gray-400 mb-3 uppercase">About CHECK inn</p>
        <h1 className="text-3xl md:text-5xl font-bold tracking-widest mb-4">關於雀客</h1>
        <p className="text-gray-300 text-sm md:text-base max-w-xl mx-auto leading-relaxed">
          STAY EASY. STAY SMART.<br />
          我們相信，好的旅宿體驗，從簡單開始。
        </p>
      </section>

      {/* Sub-nav */}
      <div className="border-b border-gray-200 bg-white sticky top-16 z-40">
        <div className="max-w-3xl mx-auto px-4 flex gap-0">
          {ABOUT_NAV.map(n => (
            <Link key={n.to} to={n.to}
              className={`px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
                n.active
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-800'
              }`}>
              {n.label}
            </Link>
          ))}
        </div>
      </div>

      {/* Brand Story */}
      <section className="max-w-3xl mx-auto px-4 sm:px-6 py-16">
        <h2 className="text-xl font-bold text-primary mb-6 text-center">品牌故事</h2>
        <div className="space-y-4 text-sm text-gray-700 leading-relaxed">
          <p>
            雀客旅館集團（CHECKinn International Hotel Corp.）成立於台灣，以「讓旅行更輕鬆、更智能」為核心理念，
            打造橫跨精品、標準與快捷三大定位的連鎖旅館品牌。
          </p>
          <p>
            自第一間旅館開業至今，我們以「雀客」（CHECK inn）命名，取其「報到、入住」之意，
            傳遞品牌對每一位旅人的歡迎與重視。目前已在全台各縣市設立 29 間旅館，
            持續擴展版圖，深耕台灣旅宿市場。
          </p>
          <p>
            我們導入智能自助 Check-in 系統，讓旅客從訂房到入住全程自主，節省等待時間，
            享受更自由、更有彈性的旅宿體驗。
          </p>
        </div>
      </section>

      {/* Three Brands */}
      <section className="bg-gray-50 py-16 px-4">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-xl font-bold text-primary mb-8 text-center">三大品牌</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {BRANDS.map(b => (
              <Link key={b.slug} to={`/hotels?brand=${b.slug}`}
                className="group block rounded-xl overflow-hidden shadow hover:shadow-md transition-shadow">
                <div className={`${b.color} text-white px-6 py-8`}>
                  <p className="text-xs tracking-widest opacity-70 mb-1 uppercase">{b.slug}</p>
                  <h3 className="text-lg font-bold mb-1">{b.name}</h3>
                  <p className="text-xs opacity-80 italic">{b.tagline}</p>
                </div>
                <div className="bg-white px-6 py-4">
                  <p className="text-xs text-gray-600 leading-relaxed">{b.desc}</p>
                  <p className="text-xs text-primary font-medium mt-3 group-hover:underline">查看旅館 →</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Self Check-in Steps */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 py-16">
        <h2 className="text-xl font-bold text-primary mb-2 text-center">自助 Check-in 流程</h2>
        <p className="text-sm text-gray-500 text-center mb-10">全程不需等待，入住更自由</p>
        <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-6">
          {STEPS.map(s => (
            <div key={s.num} className="text-center">
              <div className="w-12 h-12 rounded-full bg-primary text-white flex items-center justify-center text-lg font-bold mx-auto mb-3">
                {s.num}
              </div>
              <h3 className="font-semibold text-sm text-gray-900 mb-1">{s.title}</h3>
              <p className="text-xs text-gray-500 leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Contact */}
      <section className="bg-primary text-white py-14 px-4 text-center">
        <h2 className="text-lg font-bold mb-6 tracking-wide">聯絡我們</h2>
        <div className="flex flex-col sm:flex-row justify-center gap-8 text-sm text-gray-300">
          <div>
            <p className="text-xs text-gray-500 mb-1 uppercase tracking-widest">客服電話</p>
            <p>+886-4-3509-5396</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1 uppercase tracking-widest">服務時間</p>
            <p>週一至週日 09:00–21:00</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1 uppercase tracking-widest">訂房查詢</p>
            <Link to="/booking/lookup" className="hover:text-white underline">查詢已有訂房</Link>
          </div>
        </div>
      </section>

    </div>
  )
}
