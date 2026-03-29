import { Link } from 'react-router-dom'

const ABOUT_NAV = [
  { label: '雀客介紹',       to: '/about' },
  { label: '住房須知',       to: '/about/policy', active: true },
  { label: '自助 Check-in', to: '/about/self-checkin' },
]

export default function AboutPolicy() {
  return (
    <div className="text-gray-800">

      {/* Hero */}
      <section className="bg-primary text-white py-16 px-4 text-center">
        <p className="text-xs tracking-[0.3em] text-gray-400 mb-3 uppercase">About CHECK inn</p>
        <h1 className="text-3xl md:text-4xl font-bold tracking-widest mb-4">住房須知</h1>
        <p className="text-gray-300 text-sm">入住前請詳閱以下規定，如有疑問歡迎聯繫客服。</p>
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

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12 space-y-10">

        {/* Check-in/out times */}
        <section>
          <h2 className="text-lg font-bold text-primary mb-4 pb-2 border-b border-gray-200">入住與退房時間</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="bg-gray-50 rounded-xl p-5">
              <p className="text-xs text-gray-400 uppercase tracking-widest mb-1">正常期間</p>
              <p className="text-sm text-gray-700">入住：<span className="font-semibold">16:00</span> 後</p>
              <p className="text-sm text-gray-700">退房：<span className="font-semibold">11:00</span> 前</p>
            </div>
            <div className="bg-amber-50 rounded-xl p-5">
              <p className="text-xs text-amber-600 uppercase tracking-widest mb-1">春節期間</p>
              <p className="text-sm text-gray-700">入住：<span className="font-semibold">16:00</span></p>
              <p className="text-sm text-gray-700">退房：<span className="font-semibold">11:00</span></p>
            </div>
          </div>
        </section>

        {/* Hotel rules */}
        <section>
          <h2 className="text-lg font-bold text-primary mb-4 pb-2 border-b border-gray-200">旅館規定</h2>
          <ul className="space-y-3">
            {[
              '館內全館禁菸、禁止寵物入住。違規將加收 NT$3,000 清潔費，設備損壞照價賠償。',
              '訂房規範依各館內公告為主，請以旅館現場公告為準。',
              '房型售價不含加人、加床費用，如需加床請洽旅館另行計費。',
              '官網售價已含服務費及營業稅，無隱藏費用。',
              '預訂後請於 24 小時內完成付款，逾時訂單將自動取消。',
              '房型照片僅供參考，實際配置以現場為準。',
              '貴重物品請自行保管，旅館不負保管責任。',
              '夜間 22:00 後請降低音量，以維護其他住客安寧。',
            ].map((rule, i) => (
              <li key={i} className="flex gap-3 text-sm text-gray-700">
                <span className="mt-0.5 w-5 h-5 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center shrink-0 font-medium">{i + 1}</span>
                {rule}
              </li>
            ))}
          </ul>
        </section>

        {/* Cancellation policy */}
        <section>
          <h2 className="text-lg font-bold text-primary mb-4 pb-2 border-b border-gray-200">退訂取消規定</h2>
          <div className="space-y-3">
            {[
              { timing: '入住前 3 日取消', refund: '退款 100%', color: 'bg-green-50 border-green-200 text-green-700' },
              { timing: '入住前 1–2 日取消', refund: '扣款 50% 後可申請退費', color: 'bg-yellow-50 border-yellow-200 text-yellow-700' },
              { timing: '當日取消 / 未入住（No Show）', refund: '扣款 100%，不予退費', color: 'bg-red-50 border-red-200 text-red-700' },
              { timing: '颱風警報期間', refund: '可全額退款，或保留一年內折抵使用', color: 'bg-blue-50 border-blue-200 text-blue-700' },
            ].map(item => (
              <div key={item.timing} className={`flex flex-col sm:flex-row sm:items-center justify-between border rounded-xl px-4 py-3 gap-1 ${item.color}`}>
                <span className="text-sm font-medium">{item.timing}</span>
                <span className="text-xs font-semibold">{item.refund}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 p-4 bg-gray-50 rounded-xl space-y-1 text-xs text-gray-500">
            <p>・退款作業需 7–14 個工作天處理。</p>
            <p>・匯款退費手續費由收款人負擔。</p>
            <p>・保留款項逾期未使用將予以沒收。</p>
          </div>
        </section>

        {/* Contact */}
        <section className="bg-primary text-white rounded-2xl p-6 text-center">
          <p className="text-sm text-gray-300 mb-1">有任何疑問？歡迎聯絡我們</p>
          <p className="text-lg font-semibold">+886-4-3509-5396</p>
          <p className="text-xs text-gray-400 mt-1">週一至週日 09:00–21:00</p>
        </section>

      </div>
    </div>
  )
}
