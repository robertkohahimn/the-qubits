import { Link } from 'react-router-dom'
import './StateViews.css'

export function Loading({ label = 'Loading…' }) {
  return (
    <div className="state-view" role="status" aria-live="polite">
      <span className="state-dot" /> {label}
    </div>
  )
}

export function ErrorState({ message = 'Something went wrong.' }) {
  // Plain anchor (not <Link>) so this can render outside a Router, matching
  // the plan's router-less ErrorState test. A full reload to "/" is fine here.
  return (
    <div className="state-view state-error" role="alert">
      <p>{message}</p>
      <a href="/" className="state-link">
        Back to home
      </a>
    </div>
  )
}

export function NotFound() {
  return (
    <div className="state-view">
      <p>Signal lost — this article does not exist.</p>
      <Link to="/" className="state-link">
        Back to home
      </Link>
    </div>
  )
}
