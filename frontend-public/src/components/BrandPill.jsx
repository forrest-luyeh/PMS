const BRANDS = [
  { slug: null,      label: '全部' },
  { slug: 'select',  label: '藏居 SELECT' },
  { slug: 'hotel',   label: '旅館 HOTEL' },
  { slug: 'express', label: '快捷 EXPRESS' },
]

export default function BrandPill({ selected, onChange }) {
  return (
    <div className="flex flex-wrap gap-2">
      {BRANDS.map(b => (
        <button key={b.slug ?? 'all'}
          onClick={() => onChange(b.slug)}
          className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-colors
            ${selected === b.slug
              ? 'bg-primary text-white border-primary'
              : 'bg-white text-gray-600 border-gray-300 hover:border-primary hover:text-primary'}`}>
          {b.label}
        </button>
      ))}
    </div>
  )
}
