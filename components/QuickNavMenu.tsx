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
    { to: '/deposit', label: isZh ? '存款' : 'Deposit' },
    { to: '/sale', label: isZh ? '补给' : 'Supply' },
    { to: '/rewards', label: isZh ? '积分' : 'Points' },
    { to: '/profile', label: isZh ? '我的' : 'Profile' },
  ];
  const moreItems = [
    { to: '/missions', label: isZh ? '积分任务' : 'Point Missions' },
    { to: '/unlocks', label: isZh ? '积分解锁' : 'Point Unlocks' },
    { to: '/invite', label: isZh ? '积分邀请' : 'Point Invite' },
    { to: '/stake', label: isZh ? '固定质押' : 'Fixed Stake' },
    { to: '/leaderboard', label: isZh ? '榜单' : 'Leaderboard' },
    { to: '/achievements', label: isZh ? '成就' : 'Achievements' },
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
        className="tap-target tai-btn tai-btn-soft !min-h-9 !px-3 !py-2 !text-[11px]"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
        aria-haspopup="menu"
      >
        {isZh ? '菜单' : 'Menu'}
      </button>
      {open && (
        <div className="absolute right-0 top-[calc(100%+0.55rem)] w-60 neo-card p-2.5 z-50">
          <div className="grid grid-cols-5 gap-1.5">
            {items.map((item) => {
              const active = location.pathname === item.to;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`text-center text-[10px] font-black rounded-lg px-1.5 py-2 brutal-border-thin transition ${
                    active
                      ? 'bg-primary text-white border-transparent shadow-[0_8px_14px_rgba(200,16,46,0.35)]'
                      : 'imperial-data text-white hover:opacity-90'
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>
          <p className="text-[9px] font-black text-white/55 mt-2.5 mb-1 px-1">{isZh ? '更多入口' : 'More'}</p>
          <div className="grid grid-cols-2 gap-1.5">
            {moreItems.map((item) => {
              const active = location.pathname === item.to;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`text-center text-[10px] font-black rounded-lg px-2 py-2 brutal-border-thin transition ${
                    active
                      ? 'bg-primary text-white border-transparent shadow-[0_8px_14px_rgba(200,16,46,0.35)]'
                      : 'imperial-data text-white hover:opacity-90'
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
