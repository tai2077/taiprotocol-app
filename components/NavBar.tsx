import React from 'react';
import { NavLink } from 'react-router-dom';

const IconBase: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
    {children}
  </svg>
);

const HomeIcon = () => (
  <IconBase>
    <path d="M3 10.5L12 3l9 7.5" />
    <path d="M5.5 9.8V20a1 1 0 0 0 1 1h4.6v-6.2h2v6.2h4.4a1 1 0 0 0 1-1V9.8" />
  </IconBase>
);

const LockIcon = () => (
  <IconBase>
    <rect x="4.5" y="10.5" width="15" height="10" rx="2.2" />
    <path d="M8.3 10.5V8.2a3.7 3.7 0 1 1 7.4 0v2.3" />
  </IconBase>
);

const InviteIcon = () => (
  <IconBase>
    <circle cx="9" cy="9" r="2.4" />
    <circle cx="16.5" cy="8.2" r="2.1" />
    <path d="M4.8 19c.9-2.4 3-3.7 5.3-3.7s4.4 1.3 5.3 3.7" />
    <path d="M14 19c.7-1.6 2-2.5 3.5-2.5 1 0 1.9.3 2.7 1" />
  </IconBase>
);

const RewardIcon = () => (
  <IconBase>
    <path d="M12 21V13" />
    <path d="M6 13h12" />
    <path d="M7.2 8.2c0 1.5 1.2 2.8 2.8 2.8H12V8.4c0-2-1.3-3.4-3.3-3.4-1 0-1.7.3-2.3 1-.5.6-.8 1.3-.8 2.2z" />
    <path d="M16.8 8.2c0 1.5-1.2 2.8-2.8 2.8H12V8.4c0-2 1.3-3.4 3.3-3.4 1 0 1.7.3 2.3 1 .5.6.8 1.3.8 2.2z" />
  </IconBase>
);

const ProfileIcon = () => (
  <IconBase>
    <circle cx="12" cy="8.2" r="3.1" />
    <path d="M5 20c1.3-3.1 3.8-4.8 7-4.8s5.7 1.7 7 4.8" />
  </IconBase>
);

const NavBar: React.FC<{ locale: 'zh' | 'en' }> = ({ locale }) => {
  const items = [
    { to: '/home', label: locale === 'zh' ? '首页' : 'Home', icon: <HomeIcon /> },
    { to: '/deposit', label: locale === 'zh' ? '存款' : 'Deposit', icon: <LockIcon /> },
    { to: '/invite', label: locale === 'zh' ? '邀请' : 'Invite', icon: <InviteIcon /> },
    { to: '/rewards', label: locale === 'zh' ? '奖励' : 'Rewards', icon: <RewardIcon /> },
    { to: '/profile', label: locale === 'zh' ? '我的' : 'Profile', icon: <ProfileIcon /> },
  ];

  return (
    <div className="fixed safe-nav-bottom left-1/2 -translate-x-1/2 w-[94%] max-w-[520px] z-50">
      <div className="bg-bg-dark/84 backdrop-blur-2xl border border-white/15 rounded-[1.6rem] p-2.5 flex justify-around items-center shadow-brutal-xl pulse-border">
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `relative flex flex-col items-center justify-center gap-1 transition-all px-3 py-2.5 min-w-12 min-h-11 rounded-xl ${
                isActive ? 'text-bg-dark bg-primary brutal-border-thin border-primary/55 shadow-brutal-active' : 'text-white/68 hover:text-white'
              }`
            }
          >
            <span className="leading-none">{item.icon}</span>
            <span className="text-[10px] font-black leading-none">{item.label}</span>
          </NavLink>
        ))}
      </div>
    </div>
  );
};

export default NavBar;
