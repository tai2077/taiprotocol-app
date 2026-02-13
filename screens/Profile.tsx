import React from 'react';
import { useTonConnectUI } from '@tonconnect/ui-react';
import { Link } from 'react-router-dom';
import { UserStats } from '../types';
import { AppLocale, formatPoints, formatTai, shortAddress } from '../lib/format';
import { computePriorityQuota, DEFAULT_UNLOCK_ROUNDS, getPointsLabel, getRoundLabel } from '../lib/points';

interface ProfileProps {
  stats: UserStats;
  walletAddress: string | null;
  locale: AppLocale;
}

const Profile: React.FC<ProfileProps> = ({ stats, walletAddress, locale }) => {
  const isZh = locale === 'zh';
  const [tonConnectUI] = useTonConnectUI();

  const managedTai = Math.max(stats.taiBalance + stats.lockedTai, 1);
  const assetHealth = Math.max(
    0,
    Math.min(100, Math.round((stats.taiBalance / managedTai) * 100))
  );
  const rounds = [...DEFAULT_UNLOCK_ROUNDS].sort(
    (a, b) => new Date(a.unlockAt).getTime() - new Date(b.unlockAt).getTime()
  );
  const nowMs = Date.now();
  const currentRound = rounds.find((round) => new Date(round.unlockAt).getTime() >= nowMs) || rounds[rounds.length - 1];
  const priorityQuota = computePriorityQuota(stats.points, currentRound.priorityTaiCapPerUser);

  return (
    <div className="page-view">
      <div className="hero-card p-6">
        <div>
          <p className="section-kicker">{isZh ? '我的档案' : 'My Profile'}</p>
          <div className="mt-2 flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center shrink-0"
              style={{
                background: 'linear-gradient(135deg, #1a1a1a, #0d0d0d)',
                border: '1px solid rgba(207,172,86,0.28)',
              }}
            >
              <span className="text-base font-black text-[#cfac56]/70">
                {walletAddress ? walletAddress.slice(0, 2).toUpperCase() : '?'}
              </span>
            </div>
            <div className="min-w-0">
              <p className="text-lg font-black mt-0.5">
                {walletAddress ? shortAddress(walletAddress, 8, 6) : isZh ? '钱包未连接' : 'Wallet not connected'}
              </p>
              {walletAddress && <p className="text-[10px] font-bold text-white/60 break-all mt-1">{walletAddress}</p>}
            </div>
          </div>

          <div className="mt-3 grid grid-cols-3 gap-2">
            <div className="imperial-data rounded-xl px-2.5 py-2">
              <p className="text-[9px] font-bold text-white/60">{isZh ? '排名' : 'Rank'}</p>
              <p className="text-sm font-black number-display">#{stats.rank ?? '-'}</p>
            </div>
            <div className="imperial-data rounded-xl px-2.5 py-2">
              <p className="text-[9px] font-bold text-white/60">{isZh ? 'TON 余额' : 'TON'}</p>
              <p className="text-sm font-black number-display">
                {stats.tonBalance.toLocaleString(locale === 'zh' ? 'zh-CN' : 'en-US', { maximumFractionDigits: 2 })}
              </p>
            </div>
            <div className="imperial-deep rounded-xl px-2.5 py-2">
              <p className="text-[9px] font-bold">{isZh ? '资产健康' : 'Asset Health'}</p>
              <p className="text-sm font-black number-display">{assetHealth}%</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2.5">
        <button
          className="w-full tai-btn tai-btn-dark hover-lift"
          onClick={() => (walletAddress ? tonConnectUI.disconnect() : tonConnectUI.openModal())}
        >
          {walletAddress ? (isZh ? '断开钱包' : 'Disconnect') : (isZh ? '连接钱包' : 'Connect Wallet')}
        </button>
        <Link to="/achievements" className="w-full tai-btn tai-btn-primary hover-lift">
          {isZh ? '查看成就' : 'View Achievements'}
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="neo-card p-3.5">
          <p className="section-kicker">{isZh ? '链上 TAI' : 'On-chain TAI'}</p>
          <p className="text-lg font-black mt-1 number-display">{formatTai(stats.onchainTai, locale)}</p>
        </div>
        <div className="neo-card p-3.5">
          <p className="section-kicker">{isZh ? '已锁定' : 'Locked'}</p>
          <p className="text-lg font-black mt-1 number-display">{formatTai(stats.lockedTai, locale)}</p>
        </div>
        <div className="neo-card p-3.5">
          <p className="section-kicker">{isZh ? '可用 TAI' : 'Available TAI'}</p>
          <p className="text-lg font-black mt-1 number-display">{formatTai(stats.taiBalance, locale)}</p>
        </div>
        <div className="neo-card p-3.5">
          <p className="section-kicker">{isZh ? '全局积分' : 'Global Points'}</p>
          <p className="text-lg font-black mt-1 number-display">{formatPoints(stats.points, locale)}</p>
        </div>
      </div>

      <div className="neo-card p-4">
        <div className="flex items-center justify-between">
          <p className="section-kicker">{isZh ? '积分等级' : 'Points Tier'}</p>
          <span className="imperial-chip imperial-chip-primary">
            {getPointsLabel(priorityQuota.level, locale)}
          </span>
        </div>
        <p className="text-sm font-black mt-2 text-white/80">
          {isZh
            ? `你在 ${getRoundLabel(currentRound, locale)} 的优先额度为 ${formatTai(priorityQuota.quotaTai, locale)}。`
            : `Your priority quota in ${getRoundLabel(currentRound, locale)} is ${formatTai(priorityQuota.quotaTai, locale)}.`}
        </p>
        <p className="text-[11px] font-bold text-white/60 mt-1">
          {isZh
            ? `等级加成后积分：${formatPoints(priorityQuota.boostedPoints, locale)}`
            : `Boosted points: ${formatPoints(priorityQuota.boostedPoints, locale)}`}
        </p>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <Link to="/rewards" className="w-full tai-btn tai-btn-primary hover-lift">
            {isZh ? '积分中心' : 'Points Center'}
          </Link>
          <Link to="/unlocks" className="w-full tai-btn tai-btn-dark hover-lift">
            {isZh ? '解锁优先购' : 'Unlock Priority'}
          </Link>
        </div>
      </div>

      <div className="neo-card p-4">
        <p className="section-kicker">{isZh ? '账号设置' : 'Account Settings'}</p>
        <div className="mt-2 grid grid-cols-3 gap-2">
          <div className="imperial-data rounded-xl px-2.5 py-2">
            <p className="text-[9px] font-bold text-white/60">{isZh ? '语言' : 'Language'}</p>
            <p className="text-[11px] font-black">{isZh ? '中 / EN' : 'ZH / EN'}</p>
          </div>
          <div className="imperial-data rounded-xl px-2.5 py-2">
            <p className="text-[9px] font-bold text-white/60">{isZh ? '通知设置' : 'Notifications'}</p>
            <p className="text-[11px] font-black">{isZh ? '已开启' : 'On'}</p>
          </div>
          <div className="imperial-data rounded-xl px-2.5 py-2">
            <p className="text-[9px] font-bold text-white/60">{isZh ? '积分账户' : 'Points'}</p>
            <p className="text-[11px] font-black">{isZh ? '已启用' : 'Enabled'}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
