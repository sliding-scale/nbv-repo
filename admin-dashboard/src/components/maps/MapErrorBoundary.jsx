import { Component } from 'react'

/** Renders the backup map when the Google map throws while opening. */
export default class MapErrorBoundary extends Component {
  state = { failed: false }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  componentDidCatch() {
    this.props.onError?.()
  }

  render() {
    if (this.state.failed) return this.props.fallback
    return this.props.children
  }
}
