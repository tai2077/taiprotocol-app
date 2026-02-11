import React from 'react';
import { useTonConnectUI } from '@tonconnect/ui-react';
import { Link } from 'react-router-dom';
import { UserStats } from '../types';
import { AppLocale, formatTai, shortAddress } from '../lib/format';

interface ProfileProps {
  stats: UserStats;
  walletAddress: string | null;
  locale: AppLocale;
}

const Profile: React.FC<ProfileProps> = ({ stats, walletAddress, locale }) => {
  const isZh = locale === 'zh';
  const [tonConnectUI] = useTonConnectUI();

  const assetHealth = Math.max(0, Math.min(100, Math.round((stats.onchainTai / Math.max(stats.onchainTai + stats.pendingTai, 1)) * 100)));

  return (
    <div className="page-view">
      <div className="neo-card-dark p-6 relative overflow-hidden">
        <div className="pointer-events-none absolute -top-12 -right-10 h-44 w-44 rounded-full bg-primary/18 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-16 -left-8 h-40 w-40 rounded-full bg-accent/18 blur-3xl" />

        <div className="relative z-10">
          <p className="section-kicker text-accent">{isZh ? '我的档案' : 'My Profile'}</p>
          <p className="text-lg font-black mt-1">{walletAddress ? shortAddress(walletAddress, 8, 6) : isZh ? '钱包未连接' : 'Wallet not connected'}</p>
          {walletAddress && <p className="text-[10px] font-bold text-white/60 break-all mt-1">{walletAddress}</p>}

          <div className="mt-3 grid grid-cols-3 gap-2">
            <div className="bg-white/10 brutal-border-thin rounded-xl px-2.5 py-2">
              <p className="text-[9px] font-bold text-white/60">{isZh ? '排名' : 'Rank'}</p>
              <p className="text-sm font-black">#{stats.rank ?? '-'}</p>
            </div>
            <div className="bg-white/10 brutal-border-thin rounded-xl px-2.5 py-2">
              <p className="text-[9px] font-bold text-white/60">{isZh ? 'TON 余额' : 'TON'}</p>
              <p className="text-sm font-black">{stats.tonBalance.toLocaleString(locale === 'zh' ? 'zh-CN' : 'en-US', { maximumFractionDigits: 2 })}</p>
            </div>
            <div className="bg-primary text-bg-dark brutal-border-thin rounded-xl px-2.5 py-2">
              <p className="text-[9px] font-bold">{isZh ? '资产健康' : 'Asset Health'}</p>
              <p className="text-sm font-black">{assetHealth}%</p>
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
          <p className="text-lg font-black mt-1">{formatTai(stats.onchainTai, locale)}</p>
        </div>
        <div className="neo-card p-3.5">
          <p className="section-kicker">{isZh ? '已锁定' : 'Locked'}</p>
          <p className="text-lg font-black mt-1">{formatTai(stats.lockedTai, locale)}</p>
        </div>
        <div className="neo-card p-3.5">
          <p className="section-kicker">{isZh ? '可用 TAI' : 'Available TAI'}</p>
          <p className="text-lg font-black mt-1">{formatTai(stats.taiBalance, locale)}</p>
        </div>
        <div className="neo-card p-3.5">
          <p className="section-kicker">{isZh ? '待领取 TAI' : 'Pending TAI'}</p>
          <p className="text-lg font-black mt-1">{formatTai(stats.pendingTai, locale)}</p>
        </div>
      </div>

      <div className="neo-card p-4">
        <div className="flex items-center justify-between">
          <p className="section-kicker">{isZh ? '可领取状态' : 'Claim Status'}</p>
          <span className={`text-[10px] px-2.5 py-1 rounded-full font-black ${stats.pendingTai > 0 ? 'bg-primary text-bg-dark' : 'bg-black/10 text-black/65'}`}>
            {stats.pendingTai > 0 ? (isZh ? '可领取' : 'Claimable') : (isZh ? '暂无' : 'None')}
          </span>
        </div>
        <p className="text-sm font-black mt-2 text-black/80">
          {stats.pendingTai > 0
            ? (isZh ? '你有待领取奖励，可前往奖励页执行链上领取。' : 'You have pending rewards. Go to rewards page to claim on-chain.')
            : (isZh ? '当前暂无待领取奖励，继续完成任务和邀请可提升。' : 'No pending rewards now. Complete missions and invites to increase.')}
        </p>
        <Link to="/rewards" className="mt-3 w-full tai-btn tai-btn-primary hover-lift">
          {isZh ? '前往领取中心' : 'Go to Rewards'}
        </Link>
      </div>

      <div className="neo-card-dark p-4">
        <p className="section-kicker text-accent">{isZh ? '账号设置' : 'Account Settings'}</p>
        <div className="mt-2 space-y-2 text-xs font-black text-white/80">
          <p>{isZh ? '语言：简体中文 / English' : 'Language: Simplified Chinese / English'}</p>
          <p>{isZh ? '通知：每日任务提醒（已开启）' : 'Notifications: Daily mission reminder (on)'}</p>
          <p>{isZh ? '分享：允许生成进度卡（已开启）' : 'Sharing: Progress cards enabled'}</p>
        </div>
      </div>
    </div>
  );
};

export default Profile;
