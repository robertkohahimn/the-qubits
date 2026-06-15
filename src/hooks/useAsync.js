import { useState, useEffect } from 'react'

// Runs `fn` when `enabled` and on `deps` change; tracks loading/data/error.
// `fn` must be stable enough to be recreated each render (we only depend on deps).
export function useAsync(fn, deps, enabled = true) {
  const [state, setState] = useState({
    data: null,
    loading: enabled,
    error: null,
  })

  useEffect(() => {
    if (!enabled) {
      setState({ data: null, loading: false, error: null })
      return
    }
    let active = true
    setState((s) => ({ ...s, loading: true, error: null }))
    fn()
      .then((data) => active && setState({ data, loading: false, error: null }))
      .catch((error) => active && setState({ data: null, loading: false, error }))
    return () => {
      active = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  return state
}
