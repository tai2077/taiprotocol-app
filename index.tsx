import './lib/polyfills';
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { TonConnectUIProvider, useTonConnectUI } from '@tonconnect/ui-react';
import App from './App';
import { AppErrorBoundary } from './components/AppErrorBoundary';
import { ToastProvider } from './components/ToastProvider';
import { clearTonProofConnectRequest, setupTonProofConnectRequest } from './lib/tonProof';
import './styles.css';

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('App root element "#root" was not found.');

const manifestUrl = `${window.location.origin}/tonconnect-manifest.json`;
const webApp = window.Telegram?.WebApp;
webApp?.ready?.();
webApp?.expand?.();
webApp?.enableClosingConfirmation?.();
webApp?.disableVerticalSwipes?.();

if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch((error) => {
      console.error('SW register failed', error);
    });
  });
}

if (import.meta.env.DEV && 'serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    registrations.forEach((registration) => {
      registration.unregister().catch(() => {});
    });
  }).catch(() => {});
}

const TonProofSetup: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [tonConnectUI] = useTonConnectUI();

  React.useEffect(() => {
    setupTonProofConnectRequest(tonConnectUI);
    return () => {
      clearTonProofConnectRequest(tonConnectUI);
    };
  }, [tonConnectUI]);

  return <>{children}</>;
};

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <AppErrorBoundary>
      <BrowserRouter>
        <TonConnectUIProvider manifestUrl={manifestUrl}>
          <TonProofSetup>
            <ToastProvider>
              <App />
            </ToastProvider>
          </TonProofSetup>
        </TonConnectUIProvider>
      </BrowserRouter>
    </AppErrorBoundary>
  </React.StrictMode>
);
