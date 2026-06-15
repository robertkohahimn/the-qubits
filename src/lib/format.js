const ACCENT_VARS = {
  purple: '--p-purple',
  teal: '--p-teal',
  yellow: '--p-yellow',
  orange: '--p-orange-line',
  pink: '--p-pink',
  blueLight: '--p-blue-light',
  blueVibrant: '--p-blue-vibrant',
}

export function formatReadTime(minutes) {
  return `${String(minutes).padStart(2, '0')} mins`
}

export function formatComplexity(complexity) {
  return `${complexity} Tier`
}

export function accentVar(accent) {
  return `var(${ACCENT_VARS[accent] ?? ACCENT_VARS.purple})`
}

export function formatCode(n) {
  return String(n).padStart(3, '0')
}
