import React from 'react';
import { InviteSourceResponse } from '../lib/api';
import { AppLocale } from '../lib/format';

interface InviteSourceCardProps {
  locale: AppLocale;
  source: InviteSourceResponse | null;
  loading?: boolean;
}

function formatBoundDate(value: string | null, locale: AppLocale): string {
  if (!value) return locale === 'zh' ? '未记录' : 'Not recorded';
  const ts = Date.parse(value);
  if (Number.isNaN(ts)) return locale === 'zh' ? '未记录' : 'Not recorded';
  return new Intl.DateTimeFormat(locale === 'zh' ? 'zh-CN' : 'en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(ts));
}

const InviteSourceCard: React.FC<InviteSourceCardProps> = ({ locale, source, loading }) => {
  const isZh = locale === 'zh';
  const inviter = source?.inviter || null;

  return (
    <div className="neo-card p-4">
      <div className="flex items-center justify-between gap-2">
        <p className="section-kicker">{isZh ? '邀请来源' : 'Invite Source'}</p>
        <span className="imperial-chip imperial-chip-muted">{inviter ? (isZh ? '已绑定' : 'Bound') : (isZh ? '自然流量' : 'Organic')}</span>
      </div>

      {loading ? (
        <p className="text-xs font-bold text-white/60 mt-3">{isZh ? '来源信息加载中...' : 'Loading source info...'}</p>
      ) : inviter ? (
        <div className="mt-3 imperial-data rounded-xl p-3">
          <div className="flex items-center justify-between gap-2">
            <p className="text-[11px] font-black">{inviter.displayAddress || inviter.address}</p>
            <p className="text-[10px] font-bold text-white/60 number-display">{inviter.teamSize}</p>
          </div>
          <div className="grid grid-cols-2 gap-2 mt-2">
            <div className="data-block">
              <p className="text-[10px] font-bold text-white/55">{isZh ? '邀请码' : 'Code'}</p>
              <p className="text-[11px] font-black mt-0.5">{inviter.inviteCode || '--'}</p>
            </div>
            <div className="data-block">
              <p className="text-[10px] font-bold text-white/55">{isZh ? '绑定时间' : 'Bound At'}</p>
              <p className="text-[11px] font-black mt-0.5">{formatBoundDate(source?.boundAt || null, locale)}</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="mt-3 imperial-data rounded-xl p-3">
          <p className="text-[11px] font-bold text-white/62">{isZh ? '你当前没有上级邀请人（自然进入）' : 'No inviter found (organic join)'}</p>
        </div>
      )}
    </div>
  );
};

export default InviteSourceCard;
