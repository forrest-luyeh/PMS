import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('admin@checkinn.com.tw')
  const [password, setPassword] = useState('Admin1234!')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault(); setError(''); setLoading(true)
    try { await login(email, password); navigate('/') }
    catch { setError('帳號或密碼錯誤') }
    finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-800">
      <div className="bg-white rounded-xl shadow-xl p-8 w-full max-w-sm">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">旅館管理系統</h1>
          <p className="text-gray-400 text-sm mt-1">Hotel PMS</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-xs font-medium text-gray-600 mb-1">電子郵件</label>
            <input id="email" type="text" value={email} onChange={e => setEmail(e.target.value)} required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-500" />
          </div>
          <div>
            <label htmlFor="password" className="block text-xs font-medium text-gray-600 mb-1">密碼</label>
            <input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-500" />
          </div>
          {error && <p className="text-red-500 text-xs">{error}</p>}
          <button type="submit" disabled={loading}
            className="w-full bg-slate-800 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-slate-700 disabled:opacity-50">
            {loading ? '登入中...' : '登入'}
          </button>
        </form>
        <p className="text-center text-xs text-gray-400 mt-4">
          還沒有帳號？ <Link to="/register" className="text-slate-600 underline">立即註冊旅館</Link>
        </p>
      </div>
    </div>
  )
}
