import React from 'react';
import { NavLink } from 'react-router-dom';
import { AppLocale } from '../lib/format';

interface PointsTabsProps {
  locale: AppLocale;
}

const PointsTabs: React.FC<PointsTabsProps> = ({ locale }) => {
  const isZh = locale === 'zh';
  const tabs = [
    { to: '/rewards', label: isZh ? '积分中心' : 'Points' },
    { to: '/missions', label: isZh ? '任务' : 'Missions' },
    { to: '/unlocks', label: isZh ? '解锁额度' : 'Unlocks' },
    { to: '/invite', label: isZh ? '邀请' : 'Invite' },
  ];

  return (
    <div className="neo-card p-2.5">
      <div className="grid grid-cols-4 gap-2">
        {tabs.map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            className={({ isActive }) =>
              `rounded-lg px-2 py-2 text-center text-[10px] font-black transition-all ${
                isActive
                  ? 'imperial-deep text-accent border border-accent/40'
                  : 'imperial-data text-white/70 hover:opacity-90'
              }`
            }
          >
            {tab.label}
          </NavLink>
        ))}
      </div>
    </div>
  );
};

export default PointsTabs;
