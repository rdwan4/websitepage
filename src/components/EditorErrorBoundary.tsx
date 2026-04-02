import React from 'react';

type Props = {
  children: React.ReactNode;
  fallback: React.ReactNode;
};

type State = {
  hasError: boolean;
};

export class EditorErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: unknown) {
    console.error('Rich text editor crashed, falling back to textarea:', error);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }

    return this.props.children;
  }
}
