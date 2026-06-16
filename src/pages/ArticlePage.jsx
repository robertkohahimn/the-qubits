import { useRef, useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import DotLabel from '../components/DotLabel'
import IconButton from '../components/IconButton'
import PillButton from '../components/PillButton'
import RelatedCard from '../components/RelatedCard'
import ProgressBar from '../components/ProgressBar'
import Markdown from '../components/Markdown'
import { Loading, ErrorState, NotFound } from '../components/StateViews'
import { usePost, useRelated } from '../hooks/posts'
import { formatReadTime, formatComplexity, formatCode } from '../lib/format'
import './ArticlePage.css'

export default function ArticlePage() {
  const { slug } = useParams()
  const { data, loading, error } = usePost(slug)
  const { data: related } = useRelated(slug)

  const viewportRef = useRef(null)
  const [progress, setProgress] = useState(0)
  const [trackedSlug, setTrackedSlug] = useState(slug)
  const post = data?.post

  // Reset reading progress when navigating to a different article. Adjusting
  // state during render on a changed value is the React-recommended pattern and
  // avoids a cascading-render setState inside an effect.
  if (slug !== trackedSlug) {
    setTrackedSlug(slug)
    setProgress(0)
  }

  useEffect(() => {
    const el = viewportRef.current
    if (!el) return
    const handleScroll = () => {
      const scrollHeight = el.scrollHeight - el.clientHeight
      const pct = scrollHeight > 0 ? Math.round((el.scrollTop / scrollHeight) * 100) : 0
      setProgress(Math.min(100, Math.max(0, pct)))
    }
    el.addEventListener('scroll', handleScroll)
    return () => el.removeEventListener('scroll', handleScroll)
  }, [post])

  if (loading) return <Loading />
  if (error) return error.status === 404 ? <NotFound /> : <ErrorState message="Could not load this article." />
  if (!post) return <NotFound />

  const { prev, next } = data

  return (
    <main className="editorial-grid article-grid">
      <section className="article-viewport" ref={viewportRef}>
        <nav className="nav-header">
          <DotLabel color="var(--p-purple)">
            <Link to="/" style={{ color: 'inherit', textDecoration: 'none' }}>
              Quantum Media / {formatCode(post.codeNumber)}
            </Link>
          </DotLabel>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <IconButton ariaLabel="Bookmark" className="icon-btn-ghost">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
              </svg>
            </IconButton>
            <IconButton ariaLabel="Share" className="icon-btn-ghost">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                <polyline points="15 3 21 3 21 9" />
                <line x1="10" y1="14" x2="21" y2="3" />
              </svg>
            </IconButton>
          </div>
        </nav>

        <header className="article-hero">
          <h1>{post.title}</h1>
          <div className="hero-meta">
            <div className="meta-item">
              <div className="label">Author</div>
              <div className="value">{post.author}</div>
            </div>
            <div className="meta-item">
              <div className="label">Read Time</div>
              <div className="value">{formatReadTime(post.readMinutes)}</div>
            </div>
            <div className="meta-item">
              <div className="label">Complexity</div>
              <div className="value">{formatComplexity(post.complexity)}</div>
            </div>
          </div>
        </header>

        <div className="article-body">
          <Markdown>{post.bodyMd}</Markdown>
        </div>
      </section>

      <aside className="sidebar">
        <h2>Related<br />Signals</h2>

        <div className="related-list">
          {(related ?? []).map((r) => (
            <RelatedCard
              key={r.slug}
              slug={r.slug}
              title={r.title}
              category={r.category}
              codeNumber={r.codeNumber}
              accent={r.accent}
            />
          ))}
        </div>

        <ProgressBar label="Reading Progress" percent={progress} />

        <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem' }}>
          {prev ? (
            <PillButton color="var(--p-yellow)" as={Link} to={`/article/${prev.slug}`} style={{ flex: 1 }}>
              Previous
            </PillButton>
          ) : (
            <PillButton color="var(--p-yellow)" disabled aria-disabled="true" style={{ flex: 1, opacity: 0.4, cursor: 'not-allowed' }}>
              Previous
            </PillButton>
          )}
          {next ? (
            <PillButton color="var(--p-blue-light)" as={Link} to={`/article/${next.slug}`} style={{ flex: 1 }}>
              Next
            </PillButton>
          ) : (
            <PillButton color="var(--p-blue-light)" disabled aria-disabled="true" style={{ flex: 1, opacity: 0.4, cursor: 'not-allowed' }}>
              Next
            </PillButton>
          )}
        </div>
      </aside>
    </main>
  )
}
