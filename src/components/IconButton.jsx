import './IconButton.css'

export default function IconButton({ children, ariaLabel, color, onClick, className }) {
  return (
    <button
      className={`icon-btn${className ? ` ${className}` : ''}`}
      aria-label={ariaLabel}
      style={{ color }}
      onClick={onClick}
    >
      {children}
    </button>
  )
}
