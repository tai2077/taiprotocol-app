import React from 'react';
import { NavLink } from 'react-router-dom';

const IconBase: React.FC<{ children: React.ReactNode; size?: string }> = ({ children, size = 'w-5 h-5' }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.6"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={size}
    aria-hidden="true"
  >
    {children}
  </svg>
);

const HomeIcon = () => (
  <IconBase>
    <path d="M3 10.5L12 3l9 7.5" />
    <path d="M5.5 9.8V20a1 1 0 0 0 1 1h4.6v-6.2h2v6.2h4.4a1 1 0 0 0 1-1V9.8" />
  </IconBase>
);

const AssetIcon = () => (
  <IconBase>
    <rect x="3.8" y="7.2" width="16.4" height="13" rx="2.2" />
    <path d="M3.8 11.2h16.4" />
    <path d="M15 15.6h2.9" />
    <circle cx="10.1" cy="15.7" r="1.2" />
  </IconBase>
);

const SupplyIcon = () => (
  <IconBase size="w-6 h-6">
    <path d="M6 8.2h12l1.2 11H4.8L6 8.2z" />
    <path d="M8.3 8.2V6.9a3.7 3.7 0 0 1 7.4 0v1.3" />
    <path d="M12 10.5l-1.5 2.8h1.8l-1.2 2.2" />
  </IconBase>
);

const PointsIcon = () => (
  <IconBase>
    <path d="M12 3.2l2.3 4.6 5.1.7-3.7 3.5.9 5.2-4.6-2.4-4.6 2.4.9-5.2-3.7-3.5 5.1-.7L12 3.2z" />
  </IconBase>
);

const ProfileIcon = () => (
  <IconBase>
    <circle cx="12" cy="8.2" r="3.1" />
    <path d="M5 20c1.3-3.1 3.8-4.8 7-4.8s5.7 1.7 7 4.8" />
  </IconBase>
);

interface NavBarProps {
  locale: 'zh' | 'en';
}

const NavBar: React.FC<NavBarProps> = ({ locale }) => {
  const items = [
    { to: '/home', label: locale === 'zh' ? '首页' : 'Home', icon: <HomeIcon />, center: false },
    { to: '/deposit', label: locale === 'zh' ? '资产' : 'Asset', icon: <AssetIcon />, center: false },
    { to: '/sale', label: locale === 'zh' ? '补给' : 'Supply', icon: <SupplyIcon />, center: true },
    { to: '/rewards', label: locale === 'zh' ? '积分' : 'Points', icon: <PointsIcon />, center: false },
    { to: '/profile', label: locale === 'zh' ? '我的' : 'Profile', icon: <ProfileIcon />, center: false },
  ];

  return (
    <div className="fixed safe-nav-bottom left-1/2 -translate-x-1/2 w-[96%] max-w-[520px] z-50 px-1">
      <div
        className="neo-card-dark rounded-[1.18rem] px-3 pb-2 pt-1.5"
        style={{
          background:
            'linear-gradient(180deg, rgba(10,10,10,0.92) 0%, rgba(10,10,10,0.98) 100%)',
          borderColor: 'rgba(207,172,86,0.18)',
        }}
      >
        <div className="flex items-end justify-between gap-1">
          {items.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => {
                if (item.center) {
                  return `relative flex-1 flex flex-col items-center justify-end min-h-[68px] ${
                    isActive ? 'text-white' : 'text-white/90'
                  }`;
                }
                return `relative flex-1 flex flex-col items-center justify-center gap-1.5 px-1 pt-2 pb-1.5 min-h-[60px] rounded-xl transition-all ${
                  isActive ? 'text-[#cfac56]' : 'text-[#cfac56]/70'
                }`;
              }}
            >
              {({ isActive }) => (
                <>
                  {item.center ? (
                    <>
                      <span
                        className="flex items-center justify-center rounded-full"
                        style={{
                          width: '56px',
                          height: '56px',
                          marginTop: '-17px',
                          color: '#fff7ea',
                          background:
                            'linear-gradient(180deg, #ff4d6a 0%, #c8102e 100%)',
                          border: '2px solid rgba(207,172,86,0.45)',
                          boxShadow:
                            '0 0 0 4px rgba(10,10,10,0.92), 0 8px 22px rgba(200,16,46,0.42), 0 0 16px rgba(200,16,46,0.2)',
                        }}
                      >
                        {item.icon}
                      </span>
                      <span className="text-[10px] font-black leading-none text-[#cfac56] mt-1">{item.label}</span>
                    </>
                  ) : (
                    <>
                      <span className={`leading-none ${isActive ? 'drop-shadow-[0_0_6px_rgba(207,172,86,0.42)]' : ''}`}>{item.icon}</span>
                      <span className={`text-[10px] font-black leading-none ${isActive ? 'text-[#cfac56]' : 'text-[#cfac56]/74'}`}>
                        {item.label}
                      </span>
                      <span
                        className={`h-[2px] rounded-full transition-all ${
                          isActive
                            ? 'w-6 bg-gradient-to-r from-[#f6df9a] to-[#cfac56] opacity-100 shadow-[0_0_7px_rgba(207,172,86,0.5)]'
                            : 'w-0 opacity-0'
                        }`}
                      />
                    </>
                  )}
                </>
              )}
            </NavLink>
          ))}
        </div>
      </div>
    </div>
  );
};

export default NavBar;
