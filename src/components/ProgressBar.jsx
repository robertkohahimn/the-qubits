import './ProgressBar.css'

export default function ProgressBar({ label, percent, fillColor }) {
  return (
    <div className="progress-container">
      <div className="progress-meta">
        <span>{label}</span>
        <span>{percent}%</span>
      </div>
      <div className="progress-bar">
        <div
          className="progress-fill"
          style={{ width: `${percent}%`, background: fillColor || 'var(--p-pink)' }}
        />
      </div>
    </div>
  )
}
