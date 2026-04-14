import { Component } from "react"

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught:", error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: "'DM Sans', sans-serif",
            background: "#14161F",
            color: "#E0E0E8",
            padding: 32
          }}
        >
          <h1 style={{ fontSize: 28, fontWeight: 900, marginBottom: 8, color: "#EA6B26" }}>
            {'\u61C9\u7528\u7A0B\u5F0F\u767C\u751F\u932F\u8AA4'}
          </h1>
          <p style={{ fontSize: 14, opacity: 0.6, marginBottom: 24 }}>
            {this.state.error?.message || '\u672A\u77E5\u932F\u8AA4'}
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{
              background: "#EA6B26",
              color: "#fff",
              border: "none",
              borderRadius: 12,
              padding: "12px 32px",
              fontSize: 14,
              fontWeight: 700,
              cursor: "pointer"
            }}
          >
            {'\u91CD\u65B0\u6574\u7406'}
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
