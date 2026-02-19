import React from 'react';
import { InviteTeamResponse } from '../lib/api';
import { AppLocale } from '../lib/format';
import TeamMemberCard from './TeamMemberCard';

interface TeamListProps {
  locale: AppLocale;
  team: InviteTeamResponse | null;
  loading?: boolean;
}

const TeamList: React.FC<TeamListProps> = ({ locale, team, loading }) => {
  const isZh = locale === 'zh';
  const direct = team?.directInvitees || [];
  const indirect = team?.indirectInvitees || [];

  return (
    <div className="neo-card p-4">
      <div className="flex items-center justify-between gap-2">
        <p className="section-kicker">{isZh ? '我的队员' : 'My Team'}</p>
        <span className="imperial-chip imperial-chip-muted">{isZh ? '实时同步' : 'Live Sync'}</span>
      </div>

      {loading ? (
        <p className="text-xs font-bold text-white/60 mt-3">{isZh ? '队员数据加载中...' : 'Loading team data...'}</p>
      ) : (
        <>
          <div className="mt-3">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] font-black tracking-[0.08em] text-white/65 uppercase">{isZh ? '一级队员' : 'Direct'}</p>
              <p className="text-[10px] font-bold text-white/55 number-display">{direct.length}</p>
            </div>
            <div className="space-y-2">
              {direct.length > 0 ? (
                direct.slice(0, 24).map((member) => (
                  <TeamMemberCard key={`direct-${member.address}-${member.createdAt || ''}`} member={member} locale={locale} />
                ))
              ) : (
                <div className="imperial-data rounded-xl px-3 py-3">
                  <p className="text-[11px] font-bold text-white/58">{isZh ? '还没有一级队员' : 'No direct members yet'}</p>
                </div>
              )}
            </div>
          </div>

          <div className="mt-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] font-black tracking-[0.08em] text-white/65 uppercase">{isZh ? '二级队员' : 'Indirect'}</p>
              <p className="text-[10px] font-bold text-white/55 number-display">{indirect.length}</p>
            </div>
            <div className="space-y-2">
              {indirect.length > 0 ? (
                indirect.slice(0, 24).map((member) => (
                  <TeamMemberCard key={`indirect-${member.address}-${member.createdAt || ''}`} member={member} locale={locale} />
                ))
              ) : (
                <div className="imperial-data rounded-xl px-3 py-3">
                  <p className="text-[11px] font-bold text-white/58">{isZh ? '暂无二级队员' : 'No indirect members yet'}</p>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default TeamList;
