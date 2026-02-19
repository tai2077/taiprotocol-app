import React from 'react';
import { InviteTeamMember } from '../lib/api';
import { AppLocale } from '../lib/format';

interface TeamMemberCardProps {
  member: InviteTeamMember;
  locale: AppLocale;
}

function formatDateShort(value: string | null, locale: AppLocale): string {
  if (!value) return locale === 'zh' ? '未知时间' : 'Unknown time';
  const ts = Date.parse(value);
  if (Number.isNaN(ts)) return locale === 'zh' ? '未知时间' : 'Unknown time';
  const fmt = new Intl.DateTimeFormat(locale === 'zh' ? 'zh-CN' : 'en-US', {
    month: 'short',
    day: 'numeric',
  });
  return fmt.format(new Date(ts));
}

const TeamMemberCard: React.FC<TeamMemberCardProps> = ({ member, locale }) => {
  const isZh = locale === 'zh';
  return (
    <div className="imperial-data rounded-xl px-3 py-2.5 flex items-center justify-between gap-3">
      <div className="min-w-0">
        <div className="flex items-center gap-2 min-w-0">
          <span className={`imperial-chip ${member.status === 'activated' ? 'imperial-chip-primary' : 'imperial-chip-muted'}`}>
            {member.level === 1 ? 'L1' : 'L2'}
          </span>
          <p className="text-[11px] font-black truncate">{member.displayAddress || member.address}</p>
          {member.tier ? <span className="text-[10px] font-bold text-white/55">T{member.tier}</span> : null}
        </div>
        <p className="text-[10px] font-bold text-white/55 mt-1 truncate">
          {member.level === 2 && member.inviterDisplayAddress
            ? isZh
              ? `来源 ${member.inviterDisplayAddress}`
              : `From ${member.inviterDisplayAddress}`
            : member.subInviteesCount > 0
              ? isZh
                ? `下级 ${member.subInviteesCount}`
                : `${member.subInviteesCount} sub-members`
              : isZh
                ? '一级成员'
                : 'Direct member'}
        </p>
      </div>

      <div className="text-right shrink-0">
        <p className="text-[11px] font-black number-display">{member.rewardTai}</p>
        <p className="text-[10px] font-bold text-white/55">TAI</p>
        <p className="text-[10px] font-bold text-white/45 mt-1">{formatDateShort(member.createdAt, locale)}</p>
      </div>
    </div>
  );
};

export default TeamMemberCard;
