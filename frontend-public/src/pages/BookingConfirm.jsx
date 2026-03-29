import { useParams, useLocation, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import api from '../lib/api'

export default function BookingConfirm() {
  const { code } = useParams()
  const { state } = useLocation()

  // If navigated from form, use state directly; otherwise fetch
  const { data: booking } = useQuery({
    queryKey: ['public-booking-confirm', code],
    queryFn: () => {
      const email = sessionStorage.getItem('booking_email_' + code)
      if (!email) return null
      return api.get(`/bookings/${code}`, { params: { email } }).then(r => r.data)
    },
    enabled: !state,
  })

  const b = state || booking

  return (
    <div className="max-w-lg mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
      <div className="text-5xl mb-4">✅</div>
      <h1 className="text-2xl font-bold text-primary mb-1">訂房確認成功！</h1>
      <p className="text-gray-500 text-sm mb-8">請保存您的確認碼，以便查詢或修改訂房</p>

      <div className="bg-gray-50 rounded-2xl border border-gray-200 p-6 mb-6 text-left">
        {/* Confirmation code */}
        <div className="text-center mb-6">
          <p className="text-xs text-gray-400 mb-1 tracking-widest uppercase">訂房確認碼</p>
          <div className="text-3xl font-mono font-bold tracking-widest text-primary bg-white border-2 border-primary rounded-xl py-3 px-6 inline-block">
            {code}
          </div>
        </div>

        {b && (
          <div className="space-y-2 text-sm">
            <Row label="旅館" value={b.hotel_name} />
            <Row label="房型" value={b.room_type_name} />
            <Row label="入住" value={b.check_in_date} />
            <Row label="退房" value={b.check_out_date} />
            <Row label="人數" value={`大人 ${b.adults} 人${b.children ? ` / 小孩 ${b.children} 人` : ''}`} />
            <Row label="總金額" value={`NT$ ${Number(b.total_amount).toLocaleString()}`} bold />
          </div>
        )}
      </div>

      <p className="text-xs text-gray-400 mb-6">如需修改或取消訂房，請前往「查詢訂房」頁面</p>

      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Link to="/booking/lookup"
          className="px-6 py-2.5 border border-primary text-primary rounded-xl text-sm font-medium hover:bg-primary hover:text-white transition-colors">
          查詢訂房
        </Link>
        <Link to="/"
          className="px-6 py-2.5 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary-hover transition-colors">
          返回首頁
        </Link>
      </div>
    </div>
  )
}

function Row({ label, value, bold }) {
  return (
    <div className="flex justify-between border-b border-gray-100 pb-1">
      <span className="text-gray-500">{label}</span>
      <span className={bold ? 'font-bold text-primary' : 'text-gray-700'}>{value}</span>
    </div>
  )
}
