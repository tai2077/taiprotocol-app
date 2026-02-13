import React, { useEffect, useMemo, useRef, useState } from 'react';
import { api } from '../lib/api';
import { useToast } from '../components/ToastProvider';
import { AppLocale, shortAddress } from '../lib/format';

interface LeaderboardProps {
  rank: number;
  walletAddress: string | null;
  locale: AppLocale;
}

type BoardTab = 'invite' | 'goal' | 'diamond';

const Leaderboard: React.FC<LeaderboardProps> = ({ rank, walletAddress, locale }) => {
  const isZh = locale === 'zh';
  const { notify } = useToast();
  const [tab, setTab] = useState<BoardTab>('invite');
  const [list, setList] = useState<Awaited<ReturnType<typeof api.getInviteLeaderboard>>>([]);
  const [loading, setLoading] = useState(false);
  const notifyRef = useRef(notify);
  const isZhRef = useRef(isZh);

  useEffect(() => {
    notifyRef.current = notify;
    isZhRef.current = isZh;
  }, [notify, isZh]);

  useEffect(() => {
    setLoading(true);
    api
      .getInviteLeaderboard()
      .then((d) => setList(d || []))
      .catch(() => {
        setList([]);
        notifyRef.current(isZhRef.current ? '排行榜暂不可用' : 'Leaderboard is temporarily unavailable', 'error');
      })
      .finally(() => setLoading(false));
  }, []);

  const shortAddressText = (address: string) => {
    if (!address) return isZh ? '未知' : 'Unknown';
    if (address.includes('...')) return address;
    return shortAddress(address, 6, 4);
  };

  const inviteBoard = useMemo(
    () =>
      list.slice(0, 30).map((entry, idx) => ({
        rank: entry.rank || idx + 1,
        name: shortAddressText(entry.address),
        value: `${entry.inviteCount || 0}${isZh ? ' 人' : ''}`,
      })),
    [list, isZh]
  );

  const currentBoard = tab === 'invite' ? inviteBoard : [];
  const comingSoon = tab !== 'invite';
  const top3 = currentBoard.slice(0, 3);
  const rest = currentBoard.slice(3);
  const currentUserName = walletAddress ? shortAddressText(walletAddress) : null;

  const tabTitle = tab === 'invite'
    ? (isZh ? '邀请榜' : 'Invite Rank')
    : tab === 'goal'
      ? (isZh ? '达标榜' : 'Goal Rank')
      : (isZh ? '钻石手榜' : 'Diamond Hands');

  return (
    <div className="page-view">
      <div className="hero-card p-6">
        <div>
          <p className="section-kicker">{isZh ? '竞技榜单' : 'Rankings'}</p>
          <p className="text-3xl font-black tracking-tight mt-1">{tabTitle}</p>
          <div className="mt-3 grid grid-cols-3 gap-2">
            <div className="imperial-data rounded-xl px-2.5 py-2">
              <p className="text-[9px] font-bold text-white/60">{isZh ? '我的排名' : 'My Rank'}</p>
              <p className="text-sm font-black">#{rank || '-'}</p>
            </div>
            <div className="imperial-data rounded-xl px-2.5 py-2">
              <p className="text-[9px] font-bold text-white/60">{isZh ? '上榜人数' : 'Entries'}</p>
              <p className="text-sm font-black">{comingSoon ? '-' : loading ? '...' : currentBoard.length}</p>
            </div>
            <div className="imperial-deep rounded-xl px-2.5 py-2">
              <p className="text-[9px] font-bold">{isZh ? '当前身份' : 'Identity'}</p>
              <p className="text-sm font-black truncate">{walletAddress ? (isZh ? '已连接' : 'Connected') : (isZh ? '游客' : 'Guest')}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <button
          type="button"
          className={`py-2.5 rounded-xl border text-xs font-black transition ${
            tab === 'invite'
              ? 'imperial-deep text-accent border-accent/45'
              : 'imperial-data text-white border-[#cfac56]/20 hover:opacity-90'
          }`}
          onClick={() => setTab('invite')}
        >
          {isZh ? '邀请榜' : 'Invite'}
        </button>
        <button
          type="button"
          className={`py-2.5 rounded-xl border text-xs font-black transition ${
            tab === 'goal'
              ? 'imperial-deep text-accent border-accent/45'
              : 'imperial-data text-white border-[#cfac56]/20 hover:opacity-90'
          }`}
          onClick={() => setTab('goal')}
        >
          {isZh ? '达标榜' : 'Goal'}
        </button>
        <button
          type="button"
          className={`py-2.5 rounded-xl border text-xs font-black transition ${
            tab === 'diamond'
              ? 'imperial-deep text-accent border-accent/45'
              : 'imperial-data text-white border-[#cfac56]/20 hover:opacity-90'
          }`}
          onClick={() => setTab('diamond')}
        >
          {isZh ? '钻石手榜' : 'Diamond'}
        </button>
      </div>

      {comingSoon && (
        <div className="neo-card p-4 border border-[#cfac56]/35">
          <p className="text-xs font-black text-white/70">
            {isZh
              ? '该榜单将接入真实链上/业务数据后上线，当前不展示伪排行。'
              : 'This board will go live after real on-chain/business data is connected. No mock ranking is shown now.'}
          </p>
        </div>
      )}

      {!comingSoon && loading && <p className="text-xs font-black text-white/55">{isZh ? '加载中...' : 'Loading...'}</p>}
      {!comingSoon && !loading && currentBoard.length === 0 && <p className="text-xs font-black text-white/55">{isZh ? '暂无数据' : 'No data yet'}</p>}

      {!comingSoon && !loading && top3.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {top3.map((entry, idx) => (
            <div
              key={`top-${entry.name}-${idx}`}
              className={`p-3 rounded-2xl border text-center ${
                idx === 0
                  ? 'bg-gradient-to-b from-[#f2d98a] via-[#d3b163] to-[#9c722c] text-[#2d1a03] border-[#f2d98a]/80 shadow-[0_14px_26px_rgba(207,172,86,0.26)]'
                  : 'neo-card text-white'
              }`}
            >
              <p className="text-[10px] font-black uppercase">#{entry.rank}</p>
              <p className="text-xs font-black mt-1 truncate">{entry.name}</p>
              <p className="text-[10px] font-bold mt-1 opacity-70">{entry.value}</p>
            </div>
          ))}
        </div>
      )}

      {!comingSoon && !loading && rest.length > 0 && (
        <div className="space-y-2.5">
          {rest.map((entry, idx) => {
            const mine = Boolean(currentUserName && entry.name === currentUserName);
            return (
              <div
                key={`${tab}-${entry.name}-${idx}`}
                className={`p-3.5 rounded-xl brutal-border-thin flex justify-between items-center text-sm ${mine ? 'bg-primary/15 border-primary/45' : 'imperial-data'}`}
              >
                <span className="font-black">
                  #{entry.rank} {entry.name}
                </span>
                <span className="font-black text-white/70">{entry.value}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Leaderboard;
