import './PillButton.css'

export default function PillButton({
  children,
  color,
  bg,
  borderColor,
  hoverBg,
  hoverColor,
  hoverBorderColor,
  href,
  onClick,
  style,
  as: As,
  ...rest
}) {
  // Polymorphic: explicit `as` (e.g. react-router Link) wins; otherwise an
  // anchor when an href is given, falling back to a button.
  const Tag = As || (href ? 'a' : 'button')
  const baseStyle = {
    color: color,
    backgroundColor: bg || 'transparent',
    borderColor: borderColor || color,
    ...style,
  }

  const handleMouseEnter = (e) => {
    if (hoverBg) e.currentTarget.style.backgroundColor = hoverBg
    if (hoverColor) e.currentTarget.style.color = hoverColor
    if (hoverBorderColor) e.currentTarget.style.borderColor = hoverBorderColor
  }

  const handleMouseLeave = (e) => {
    e.currentTarget.style.backgroundColor = bg || 'transparent'
    e.currentTarget.style.color = color
    e.currentTarget.style.borderColor = borderColor || color
  }

  return (
    <Tag
      className="pill-btn"
      style={baseStyle}
      href={href || undefined}
      onClick={onClick}
      onMouseEnter={(hoverBg || hoverColor) ? handleMouseEnter : undefined}
      onMouseLeave={(hoverBg || hoverColor) ? handleMouseLeave : undefined}
      {...rest}
    >
      {children}
    </Tag>
  )
}
