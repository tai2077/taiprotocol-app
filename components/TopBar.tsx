import React from 'react';
import { Link } from 'react-router-dom';
import { shortAddress } from '../lib/format';

interface TopBarProps {
  title: string;
  walletAddress: string | null;
  locale: 'zh' | 'en';
  onToggleLocale: () => void;
}

const TopBar: React.FC<TopBarProps> = ({ title, walletAddress, locale, onToggleLocale }) => {
  return (
    <div className="sticky top-0 z-40 px-4 pb-3 safe-top-pad app-atmosphere">
      <div className="neo-card-dark px-4 py-3 border border-white/12 shadow-brutal-xl">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="section-kicker text-primary">{locale === 'zh' ? 'TAI 目标存款协议' : 'TAI Goal Deposit Protocol'}</p>
            <h1 className="text-lg font-black tracking-tight truncate">{title}</h1>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={onToggleLocale}
              className="tap-target bg-primary/92 text-bg-dark brutal-border-thin px-2.5 py-2 text-[10px] font-black rounded-xl hover-lift"
            >
              {locale === 'zh' ? 'EN' : 'ZH'}
            </button>
            <Link
              to="/profile"
              className="tap-target bg-white/12 text-white brutal-border-thin px-3 py-2 text-[10px] font-black rounded-xl hover-lift"
            >
              {walletAddress ? shortAddress(walletAddress, 5, 4) : locale === 'zh' ? '连接钱包' : 'Connect'}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TopBar;
