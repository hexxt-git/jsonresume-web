import { Component, type ReactNode, type ErrorInfo } from 'react';
import { Button } from '@/components/ui/Button';

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
        <div className="flex h-full flex-col items-center justify-center p-6 text-center">
          <div className="text-danger mb-1 text-sm font-medium">Something went wrong</div>
          <p className="text-text-muted mb-3 max-w-xs text-xs">
            {this.state.error.message || 'An unexpected error occurred.'}
          </p>
          <Button
            onClick={() => this.setState({ error: null })}
            className="px-6 py-2.5 font-bold tracking-widest uppercase"
          >
            Try again
          </Button>
        </div>
      );
    }
    return this.props.children;
  }
}
