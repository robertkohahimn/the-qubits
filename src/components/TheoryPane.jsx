import { Link } from 'react-router-dom'
import DotLabel from './DotLabel'
import IconButton from './IconButton'
import PillButton from './PillButton'
import './TheoryPane.css'

export default function TheoryPane({ post }) {
  const title = post?.title ?? 'Superposition'
  const excerpt =
    post?.excerpt ??
    'Unlike classical bits which exist as 0 or 1, a qubit can exist in a complex linear combination of both states simultaneously until measured.'
  const to = post ? `/article/${post.slug}` : '#'

  return (
    <section className="pane-accent">
      <header className="section-header">
        <DotLabel color="var(--p-orange-line)">Theory</DotLabel>
        <IconButton ariaLabel="Close" color="var(--p-blue-dark)">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </IconButton>
      </header>

      <svg className="star-icon" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="1.5">
        <path d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z" fill="#FFFFFF" stroke="none" />
      </svg>

      <h2>{title}</h2>

      <p className="subtext">{excerpt}</p>

      <svg className="quantum-vector" viewBox="0 0 400 250" preserveAspectRatio="xMidYMid slice">
        <g>
          <rect x="0" y="40" width="400" height="6" fill="#333333" />
          <rect x="0" y="80" width="400" height="6" fill="#333333" />
          <rect x="0" y="120" width="400" height="6" fill="#333333" />
          <rect x="0" y="160" width="400" height="6" fill="#333333" />
          <rect x="0" y="200" width="400" height="6" fill="#333333" />
          <rect x="0" y="240" width="400" height="6" fill="#333333" />
        </g>
        <circle cx="200" cy="140" r="100" fill="var(--p-pink)" />
        <circle cx="200" cy="140" r="100" fill="none" stroke="var(--p-blue-vibrant)" strokeWidth="8" />
        <path d="M 80 240 Q 140 140 200 140 T 320 40" fill="none" stroke="var(--p-yellow)" strokeWidth="8" strokeLinecap="round" />
        <circle cx="260" cy="90" r="12" fill="var(--p-teal)" />
        <path d="M 80 240 L 95 240" stroke="var(--p-yellow)" strokeWidth="8" strokeLinecap="round" />
      </svg>

      <div className="pane-accent-footer">
        <div className="data-label" style={{ opacity: 1, alignSelf: 'flex-end', paddingBottom: '0.6rem' }}>
          mathematical probability<br />distribution models
        </div>
        <div>
          <PillButton
            color="var(--c-white)"
            bg="var(--p-blue-vibrant)"
            borderColor="var(--p-blue-vibrant)"
            hoverBg="var(--c-white)"
            hoverColor="var(--p-blue-vibrant)"
            hoverBorderColor="var(--c-white)"
            href="#"
            style={{ marginRight: '1rem' }}
          >
            Fav
          </PillButton>
          <PillButton
            color="var(--c-bg)"
            bg="var(--p-grey-solid)"
            borderColor="var(--p-grey-solid)"
            hoverBg="var(--c-white)"
            hoverColor="var(--c-bg)"
            hoverBorderColor="var(--c-white)"
            as={Link}
            to={to}
          >
            Next
          </PillButton>
        </div>
      </div>
    </section>
  )
}
