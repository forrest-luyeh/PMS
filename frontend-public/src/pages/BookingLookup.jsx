import { useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../lib/api'

export default function BookingLookup() {
  const [code, setCode] = useState('')
  const [email, setEmail] = useState('')
  const [booking, setBooking] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [cancelDone, setCancelDone] = useState(false)
  const [cancelling, setCancelling] = useState(false)

  const lookup = async () => {
    if (!code || !email) { setError('請填寫確認碼與 Email'); return }
    setLoading(true); setError(''); setBooking(null); setCancelDone(false)
    try {
      const res = await api.get(`/bookings/${code.trim()}`, { params: { email: email.trim() } })
      setBooking(res.data)
      sessionStorage.setItem('booking_email_' + code.trim(), email.trim())
    } catch (e) {
      setError(e.response?.data?.detail || '找不到訂房記錄，請確認確認碼與 Email 是否正確')
    } finally { setLoading(false) }
  }

  const cancel = async () => {
    if (!window.confirm('確認要取消此訂房？')) return
    setCancelling(true)
    try {
      await api.post(`/bookings/${code.trim()}/cancel`, { email: email.trim() })
      setCancelDone(true)
      setBooking(b => ({ ...b, status: 'CANCELLED' }))
    } catch (e) {
      setError(e.response?.data?.detail || '取消失敗')
    } finally { setCancelling(false) }
  }

  const STATUS_LABELS = { CONFIRMED: '已確認', CHECKED_IN: '住中', CHECKED_OUT: '已退房', CANCELLED: '已取消', NO_SHOW: '未到' }
  const STATUS_COLORS = { CONFIRMED: 'text-green-600', CHECKED_IN: 'text-blue-600', CHECKED_OUT: 'text-gray-500', CANCELLED: 'text-red-500', NO_SHOW: 'text-orange-500' }

  return (
    <div className="max-w-lg mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <h1 className="text-2xl font-bold text-primary mb-2 text-center">查詢訂房</h1>
      <p className="text-sm text-gray-500 text-center mb-8">輸入確認碼與 Email 查詢您的訂房記錄</p>

      <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm mb-6">
        <div className="space-y-3 mb-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">確認碼</label>
            <input value={code} onChange={e => setCode(e.target.value)} placeholder="例：aB3xY9zQ1mKp"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono tracking-widest focus:outline-none focus:ring-2 focus:ring-primary uppercase" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">訂房時填寫的 Email</label>
            <input value={email} onChange={e => setEmail(e.target.value)} type="email" placeholder="name@example.com"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
          </div>
        </div>

        {error && <p className="text-red-500 text-xs mb-3">{error}</p>}

        <button onClick={lookup} disabled={loading}
          className="w-full py-2.5 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary-hover disabled:opacity-50 transition-colors">
          {loading ? '查詢中...' : '查詢'}
        </button>
      </div>

      {/* Result */}
      {booking && (
        <div className="bg-gray-50 rounded-2xl border border-gray-200 p-6">
          <div className="text-center mb-4">
            <p className="text-xs text-gray-400 tracking-widest uppercase mb-1">確認碼</p>
            <div className="text-xl font-mono font-bold text-primary">{code.trim()}</div>
          </div>

          <div className="space-y-2 text-sm mb-4">
            {[
              ['旅館', booking.hotel_name],
              ['房型', booking.room_type_name],
              ['入住', booking.check_in_date],
              ['退房', booking.check_out_date],
              ['人數', `大人 ${booking.adults}${booking.children ? ` / 小孩 ${booking.children}` : ''}`],
              ['總金額', `NT$ ${Number(booking.total_amount).toLocaleString()}`],
            ].map(([l, v]) => (
              <div key={l} className="flex justify-between border-b border-gray-100 pb-1">
                <span className="text-gray-500">{l}</span>
                <span className="text-gray-700 font-medium">{v}</span>
              </div>
            ))}
            <div className="flex justify-between pt-1">
              <span className="text-gray-500">狀態</span>
              <span className={`font-semibold ${STATUS_COLORS[booking.status] || ''}`}>
                {STATUS_LABELS[booking.status] || booking.status}
              </span>
            </div>
          </div>

          {booking.notes && (
            <p className="text-xs text-gray-500 bg-white rounded-lg p-2 border border-gray-100 mb-4">備註：{booking.notes}</p>
          )}

          {cancelDone && <p className="text-green-600 text-sm text-center mb-3">訂房已成功取消</p>}

          {booking.status === 'CONFIRMED' && !cancelDone && (
            <button onClick={cancel} disabled={cancelling}
              className="w-full py-2 border border-red-400 text-red-500 rounded-xl text-sm hover:bg-red-50 disabled:opacity-50 transition-colors">
              {cancelling ? '取消中...' : '取消此訂房'}
            </button>
          )}
        </div>
      )}

      <div className="text-center mt-6">
        <Link to="/" className="text-sm text-gray-400 hover:text-primary underline">返回首頁</Link>
      </div>
    </div>
  )
}
