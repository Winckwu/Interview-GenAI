import React, { Component, ReactNode, ErrorInfo } from 'react';
import './ErrorBoundary.css';

interface Props {
  children: ReactNode;
  fallback?: (error: Error, reset: () => void) => ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

/**
 * Error Boundary - Catches errors in child components
 *
 * Usage:
 * <ErrorBoundary>
 *   <YourComponent />
 * </ErrorBoundary>
 *
 * Or with custom fallback:
 * <ErrorBoundary fallback={(error, reset) => <CustomError error={error} onReset={reset} />}>
 *   <YourComponent />
 * </ErrorBoundary>
 */
class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error details for debugging
    console.error('Error caught by boundary:', error);
    console.error('Error info:', errorInfo);

    this.setState({
      errorInfo,
    });

    // Send error to logging service in production
    if (process.env.NODE_ENV === 'production') {
      // Example: sendErrorToLoggingService(error, errorInfo);
    }
  }

  resetError = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render() {
    if (this.state.hasError && this.state.error) {
      if (this.props.fallback) {
        return this.props.fallback(this.state.error, this.resetError);
      }

      return (
        <div className="error-boundary-container">
          <div className="error-boundary-card">
            <div className="error-boundary-icon">⚠️</div>

            <h2 className="error-boundary-title">出错了</h2>

            <p className="error-boundary-message">
              应用程序遇到一个错误，无法继续执行。
            </p>

            <div className="error-boundary-error">
              <strong>错误详情：</strong>
              <code>{this.state.error.message}</code>
            </div>

            {process.env.NODE_ENV === 'development' && (
              <div className="error-boundary-stack">
                <strong>Stack Trace：</strong>
                <pre className="error-boundary-pre">
                  {this.state.errorInfo?.componentStack}
                </pre>
              </div>
            )}

            <div className="error-boundary-actions">
              <button
                onClick={this.resetError}
                className="error-boundary-retry"
              >
                重试
              </button>

              <button
                onClick={() => window.location.href = '/'}
                className="error-boundary-home"
              >
                返回首页
              </button>
            </div>

            <p className="error-boundary-hint">
              如果问题持续发生，请 <a href="mailto:support@example.com">联系支持</a>
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
