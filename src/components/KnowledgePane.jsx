import { Link } from 'react-router-dom'
import DotLabel from './DotLabel'
import PillButton from './PillButton'
import FeedItem from './FeedItem'
import './KnowledgePane.css'

const TAGS = [
  { label: 'Hardware', color: 'var(--p-teal)' },
  { label: 'Algorithms', color: 'var(--p-purple)' },
  { label: 'Cryptography', color: 'var(--p-orange-solid)' },
]

export default function KnowledgePane({ posts = [] }) {
  return (
    <section className="pane-light">
      <header className="section-header">
        <DotLabel color="var(--p-blue-light)">Knowledge Base</DotLabel>
      </header>

      <h2>Index</h2>

      <div className="tag-group">
        {TAGS.map((tag) => (
          <PillButton
            key={tag.label}
            as={Link}
            to={`/?category=${tag.label}`}
            color={tag.color}
            borderColor={tag.color}
          >
            {tag.label}
          </PillButton>
        ))}
      </div>

      <div className="feed-list">
        {posts.map((post) => (
          <FeedItem
            key={post.slug}
            slug={post.slug}
            title={post.title}
            description={post.excerpt}
            accent={post.accent}
          />
        ))}
      </div>
    </section>
  )
}
