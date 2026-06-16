import { Link } from 'react-router-dom'
import { accentVar } from '../lib/format.js'
import './FeedItem.css'

export default function FeedItem({ slug, title, description, accent }) {
  const color = accentVar(accent)
  return (
    <article className="feed-item" style={{ borderColor: color }}>
      <h3>{title}</h3>
      <p>{description}</p>
      <Link to={`/article/${slug}`} className="more-link" style={{ color }}>
        More <span>⟶</span>
      </Link>
    </article>
  )
}
