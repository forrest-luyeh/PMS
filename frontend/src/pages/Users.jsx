import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../lib/api'
import { useAuth } from '../contexts/AuthContext'
import Modal from '../components/Modal'

const ROLES = ['ADMIN', 'FRONT_DESK', 'HOUSEKEEPING', 'MANAGER']
const ROLE_LABELS = { ADMIN: '管理員', FRONT_DESK: '前台', HOUSEKEEPING: '房務', MANAGER: '主管' }

const EMPTY_FORM = { name: '', email: '', password: '', role: 'FRONT_DESK', is_active: true }

export default function Users() {
  const { user: me } = useAuth()
  const qc = useQueryClient()
  const [modal, setModal] = useState(null) // null | { mode: 'add'|'edit', data }

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: () => api.get('/auth/users').then(r => r.data.items ?? r.data),
  })

  const save = useMutation({
    mutationFn: (form) => modal.mode === 'add'
      ? api.post('/auth/users', form)
      : api.put(`/auth/users/${modal.data.id}`, form),
    onSuccess: () => { qc.invalidateQueries(['users']); setModal(null) },
  })

  if (!['ADMIN', 'TENANT_ADMIN', 'BRAND_ADMIN'].includes(me?.role)) return (
    <div className="p-8 text-gray-500">僅限管理員存取</div>
  )

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-gray-900">用戶管理</h1>
        <button onClick={() => setModal({ mode: 'add', data: { ...EMPTY_FORM } })}
          className="bg-slate-800 text-white px-4 py-2 rounded-lg text-sm hover:bg-slate-700">
          + 新增用戶
        </button>
      </div>

      {isLoading ? <p className="text-gray-400">載入中...</p> : (
        <div className="bg-white rounded-xl shadow overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600 text-xs uppercase">
              <tr>
                {['姓名', '電子郵件', '角色', '狀態', ''].map(h => (
                  <th key={h} className="px-4 py-3 text-left">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {users.map(u => (
                <tr key={u.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{u.name}</td>
                  <td className="px-4 py-3 text-gray-600">{u.email}</td>
                  <td className="px-4 py-3">
                    <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-xs">
                      {ROLE_LABELS[u.role]}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded text-xs ${u.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                      {u.is_active ? '啟用' : '停用'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => setModal({ mode: 'edit', data: { ...u, password: '' } })}
                      className="text-slate-600 hover:text-slate-900 text-xs">編輯</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modal && (
        <UserModal
          mode={modal.mode}
          initial={modal.data}
          loading={save.isPending}
          error={save.error?.response?.data?.detail}
          onClose={() => setModal(null)}
          onSubmit={(form) => save.mutate(form)}
        />
      )}
    </div>
  )
}

function UserModal({ mode, initial, loading, error, onClose, onSubmit }) {
  const [form, setForm] = useState(initial)
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  return (
    <Modal title={mode === 'add' ? '新增用戶' : '編輯用戶'} onClose={onClose}>
      <div className="space-y-4">
        <Field label="姓名">
          <input value={form.name} onChange={e => set('name', e.target.value)} required
            className="input" />
        </Field>
        <Field label="電子郵件">
          <input value={form.email} onChange={e => set('email', e.target.value)} required
            className="input" />
        </Field>
        <Field label={mode === 'add' ? '密碼' : '新密碼（留空不更改）'}>
          <input type="password" value={form.password} onChange={e => set('password', e.target.value)}
            required={mode === 'add'} className="input" />
        </Field>
        <Field label="角色">
          <select value={form.role} onChange={e => set('role', e.target.value)} className="input">
            {ROLES.map(r => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
          </select>
        </Field>
        <Field label="狀態">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.is_active} onChange={e => set('is_active', e.target.checked)} />
            <span className="text-sm text-gray-700">啟用帳號</span>
          </label>
        </Field>
        {error && <p className="text-red-500 text-xs">{error}</p>}
        <div className="flex justify-end gap-2 pt-2">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900">取消</button>
          <button onClick={() => onSubmit(form)} disabled={loading}
            className="px-4 py-2 text-sm bg-slate-800 text-white rounded-lg hover:bg-slate-700 disabled:opacity-50">
            {loading ? '儲存中...' : '儲存'}
          </button>
        </div>
      </div>
    </Modal>
  )
}

function Field({ label, children }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
      {children}
    </div>
  )
}
