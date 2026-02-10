import React, { useEffect, useMemo, useState } from 'react';
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

  useEffect(() => {
    setLoading(true);
    api
      .getInviteLeaderboard()
      .then((d) => setList(d || []))
      .catch(() => {
        setList([]);
        notify(isZh ? '排行榜暂不可用' : 'Leaderboard is temporarily unavailable', 'error');
      })
      .finally(() => setLoading(false));
  }, [notify, isZh]);

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

  const goalBoard = useMemo(
    () =>
      list.slice(0, 20).map((entry, idx) => {
        const progress = Math.min(100, 12 + (entry.inviteCount || 0) * 6 + idx);
        return {
          rank: idx + 1,
          name: shortAddressText(entry.address),
          value: isZh ? `目标达成 ${progress}%` : `Goal ${progress}%`,
        };
      }),
    [list, isZh]
  );

  const diamondBoard = useMemo(
    () =>
      list.slice(0, 20).map((entry, idx) => {
        const days = 5 + (entry.inviteCount || 0) * 2 + idx;
        return {
          rank: idx + 1,
          name: shortAddressText(entry.address),
          value: isZh ? `${days} 天` : `${days} days`,
        };
      }),
    [list, isZh]
  );

  const currentBoard = tab === 'invite' ? inviteBoard : tab === 'goal' ? goalBoard : diamondBoard;
  const top3 = currentBoard.slice(0, 3);
  const rest = currentBoard.slice(3);
  const currentUserName = walletAddress ? shortAddressText(walletAddress) : null;

  const tabTitle = tab === 'invite'
    ? (isZh ? '邀请榜' : 'Invite Rank')
    : tab === 'goal'
      ? (isZh ? '达标榜' : 'Goal Rank')
      : (isZh ? '钻石手榜' : 'Diamond Hands');

  return (
    <div className="flex-1 flex flex-col safe-content-bottom p-4 gap-4 animate-in fade-in duration-300 grid-background">
      <div className="neo-card-dark p-5 relative overflow-hidden">
        <div className="pointer-events-none absolute -top-12 -right-10 h-44 w-44 rounded-full bg-primary/18 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-16 -left-8 h-40 w-40 rounded-full bg-accent/18 blur-3xl" />

        <div className="relative z-10">
          <p className="section-kicker text-accent">{isZh ? '竞技榜单' : 'Rankings'}</p>
          <p className="text-2xl font-black tracking-tight mt-1">{tabTitle}</p>
          <div className="mt-3 grid grid-cols-3 gap-2">
            <div className="bg-white/10 brutal-border-thin rounded-xl px-2.5 py-2">
              <p className="text-[9px] font-bold text-white/60">{isZh ? '我的排名' : 'My Rank'}</p>
              <p className="text-sm font-black">#{rank || '-'}</p>
            </div>
            <div className="bg-white/10 brutal-border-thin rounded-xl px-2.5 py-2">
              <p className="text-[9px] font-bold text-white/60">{isZh ? '上榜人数' : 'Entries'}</p>
              <p className="text-sm font-black">{loading ? '...' : currentBoard.length}</p>
            </div>
            <div className="bg-primary text-bg-dark brutal-border-thin rounded-xl px-2.5 py-2">
              <p className="text-[9px] font-bold">{isZh ? '当前身份' : 'Identity'}</p>
              <p className="text-sm font-black truncate">{walletAddress ? (isZh ? '已连接' : 'Connected') : (isZh ? '游客' : 'Guest')}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <button
          className={`py-2.5 rounded-xl brutal-border-thin text-xs font-black transition ${tab === 'invite' ? 'bg-bg-dark text-white' : 'bg-white text-black'}`}
          onClick={() => setTab('invite')}
        >
          {isZh ? '邀请榜' : 'Invite'}
        </button>
        <button
          className={`py-2.5 rounded-xl brutal-border-thin text-xs font-black transition ${tab === 'goal' ? 'bg-bg-dark text-white' : 'bg-white text-black'}`}
          onClick={() => setTab('goal')}
        >
          {isZh ? '达标榜' : 'Goal'}
        </button>
        <button
          className={`py-2.5 rounded-xl brutal-border-thin text-xs font-black transition ${tab === 'diamond' ? 'bg-bg-dark text-white' : 'bg-white text-black'}`}
          onClick={() => setTab('diamond')}
        >
          {isZh ? '钻石手榜' : 'Diamond'}
        </button>
      </div>

      {loading && <p className="text-xs font-black text-black/55">{isZh ? '加载中...' : 'Loading...'}</p>}
      {!loading && currentBoard.length === 0 && <p className="text-xs font-black text-black/55">{isZh ? '暂无数据' : 'No data yet'}</p>}

      {!loading && top3.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {top3.map((entry, idx) => (
            <div key={`top-${entry.name}-${idx}`} className={`p-3 rounded-2xl border text-center ${idx === 0 ? 'bg-primary/95 text-bg-dark border-primary/45' : 'neo-card text-black'}`}>
              <p className="text-[10px] font-black uppercase">#{entry.rank}</p>
              <p className="text-xs font-black mt-1 truncate">{entry.name}</p>
              <p className="text-[10px] font-bold mt-1 opacity-70">{entry.value}</p>
            </div>
          ))}
        </div>
      )}

      {!loading && rest.length > 0 && (
        <div className="space-y-2.5">
          {rest.map((entry, idx) => {
            const mine = Boolean(currentUserName && entry.name === currentUserName);
            return (
              <div
                key={`${tab}-${entry.name}-${idx}`}
                className={`p-3.5 rounded-xl brutal-border-thin flex justify-between items-center text-sm ${mine ? 'bg-primary/15 border-primary/45' : 'bg-white'}`}
              >
                <span className="font-black">
                  #{entry.rank} {entry.name}
                </span>
                <span className="font-black text-black/70">{entry.value}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Leaderboard;
