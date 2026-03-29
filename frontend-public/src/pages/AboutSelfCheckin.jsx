import { Link } from 'react-router-dom'

const ABOUT_NAV = [
  { label: '雀客介紹',       to: '/about' },
  { label: '住房須知',       to: '/about/policy' },
  { label: '自助 Check-in', to: '/about/self-checkin', active: true },
]

const STEPS = [
  {
    num: '01',
    title: '官網完成訂房',
    desc: '透過雀客官網或 APP 選擇旅館、日期與房型，完成付款後取得訂房確認碼，確認信將寄至您的電子信箱。',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-8 h-8">
        <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M9 12l2 2 4-4" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
  },
  {
    num: '02',
    title: '收到確認碼',
    desc: '訂房完成後，確認碼將以簡訊及電子郵件雙重通知。請妥善保存確認碼，入住時需要使用。',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-8 h-8">
        <path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
  },
  {
    num: '03',
    title: '抵達自助機台',
    desc: '依照旅館指引，前往大廳自助 Check-in 機台。輸入訂房確認碼及證件末四碼完成身份驗證。',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-8 h-8">
        <rect x="5" y="2" width="14" height="20" rx="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M9 7h6M9 11h6M9 15h4" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
  },
  {
    num: '04',
    title: '取得房卡入住',
    desc: '機台自動出卡，即刻開始入住。退房時將房卡放回機台歸還，2 秒完成退房手續。',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-8 h-8">
        <rect x="3" y="8" width="18" height="11" rx="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M7 8V6a5 5 0 0110 0v2" strokeLinecap="round" strokeLinejoin="round"/>
        <circle cx="12" cy="13" r="1.5" fill="currentColor"/>
      </svg>
    ),
  },
]

const BENEFITS = [
  { title: '無需排隊等待', desc: '3 分鐘輕鬆完成所有流程，隨到隨辦。' },
  { title: '自動收發房卡', desc: '入住、退房手續超簡單，機台全程自動處理。' },
  { title: '個資安全保障', desc: '個人訊息與隱私受到完整保護，安心使用。' },
  { title: '多元支付方式', desc: '現金、信用卡、行動支付、LINE Pay 均可使用。' },
]

export default function AboutSelfCheckin() {
  return (
    <div className="text-gray-800">

      {/* Hero */}
      <section className="bg-primary text-white py-16 px-4 text-center">
        <p className="text-xs tracking-[0.3em] text-gray-400 mb-3 uppercase">About CHECK inn</p>
        <h1 className="text-3xl md:text-4xl font-bold tracking-widest mb-3">自助 Check-in 流程</h1>
        <p className="text-gray-300 text-sm md:text-base">簡單、快速自助入住 · 3 分鐘完成報到手續</p>
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

      {/* Intro */}
      <section className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
        <p className="text-sm text-gray-600 leading-relaxed text-center max-w-xl mx-auto">
          雀客旅館提供自助 Check-in 機台，讓住客能輕鬆辦理入住，享受更快捷、方便、安全又自主的住宿體驗。
          隨著科技進步，雀客旅館作為智能化旅館的領航者，邀請住客一同享受智能化帶來的高效便利。
        </p>
      </section>

      {/* Steps */}
      <section className="bg-gray-50 py-14 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-lg font-bold text-primary text-center mb-10">入住步驟</h2>
          <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-6">
            {STEPS.map((s, i) => (
              <div key={s.num} className="relative">
                {i < STEPS.length - 1 && (
                  <div className="hidden md:block absolute top-10 left-full w-full h-px bg-gray-300 -translate-x-1/2 z-0" />
                )}
                <div className="bg-white rounded-2xl p-6 text-center shadow-sm relative z-10">
                  <div className="w-16 h-16 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto mb-4">
                    {s.icon}
                  </div>
                  <div className="text-xs font-bold text-primary/60 tracking-widest mb-1">STEP {s.num}</div>
                  <h3 className="font-semibold text-sm text-gray-900 mb-2">{s.title}</h3>
                  <p className="text-xs text-gray-500 leading-relaxed">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 py-14">
        <h2 className="text-lg font-bold text-primary text-center mb-8">四大優勢</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          {BENEFITS.map(b => (
            <div key={b.title} className="flex gap-4 p-5 border border-gray-100 rounded-xl hover:border-primary/30 transition-colors">
              <div className="w-2 rounded-full bg-primary shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold text-sm text-gray-900 mb-1">{b.title}</h3>
                <p className="text-xs text-gray-500 leading-relaxed">{b.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Checkout note */}
      <section className="max-w-3xl mx-auto px-4 sm:px-6 pb-12">
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 text-center">
          <p className="text-amber-800 font-semibold text-sm mb-1">退房提醒</p>
          <p className="text-amber-700 text-sm">退房時別忘了將房卡歸還至機台，2 秒就完成囉！</p>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-primary text-white py-14 px-4 text-center">
        <h2 className="text-lg font-bold mb-2">立即體驗智能旅宿</h2>
        <p className="text-gray-300 text-sm mb-6">全台 29 間雀客旅館，全面導入自助 Check-in 服務</p>
        <Link to="/hotels"
          className="inline-block px-8 py-2.5 border border-white/40 text-white text-sm rounded hover:bg-white hover:text-primary transition-colors">
          選擇旅館
        </Link>
      </section>

    </div>
  )
}
