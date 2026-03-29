import { useParams, useSearchParams, Link } from 'react-router-dom'
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

function isYouTube(url) {
  return url && (url.includes('youtube.com') || url.includes('youtu.be'))
}

function getYouTubeEmbed(url) {
  // youtu.be/ID or youtube.com/watch?v=ID or youtube.com/embed/ID
  let id = ''
  try {
    const u = new URL(url)
    if (u.hostname === 'youtu.be') {
      id = u.pathname.slice(1)
    } else {
      id = u.searchParams.get('v') || u.pathname.split('/embed/')[1] || ''
    }
  } catch {}
  return `https://www.youtube.com/embed/${id}`
}

export default function ContentDetail() {
  const { slug } = useParams()
  const [params] = useSearchParams()
  const tenantSlug = params.get('tenant_slug') || 'checkinn'

  const { data: post, isLoading, isError } = useQuery({
    queryKey: ['public-post', slug, tenantSlug],
    queryFn: () => api.get(`/posts/${slug}`, { params: { tenant_slug: tenantSlug } }).then(r => r.data),
    retry: false,
  })

  if (isLoading) return <div className="text-center text-gray-400 py-20">載入中...</div>
  if (isError) return (
    <div className="text-center py-20">
      <p className="text-gray-400 mb-4">找不到此文章</p>
      <Link to="/" className="text-primary underline text-sm">返回首頁</Link>
    </div>
  )

  const backTo = {
    activity: '/activities',
    news: '/news',
    traveler: '/traveler',
  }[post.post_type] || '/'

  return (
    <article className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Back link */}
      <Link to={backTo} className="inline-flex items-center gap-1 text-sm text-gray-400 hover:text-primary mb-6">
        ← 返回列表
      </Link>

      {/* Cover image */}
      {post.cover_image_url && (
        <img src={post.cover_image_url} alt={post.title}
          className="w-full max-h-80 object-cover rounded-2xl mb-8" />
      )}

      {/* Meta */}
      <div className="flex items-center gap-3 mb-4">
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${TYPE_COLORS[post.post_type] || 'bg-gray-100 text-gray-600'}`}>
          {TYPE_LABELS[post.post_type] || post.post_type}
        </span>
        {post.published_at && (
          <span className="text-xs text-gray-400">
            {new Date(post.published_at).toLocaleDateString('zh-TW')}
          </span>
        )}
      </div>

      <h1 className="text-2xl md:text-3xl font-bold text-primary mb-6">{post.title}</h1>

      {post.excerpt && (
        <p className="text-gray-500 text-base leading-relaxed mb-8 border-l-4 border-primary pl-4">{post.excerpt}</p>
      )}

      {/* Video */}
      {post.video_url && (
        <div className="mb-8 rounded-xl overflow-hidden">
          {isYouTube(post.video_url) ? (
            <div className="relative w-full" style={{ paddingTop: '56.25%' }}>
              <iframe
                src={getYouTubeEmbed(post.video_url)}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="absolute inset-0 w-full h-full rounded-xl"
              />
            </div>
          ) : (
            <video controls src={post.video_url} className="w-full rounded-xl" />
          )}
        </div>
      )}

      {/* Body HTML */}
      {post.body && (
        <div
          className="prose prose-gray max-w-none"
          dangerouslySetInnerHTML={{ __html: post.body }}
        />
      )}

      <div className="mt-10 pt-6 border-t border-gray-100">
        <Link to={backTo} className="text-sm text-gray-400 hover:text-primary underline">← 返回列表</Link>
      </div>
    </article>
  )
}
