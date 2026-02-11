import React from 'react';
import { Link } from 'react-router-dom';
import { shortAddress } from '../lib/format';
import QuickNavMenu from './QuickNavMenu';

interface TopBarProps {
  title: string;
  walletAddress: string | null;
  locale: 'zh' | 'en';
  onToggleLocale: () => void;
  navMode: 'bottom' | 'top-right';
}

const TopBar: React.FC<TopBarProps> = ({ title, walletAddress, locale, onToggleLocale, navMode }) => {
  return (
    <div className="sticky top-0 z-40 px-4 pb-4 safe-top-pad app-atmosphere">
      <div className="neo-card-dark px-4 py-3.5 border border-white/12 shadow-brutal-xl">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="section-kicker text-primary">{locale === 'zh' ? 'TAI 协议 · 迷你应用' : 'TAI PROTOCOL · MINI APP'}</p>
            <h1 className="text-[1.15rem] font-black tracking-tight leading-snug mt-1 line-clamp-2">{title}</h1>
          </div>
          <div className="flex items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={onToggleLocale}
              className="tap-target bg-primary/92 text-bg-dark brutal-border-thin px-3 py-2 text-[11px] font-black rounded-xl hover-lift"
            >
              {locale === 'zh' ? 'EN' : 'ZH'}
            </button>
            <Link
              to="/profile"
              className="tap-target bg-white/12 text-white brutal-border-thin px-3.5 py-2 text-[11px] font-black rounded-xl hover-lift max-w-[122px] truncate"
            >
              {walletAddress ? shortAddress(walletAddress, 5, 4) : locale === 'zh' ? '连接钱包' : 'Connect'}
            </Link>
            {navMode === 'top-right' && <QuickNavMenu locale={locale} />}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TopBar;
