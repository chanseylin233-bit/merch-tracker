import { Component, type ReactNode } from 'react'
import './ErrorBoundary.css'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo)
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="error-boundary">
          <div className="error-boundary__icon">⚠️</div>
          <div className="error-boundary__title">页面出错了</div>
          <div className="error-boundary__message">
            {this.state.error?.message || '发生了未知错误'}
          </div>
          <button className="error-boundary__btn" onClick={this.handleReset}>
            重试
          </button>
          <button 
            className="error-boundary__btn error-boundary__btn--secondary"
            onClick={() => window.location.reload()}
          >
            刷新页面
          </button>
        </div>
      )
    }

    return this.props.children
  }
}
