import React, { useEffect, useMemo, useState } from 'react';
import { safeGetStorage, safeSetStorage } from '../lib/storage';

const DISMISS_KEY = 'tai:pwa-install-dismissed:v1';
type Locale = 'zh' | 'en';

function isStandaloneMode(): boolean {
  const media = window.matchMedia?.('(display-mode: standalone)')?.matches;
  const iosStandalone = (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
  return Boolean(media || iosStandalone);
}

function isIOSDevice(): boolean {
  return /iphone|ipad|ipod/i.test(window.navigator.userAgent || '');
}

const COPY = {
  zh: {
    title: '安装应用',
    subtitlePrompt: '将 TAI 添加到主屏幕，打开更快，并获得全屏移动端体验。',
    subtitleManual: 'iPhone Safari：点击“分享”，然后选择“添加到主屏幕”。',
    dismissAria: '关闭安装提示',
    installNow: '立即安装',
    howToInstall: '安装步骤',
    later: '稍后',
    step1: '1. 打开“分享”菜单',
    step2: '2. 选择“添加到主屏幕”',
  },
  en: {
    title: 'Install App',
    subtitlePrompt: 'Install TAI to home screen for faster launch and full-screen mobile experience.',
    subtitleManual: 'On iPhone Safari: tap Share, then Add to Home Screen.',
    dismissAria: 'Dismiss install prompt',
    installNow: 'Install Now',
    howToInstall: 'How to Install',
    later: 'Later',
    step1: '1. Open Share menu',
    step2: '2. Choose Add to Home Screen',
  },
} as const;

const PwaInstallPrompt: React.FC<{ locale: Locale }> = ({ locale }) => {
  const isZh = locale === 'zh';
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState<boolean>(() => isStandaloneMode());
  const [dismissed, setDismissed] = useState<boolean>(() => safeGetStorage(DISMISS_KEY) === '1');
  const [showIosGuide, setShowIosGuide] = useState(false);

  const isIos = useMemo(() => isIOSDevice(), []);
  const inTelegram = useMemo(() => Boolean(window.Telegram?.WebApp), []);

  useEffect(() => {
    const onBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
    };

    const onAppInstalled = () => {
      setInstalled(true);
      setDeferredPrompt(null);
      safeSetStorage(DISMISS_KEY, '1');
    };

    const mediaQuery = window.matchMedia?.('(display-mode: standalone)');
    const onDisplayModeChanged = (event: MediaQueryListEvent) => {
      if (event.matches) {
        setInstalled(true);
      }
    };

    window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt);
    window.addEventListener('appinstalled', onAppInstalled);
    mediaQuery?.addEventListener?.('change', onDisplayModeChanged);

    if (isStandaloneMode()) {
      setInstalled(true);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstallPrompt);
      window.removeEventListener('appinstalled', onAppInstalled);
      mediaQuery?.removeEventListener?.('change', onDisplayModeChanged);
    };
  }, []);

  const dismiss = () => {
    setDismissed(true);
    safeSetStorage(DISMISS_KEY, '1');
  };

  const install = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        setDismissed(true);
        safeSetStorage(DISMISS_KEY, '1');
      }
      setDeferredPrompt(null);
      return;
    }
    setShowIosGuide(true);
  };

  const canShowIOSManual = isIos && !inTelegram;
  const shouldShow = !installed && !dismissed && (Boolean(deferredPrompt) || canShowIOSManual);

  if (!shouldShow) return null;

  const text = isZh ? COPY.zh : COPY.en;

  return (
    <div className="fixed left-1/2 -translate-x-1/2 w-[94%] max-w-[430px] z-[64]" style={{ bottom: 'calc(var(--safe-bottom) + 6rem)' }}>
      <div className="neo-card p-3.5">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="section-kicker">{text.title}</p>
            <p className="text-[11px] font-black text-white/80 leading-snug">
              {deferredPrompt
                ? text.subtitlePrompt
                : text.subtitleManual}
            </p>
          </div>
          <button
            type="button"
            onClick={dismiss}
            className="tap-target tai-btn tai-btn-soft !min-h-8 !min-w-8 !px-2 !py-1 text-[10px]"
            aria-label={text.dismissAria}
          >
            X
          </button>
        </div>

        <div className="mt-2 grid grid-cols-2 gap-2">
          <button type="button" onClick={install} className="tai-btn tai-btn-primary hover-lift">
            {deferredPrompt ? text.installNow : text.howToInstall}
          </button>
          <button type="button" onClick={dismiss} className="tai-btn tai-btn-soft hover-lift">
            {text.later}
          </button>
        </div>

        {showIosGuide && (
          <div className="mt-2 rounded-xl imperial-data px-3 py-2">
            <p className="text-[11px] font-bold text-white/70">{text.step1}</p>
            <p className="text-[11px] font-bold text-white/70">{text.step2}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PwaInstallPrompt;
