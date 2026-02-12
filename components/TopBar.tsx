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
    <div className="sticky top-0 z-40 px-5 pb-3 safe-top-pad app-atmosphere">
      <div className="neo-card-dark px-4 py-3.5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="section-kicker">{locale === 'zh' ? 'TAI 协议 · 帝国应用' : 'TAI PROTOCOL · IMPERIAL APP'}</p>
            <h1
              className="text-[1.02rem] font-black leading-tight mt-1 line-clamp-2 text-white uppercase"
              style={{ fontFamily: '"Cinzel","Inter",sans-serif' }}
            >
              {title}
            </h1>
          </div>
          <div className="flex items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={onToggleLocale}
              className="tap-target tai-btn tai-btn-accent !min-h-9 !px-3 !py-2 !text-[11px]"
            >
              {locale === 'zh' ? 'EN' : 'ZH'}
            </button>
            <Link
              to="/profile"
              className="relative tap-target tai-btn tai-btn-dark !min-h-9 !px-3.5 !py-2 !text-[11px] max-w-[122px] truncate"
            >
              {walletAddress && (
                <span
                  aria-hidden="true"
                  className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full"
                  style={{ background: '#18f2a6', border: '1px solid #0d0d0d' }}
                />
              )}
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
