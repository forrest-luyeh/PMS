import { useParams, useSearchParams, useNavigate, Link } from 'react-router-dom'
import { useQuery, useMutation } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import api from '../lib/api'

const schema = z.object({
  guest_name:  z.string().min(1, '請填寫姓名'),
  guest_phone: z.string().min(8, '請填寫有效電話'),
  guest_email: z.string().email('請填寫有效 Email'),
  adults:      z.coerce.number().min(1),
  children:    z.coerce.number().min(0),
  notes:       z.string().optional(),
})

export default function BookingForm() {
  const { slug } = useParams()
  const [sp] = useSearchParams()
  const navigate = useNavigate()

  const checkIn  = sp.get('check_in') || ''
  const checkOut = sp.get('check_out') || ''
  const roomTypeId = sp.get('room_type_id') ? Number(sp.get('room_type_id')) : null

  const { data: hotel } = useQuery({
    queryKey: ['public-hotel', slug],
    queryFn: () => api.get(`/hotels/${slug}`).then(r => r.data),
  })

  const { data: availability = [] } = useQuery({
    queryKey: ['public-availability', slug, checkIn, checkOut],
    queryFn: () => api.get(`/hotels/${slug}/availability`, { params: { check_in: checkIn, check_out: checkOut } }).then(r => r.data),
    enabled: !!(checkIn && checkOut),
  })

  const roomTypeAvail = availability.find(a => a.room_type_id === roomTypeId)
  const { data: roomTypes = [] } = useQuery({
    queryKey: ['public-room-types', slug],
    queryFn: () => api.get(`/hotels/${slug}/room-types`).then(r => r.data),
  })
  const roomType = roomTypes.find(rt => rt.id === roomTypeId)

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { adults: 2, children: 0 },
  })

  const mutation = useMutation({
    mutationFn: (data) => api.post('/bookings', {
      ...data,
      hotel_slug: slug,
      room_type_id: roomTypeId,
      check_in_date: checkIn,
      check_out_date: checkOut,
    }).then(r => r.data),
    onSuccess: (res) => navigate(`/booking/confirm/${res.confirmation_code}`, { state: res }),
  })

  const nights = checkIn && checkOut
    ? Math.round((new Date(checkOut) - new Date(checkIn)) / 86400000) : 0
  const totalPrice = roomType ? Number(roomType.base_rate) * nights : 0

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Breadcrumb */}
      <nav className="text-xs text-gray-400 mb-6">
        <Link to="/" className="hover:text-primary">首頁</Link>
        <span className="mx-1">/</span>
        <Link to={`/hotels/${slug}`} className="hover:text-primary">{hotel?.name}</Link>
        <span className="mx-1">/</span>
        <span className="text-gray-600">訂房</span>
      </nav>

      <div className="grid md:grid-cols-5 gap-6">
        {/* Form */}
        <form onSubmit={handleSubmit(d => mutation.mutate(d))} className="md:col-span-3 space-y-4">
          <h1 className="text-xl font-bold text-primary">填寫訂房資料</h1>

          <Field label="姓名" error={errors.guest_name?.message}>
            <input {...register('guest_name')} placeholder="王小明" className="input" />
          </Field>
          <Field label="電話" error={errors.guest_phone?.message}>
            <input {...register('guest_phone')} placeholder="0912-345-678" className="input" />
          </Field>
          <Field label="Email" error={errors.guest_email?.message}>
            <input {...register('guest_email')} type="email" placeholder="name@example.com" className="input" />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="大人" error={errors.adults?.message}>
              <input {...register('adults')} type="number" min="1" className="input" />
            </Field>
            <Field label="小孩" error={errors.children?.message}>
              <input {...register('children')} type="number" min="0" className="input" />
            </Field>
          </div>
          <Field label="備註（選填）">
            <textarea {...register('notes')} rows={3} placeholder="特殊需求、加床、飲食限制..." className="input resize-none" />
          </Field>

          {mutation.isError && (
            <p className="text-red-500 text-sm">{mutation.error?.response?.data?.detail || '訂房失敗，請稍後再試'}</p>
          )}

          <button type="submit" disabled={mutation.isPending || (roomTypeAvail && roomTypeAvail.available_count === 0)}
            className="w-full py-3 bg-primary text-white rounded-xl font-semibold hover:bg-primary-hover disabled:opacity-50 transition-colors">
            {mutation.isPending ? '處理中...' : '確認訂房'}
          </button>
        </form>

        {/* Summary */}
        <div className="md:col-span-2">
          <div className="bg-gray-50 rounded-xl border border-gray-200 p-5 sticky top-20">
            <h2 className="font-semibold text-primary mb-3">訂房摘要</h2>
            <p className="text-sm font-medium">{hotel?.name}</p>
            <p className="text-xs text-gray-500 mb-3">{roomType?.name}</p>
            <div className="text-xs text-gray-600 space-y-1 border-t border-gray-200 pt-3">
              <div className="flex justify-between"><span>入住</span><span>{checkIn}</span></div>
              <div className="flex justify-between"><span>退房</span><span>{checkOut}</span></div>
              <div className="flex justify-between"><span>晚數</span><span>{nights} 晚</span></div>
              <div className="flex justify-between"><span>房價/晚</span><span>NT$ {Number(roomType?.base_rate || 0).toLocaleString()}</span></div>
            </div>
            <div className="flex justify-between font-bold text-primary mt-3 pt-3 border-t border-gray-200">
              <span>總計</span>
              <span>NT$ {totalPrice.toLocaleString()}</span>
            </div>
            {roomTypeAvail && (
              <p className={`text-xs mt-2 ${roomTypeAvail.available_count === 0 ? 'text-red-500' : 'text-green-600'}`}>
                {roomTypeAvail.available_count === 0 ? '此房型已客滿' : `剩餘 ${roomTypeAvail.available_count} 間`}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function Field({ label, children, error }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
      {children}
      {error && <p className="text-red-500 text-xs mt-0.5">{error}</p>}
    </div>
  )
}
