import { Component, type ReactNode, type ErrorInfo } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  /** Label for the boundary — shown in error UI */
  label?: string;
}

interface State {
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(
      `[ErrorBoundary${this.props.label ? `: ${this.props.label}` : ''}]`,
      error,
      info.componentStack,
    );
  }

  render() {
    if (this.state.error) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <div className="flex flex-col items-center justify-center h-full p-6 text-center">
          <div className="text-sm font-medium text-danger mb-1">Something went wrong</div>
          <p className="text-xs text-text-muted mb-3 max-w-xs">
            {this.state.error.message || 'An unexpected error occurred.'}
          </p>
          <button
            onClick={() => this.setState({ error: null })}
            className="text-xs px-4 py-1.5 bg-accent text-white rounded-md hover:opacity-90 cursor-pointer"
          >
            Try again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
