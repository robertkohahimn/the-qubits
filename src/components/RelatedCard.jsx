import { Link } from 'react-router-dom'
import { accentVar, formatCode } from '../lib/format.js'
import './RelatedCard.css'

export default function RelatedCard({ slug, title, category, codeNumber, accent }) {
  const color = accentVar(accent)
  return (
    <Link to={`/article/${slug}`} className="related-card" style={{ borderColor: color }}>
      <div className="related-card-tag" style={{ color }}>
        {category} / {formatCode(codeNumber)}
      </div>
      <h4>{title}</h4>
      <div className="related-card-arrow" style={{ color }}>
        ⟶
      </div>
    </Link>
  )
}
