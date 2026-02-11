import React, { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

interface QuickNavMenuProps {
  locale: 'zh' | 'en';
}

const QuickNavMenu: React.FC<QuickNavMenuProps> = ({ locale }) => {
  const location = useLocation();
  const menuRef = useRef<HTMLDivElement | null>(null);
  const [open, setOpen] = useState(false);
  const isZh = locale === 'zh';

  const items = [
    { to: '/home', label: isZh ? '首页' : 'Home' },
    { to: '/sale', label: isZh ? '补给' : 'Shop' },
    { to: '/deposit', label: isZh ? '存款' : 'Deposit' },
    { to: '/invite', label: isZh ? '邀请' : 'Invite' },
    { to: '/rewards', label: isZh ? '奖励' : 'Rewards' },
    { to: '/missions', label: isZh ? '任务' : 'Missions' },
    { to: '/leaderboard', label: isZh ? '榜单' : 'Leaderboard' },
    { to: '/profile', label: isZh ? '我的' : 'Profile' },
  ];

  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!open) return;
    const handlePointerDown = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node | null;
      if (!menuRef.current || !target) return;
      if (!menuRef.current.contains(target)) {
        setOpen(false);
      }
    };
    window.addEventListener('mousedown', handlePointerDown);
    window.addEventListener('touchstart', handlePointerDown);
    return () => {
      window.removeEventListener('mousedown', handlePointerDown);
      window.removeEventListener('touchstart', handlePointerDown);
    };
  }, [open]);

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        className="tap-target bg-white/12 text-white brutal-border-thin px-3 py-2 text-[11px] font-black rounded-xl hover-lift"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
        aria-haspopup="menu"
      >
        {isZh ? '菜单' : 'Menu'}
      </button>
      {open && (
        <div className="absolute right-0 top-[calc(100%+0.55rem)] w-52 neo-card p-2.5 z-50 shadow-brutal-xl">
          <div className="grid grid-cols-2 gap-1.5">
            {items.map((item) => {
              const active = location.pathname === item.to;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`text-center text-[11px] font-black rounded-lg px-2 py-2.5 brutal-border-thin transition ${
                    active ? 'bg-bg-dark text-primary border-primary/40' : 'bg-white text-black hover:bg-primary/10'
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default QuickNavMenu;
