interface TelegramWebApp {
  initData?: string;
  initDataUnsafe?: {
    start_param?: string;
  };
  ready?: () => void;
  expand?: () => void;
  enableClosingConfirmation?: () => void;
  disableVerticalSwipes?: () => void;
  BackButton?: {
    show: () => void;
    hide: () => void;
    onClick: (handler: () => void) => void;
    offClick: (handler: () => void) => void;
  };
  showAlert?: (message: string) => void;
}

interface TelegramWindow {
  WebApp?: TelegramWebApp;
}

interface Window {
  Telegram?: TelegramWindow;
}

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt: () => Promise<void>;
}
