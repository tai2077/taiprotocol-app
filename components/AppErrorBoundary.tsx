import React from 'react';

interface State {
  hasError: boolean;
}

const LOCALE_STORAGE_KEY = 'tai:locale:v1';

const COPY = {
  zh: {
    logPrefix: '应用运行时异常',
    kicker: '运行异常',
    title: '页面出现错误',
    body: '请刷新应用重试；如果持续出现，请联系支持。',
  },
  en: {
    logPrefix: 'Runtime error in app',
    kicker: 'Runtime Error',
    title: 'Something went wrong',
    body: 'Please refresh the app and try again. If it keeps happening, contact support.',
  },
} as const;

export class AppErrorBoundary extends React.Component<{ children: React.ReactNode }, State> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  private resolveLocale(): 'zh' | 'en' {
    try {
      const fromStorage = window.localStorage.getItem(LOCALE_STORAGE_KEY);
      if (fromStorage === 'en' || fromStorage === 'zh') return fromStorage;
    } catch {
      // ignore storage errors
    }
    const lang = document.documentElement.lang || navigator.language || '';
    return lang.toLowerCase().startsWith('zh') ? 'zh' : 'en';
  }

  componentDidCatch(error: unknown) {
    const locale = this.resolveLocale();
    console.error(COPY[locale].logPrefix, error);
  }

  render() {
    if (this.state.hasError) {
      const locale = this.resolveLocale();
      const text = COPY[locale];
      return (
        <div className="min-h-screen app-atmosphere flex items-center justify-center p-6">
          <div className="max-w-[430px] w-full neo-card p-6">
            <p className="section-kicker">{text.kicker}</p>
            <h1 className="text-2xl font-black tracking-tight mt-2">{text.title}</h1>
            <p className="text-xs font-bold text-black/70 mt-2">{text.body}</p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
