import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../lib/api'
import Modal from '../components/Modal'

const ITEM_TYPE_LABELS = { ROOM_CHARGE: '房費', EXTRA_CHARGE: '附加消費', DISCOUNT: '折扣', PAYMENT: '收款' }
const ITEM_TYPE_COLORS = {
  ROOM_CHARGE:   'text-gray-700',
  EXTRA_CHARGE:  'text-orange-600',
  DISCOUNT:      'text-green-600',
  PAYMENT:       'text-blue-600',
}

export default function Folio() {
  const { id } = useParams()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [modal, setModal] = useState(null) // null | 'charge'|'discount'|'payment'

  const { data: folio, isLoading } = useQuery({
    queryKey: ['folio', id],
    queryFn: () => api.get(`/folios/${id}`).then(r => r.data),
  })

  const deleteItem = useMutation({
    mutationFn: (itemId) => api.delete(`/folios/${id}/items/${itemId}`),
    onSuccess: () => qc.invalidateQueries(['folio', id]),
  })

  if (isLoading) return <div className="p-6 text-gray-400">載入中...</div>
  if (!folio) return <div className="p-6 text-gray-400">帳單不存在</div>

  const totalCharges = folio.items.filter(i => i.item_type === 'ROOM_CHARGE' || i.item_type === 'EXTRA_CHARGE').reduce((s, i) => s + i.amount, 0)
  const totalDiscounts = folio.items.filter(i => i.item_type === 'DISCOUNT').reduce((s, i) => s + i.amount, 0)
  const totalPayments = folio.items.filter(i => i.item_type === 'PAYMENT').reduce((s, i) => s + i.amount, 0)

  return (
    <div className="p-6 max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate(-1)} className="text-gray-400 hover:text-gray-600 text-sm">← 返回</button>
        <h1 className="text-xl font-bold text-gray-900">帳單 #{folio.id}</h1>
        <span className={`px-2 py-0.5 rounded text-xs ${folio.status === 'OPEN' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
          {folio.status === 'OPEN' ? '開啟中' : '已結清'}
        </span>
      </div>

      {/* Balance summary */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow p-4">
          <div className="text-xs text-gray-500 mb-1">應收金額</div>
          <div className="text-2xl font-bold text-gray-900">${(totalCharges - totalDiscounts).toLocaleString()}</div>
        </div>
        <div className="bg-white rounded-xl shadow p-4">
          <div className="text-xs text-gray-500 mb-1">已收金額</div>
          <div className="text-2xl font-bold text-blue-600">${totalPayments.toLocaleString()}</div>
        </div>
        <div className="bg-white rounded-xl shadow p-4">
          <div className="text-xs text-gray-500 mb-1">餘額</div>
          <div className={`text-2xl font-bold ${folio.balance > 0 ? 'text-red-600' : 'text-green-600'}`}>
            ${folio.balance.toLocaleString()}
          </div>
        </div>
      </div>

      {/* Items */}
      <div className="bg-white rounded-xl shadow overflow-hidden mb-4">
        <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-700">消費明細</h2>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-xs text-gray-600 uppercase">
            <tr>
              <th className="px-4 py-2 text-left">項目</th>
              <th className="px-4 py-2 text-left">類型</th>
              <th className="px-4 py-2 text-right">金額</th>
              <th className="px-4 py-2 text-left">時間</th>
              {folio.status === 'OPEN' && <th className="px-4 py-2"></th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {folio.items.map(item => (
              <tr key={item.id} className="hover:bg-gray-50">
                <td className="px-4 py-2 text-gray-800">{item.description}</td>
                <td className="px-4 py-2">
                  <span className={`text-xs font-medium ${ITEM_TYPE_COLORS[item.item_type]}`}>
                    {ITEM_TYPE_LABELS[item.item_type]}
                  </span>
                </td>
                <td className={`px-4 py-2 text-right font-medium ${ITEM_TYPE_COLORS[item.item_type]}`}>
                  {item.item_type === 'DISCOUNT' || item.item_type === 'PAYMENT' ? '-' : ''}${item.amount.toLocaleString()}
                </td>
                <td className="px-4 py-2 text-xs text-gray-400">{item.created_at?.slice(0, 16).replace('T', ' ')}</td>
                {folio.status === 'OPEN' && (
                  <td className="px-4 py-2">
                    {item.item_type !== 'ROOM_CHARGE' && (
                      <button onClick={() => deleteItem.mutate(item.id)} className="text-xs text-red-400 hover:text-red-600">刪除</button>
                    )}
                  </td>
                )}
              </tr>
            ))}
            {folio.items.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-6 text-center text-gray-400">無消費記錄</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Actions */}
      {folio.status === 'OPEN' && (
        <div className="flex gap-3">
          <button onClick={() => setModal('charge')}
            className="px-4 py-2 bg-orange-500 text-white text-sm rounded-lg hover:bg-orange-600">
            + 附加消費
          </button>
          <button onClick={() => setModal('discount')}
            className="px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700">
            + 折扣
          </button>
          <button onClick={() => setModal('payment')}
            className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700">
            + 收款
          </button>
        </div>
      )}

      {modal && (
        <AddItemModal
          type={modal}
          folioId={id}
          onClose={() => setModal(null)}
          onSuccess={() => { qc.invalidateQueries(['folio', id]); setModal(null) }}
        />
      )}
    </div>
  )
}

function AddItemModal({ type, folioId, onClose, onSuccess }) {
  const TITLES = { charge: '附加消費', discount: '折扣', payment: '收款' }
  const TYPES = { charge: 'EXTRA_CHARGE', discount: 'DISCOUNT', payment: 'PAYMENT' }
  const PAYMENT_METHODS = ['現金', '信用卡', '行動支付', '轉帳']

  const [description, setDescription] = useState(type === 'payment' ? '現金' : '')
  const [amount, setAmount] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const submit = async () => {
    if (!amount || !description) { setError('請填寫所有欄位'); return }
    setLoading(true); setError('')
    try {
      await api.post(`/folios/${folioId}/items`, { description, amount: parseFloat(amount), item_type: TYPES[type] })
      onSuccess()
    } catch(e) { setError(e.response?.data?.detail || '操作失敗') }
    finally { setLoading(false) }
  }

  return (
    <Modal title={TITLES[type]} onClose={onClose}>
      <div className="space-y-4">
        {type === 'payment' ? (
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">付款方式</label>
            <select value={description} onChange={e => setDescription(e.target.value)} className="input">
              {PAYMENT_METHODS.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
        ) : (
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">說明</label>
            <input value={description} onChange={e => setDescription(e.target.value)} className="input" placeholder={type === 'charge' ? '例：餐飲、停車' : '例：會員折扣'} />
          </div>
        )}
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">金額</label>
          <input type="number" min="0" step="0.01" value={amount} onChange={e => setAmount(e.target.value)} className="input" placeholder="0" />
        </div>
        {error && <p className="text-red-500 text-xs">{error}</p>}
        <div className="flex justify-end gap-2 pt-2">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900">取消</button>
          <button onClick={submit} disabled={loading}
            className="px-4 py-2 text-sm bg-slate-800 text-white rounded-lg hover:bg-slate-700 disabled:opacity-50">
            {loading ? '處理中...' : '確認'}
          </button>
        </div>
      </div>
    </Modal>
  )
}
