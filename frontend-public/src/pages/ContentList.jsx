import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import api from '../lib/api'

const TYPE_LABELS = {
  activity: '活動快訊',
  news: '最新消息',
  traveler: '旅人誌',
  uncategorized: '未分類',
}
const TYPE_COLORS = {
  activity: 'bg-orange-100 text-orange-700',
  news: 'bg-blue-100 text-blue-700',
  traveler: 'bg-emerald-100 text-emerald-700',
  uncategorized: 'bg-gray-100 text-gray-600',
}

const PAGE_SIZE = 9

export default function ContentList({ type }) {
  const [page, setPage] = useState(1)

  const { data = [], isLoading, isFetching } = useQuery({
    queryKey: ['public-posts', type, page],
    queryFn: () => api.get('/posts', {
      params: { tenant_slug: 'checkinn', type, page, limit: PAGE_SIZE },
    }).then(r => r.data),
    keepPreviousData: true,
  })

  const title = type ? TYPE_LABELS[type] : '所有文章'

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-2xl font-bold text-primary mb-8">{title}</h1>

      {isLoading ? (
        <div className="text-center text-gray-400 py-20">載入中...</div>
      ) : data.length === 0 ? (
        <div className="text-center text-gray-400 py-20">目前暫無內容</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {data.map(post => (
            <Link key={post.id} to={`/posts/${post.slug}?tenant_slug=checkinn`}
              className="bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow overflow-hidden group">
              {post.cover_image_url ? (
                <img src={post.cover_image_url} alt={post.title}
                  className="w-full h-44 object-cover group-hover:opacity-90 transition-opacity" />
              ) : (
                <div className={`w-full h-44 flex items-center justify-center text-4xl font-bold ${TYPE_COLORS[post.post_type] || 'bg-gray-100'}`}>
                  {TYPE_LABELS[post.post_type]?.[0] || '文'}
                </div>
              )}
              <div className="p-4">
                <span className={`inline-block text-xs px-2 py-0.5 rounded-full mb-2 font-medium ${TYPE_COLORS[post.post_type] || 'bg-gray-100 text-gray-600'}`}>
                  {TYPE_LABELS[post.post_type] || post.post_type}
                </span>
                <h2 className="font-semibold text-gray-800 mb-1 line-clamp-2 group-hover:text-primary transition-colors">
                  {post.title}
                </h2>
                {post.excerpt && (
                  <p className="text-sm text-gray-500 line-clamp-2">{post.excerpt}</p>
                )}
                <p className="text-xs text-gray-400 mt-2">
                  {post.published_at ? new Date(post.published_at).toLocaleDateString('zh-TW') : ''}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Pagination */}
      <div className="flex justify-center gap-3 mt-10">
        {page > 1 && (
          <button onClick={() => setPage(p => p - 1)} disabled={isFetching}
            className="px-5 py-2 border border-gray-300 rounded-lg text-sm hover:border-primary hover:text-primary transition-colors disabled:opacity-50">
            上一頁
          </button>
        )}
        {data.length === PAGE_SIZE && (
          <button onClick={() => setPage(p => p + 1)} disabled={isFetching}
            className="px-5 py-2 border border-gray-300 rounded-lg text-sm hover:border-primary hover:text-primary transition-colors disabled:opacity-50">
            下一頁
          </button>
        )}
      </div>
    </div>
  )
}
