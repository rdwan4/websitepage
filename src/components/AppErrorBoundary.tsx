import React from 'react';

type Language = 'en' | 'ar';

const translations = {
  en: {
    title: 'Something went wrong',
    body: 'The app hit an unexpected problem. Refreshing the page usually fixes it.',
    refresh: 'Refresh',
  },
  ar: {
    title: 'حدث خطأ غير متوقع',
    body: 'واجه التطبيق مشكلة غير متوقعة. غالبًا يكفي تحديث الصفحة للمتابعة.',
    refresh: 'تحديث الصفحة',
  },
};

type Props = {
  children: React.ReactNode;
  lang: Language;
};

type State = {
  hasError: boolean;
};

export class AppErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidUpdate(prevProps: Props) {
    if (prevProps.lang !== this.props.lang && this.state.hasError) {
      this.setState({ hasError: false });
    }
  }

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    const t = translations[this.props.lang];

    return (
      <div className="flex min-h-screen items-center justify-center bg-app-bg px-6 text-app-text">
        <div className="w-full max-w-lg rounded-3xl border border-white/10 bg-app-card/90 p-8 text-center shadow-2xl backdrop-blur-xl">
          <h1 className="mb-3 font-serif text-3xl font-bold">{t.title}</h1>
          <p className="mb-6 text-sm leading-7 text-app-muted">{t.body}</p>
          <button
            onClick={() => window.location.reload()}
            className="rounded-2xl bg-app-accent px-6 py-3 text-sm font-bold text-app-bg transition hover:bg-app-accent-hover"
          >
            {t.refresh}
          </button>
        </div>
      </div>
    );
  }
}

