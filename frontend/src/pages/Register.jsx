import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import api, { setAccessToken } from '../lib/api'
import { useAuth } from '../contexts/AuthContext'

const STEPS = ['集團資訊', '第一間旅館', '管理員帳號']

function decodeToken(token) {
  try {
    const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')
    return JSON.parse(atob(base64))
  } catch { return {} }
}

export default function Register() {
  const navigate = useNavigate()
  const { setUser } = useAuth()
  const [step, setStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    tenant_name: '', tenant_slug: '', contact_email: '',
    hotel_name: '', hotel_slug: '', hotel_address: '',
    admin_email: '', admin_password: '', admin_name: '',
  })

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value })

  const next = () => { setError(''); setStep(s => s + 1) }
  const back = () => setStep(s => s - 1)

  const submit = async () => {
    setLoading(true); setError('')
    try {
      const { data } = await api.post('/register', form)
      const claims = decodeToken(data.access_token)
      setAccessToken(data.access_token, claims.hotel_id)
      const me = await api.get('/auth/me')
      setUser(me.data)
      navigate('/')
    } catch (err) {
      const detail = err.response?.data?.detail
      setError(typeof detail === 'string' ? detail : JSON.stringify(detail) || '註冊失敗')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f5f5' }}>
      <div style={{ background: '#fff', borderRadius: 12, padding: 40, width: 440, boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}>
        <h2 style={{ marginBottom: 8 }}>旅館系統註冊</h2>

        {/* Step indicator */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 28 }}>
          {STEPS.map((label, i) => (
            <div key={i} style={{ flex: 1, textAlign: 'center', fontSize: 12,
              color: i === step ? '#1976d2' : i < step ? '#4caf50' : '#999',
              borderBottom: `2px solid ${i === step ? '#1976d2' : i < step ? '#4caf50' : '#ddd'}`,
              paddingBottom: 6 }}>
              {i < step ? '✓ ' : `${i + 1}. `}{label}
            </div>
          ))}
        </div>

        {error && <div style={{ color: 'red', marginBottom: 16, fontSize: 14 }}>{error}</div>}

        {step === 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <label>集團名稱 <input value={form.tenant_name} onChange={set('tenant_name')} style={inputStyle} /></label>
            <label>集團代碼 (slug) <input value={form.tenant_slug} onChange={set('tenant_slug')} placeholder="my-group" style={inputStyle} /></label>
            <label>聯絡信箱 <input value={form.contact_email} onChange={set('contact_email')} type="email" style={inputStyle} /></label>
            <button onClick={next} disabled={!form.tenant_name || !form.tenant_slug || !form.contact_email} style={btnStyle}>下一步</button>
          </div>
        )}

        {step === 1 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <label>旅館名稱 <input value={form.hotel_name} onChange={set('hotel_name')} style={inputStyle} /></label>
            <label>旅館代碼 (slug) <input value={form.hotel_slug} onChange={set('hotel_slug')} placeholder="main-hotel" style={inputStyle} /></label>
            <label>地址 <input value={form.hotel_address} onChange={set('hotel_address')} style={inputStyle} /></label>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={back} style={{ ...btnStyle, background: '#eee', color: '#333' }}>上一步</button>
              <button onClick={next} disabled={!form.hotel_name || !form.hotel_slug} style={btnStyle}>下一步</button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <label>管理員姓名 <input value={form.admin_name} onChange={set('admin_name')} style={inputStyle} /></label>
            <label>管理員信箱 <input value={form.admin_email} onChange={set('admin_email')} type="email" style={inputStyle} /></label>
            <label>密碼 <input value={form.admin_password} onChange={set('admin_password')} type="password" style={inputStyle} /></label>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={back} style={{ ...btnStyle, background: '#eee', color: '#333' }}>上一步</button>
              <button onClick={submit} disabled={loading || !form.admin_name || !form.admin_email || !form.admin_password} style={btnStyle}>
                {loading ? '建立中...' : '完成註冊'}
              </button>
            </div>
          </div>
        )}

        <p style={{ marginTop: 24, textAlign: 'center', fontSize: 14, color: '#666' }}>
          已有帳號？ <Link to="/login">登入</Link>
        </p>
      </div>
    </div>
  )
}

const inputStyle = { display: 'block', width: '100%', marginTop: 4, padding: '8px 10px', border: '1px solid #ddd', borderRadius: 6, fontSize: 14, boxSizing: 'border-box' }
const btnStyle = { flex: 1, padding: '10px 0', background: '#1976d2', color: '#fff', border: 'none', borderRadius: 6, fontSize: 15, cursor: 'pointer', fontWeight: 600 }
