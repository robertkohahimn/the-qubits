import './DotLabel.css'

export default function DotLabel({ children, color }) {
  return (
    <div className="dot-label" style={{ color }}>
      {children}
    </div>
  )
}
