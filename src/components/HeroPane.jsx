import { Link } from 'react-router-dom'
import DotLabel from './DotLabel'
import IconButton from './IconButton'
import PillButton from './PillButton'
import './HeroPane.css'

export default function HeroPane({ post }) {
  return (
    <article className="pane-dark">
      <header className="section-header">
        <DotLabel color="var(--p-purple)">The Qubits</DotLabel>
        <IconButton ariaLabel="Save" color="var(--p-yellow)">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
          </svg>
        </IconButton>
      </header>

      <h1>{post.title}</h1>

      <p className="subtext">{post.excerpt}</p>

      <div className="visual-stage">
        <div className="image-mask">
          <img src={post.heroImage} alt={post.title} />
        </div>
        <svg className="orbit-graphic" viewBox="0 0 100 100">
          <ellipse cx="50" cy="50" rx="48" ry="25" fill="none" stroke="var(--p-purple)" strokeWidth="0.3" transform="rotate(-15 50 50)" />
          <circle cx="95" cy="38" r="6" fill="var(--p-orange-solid)" />
        </svg>
      </div>

      <div className="footer-actions">
        <div className="data-lockup">
          <div className="data-value">433 QBs</div>
          <div className="data-label">converting logical states<br />to physical architecture</div>
        </div>
        <div>
          <PillButton color="var(--p-teal)" href="#" style={{ marginRight: '1rem' }}>Back</PillButton>
          <PillButton color="var(--p-orange-line)" as={Link} to={`/article/${post.slug}`}>Next</PillButton>
        </div>
      </div>
    </article>
  )
}
