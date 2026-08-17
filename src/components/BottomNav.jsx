import { Home, Plus, Search, User } from 'lucide-react';
import { NavLink } from 'react-router-dom';

const tabs = [
  { to: '/', label: 'Home', icon: Home },
  { to: '/log', label: 'Log', icon: Plus },
  { to: '/exercises', label: 'Exercises', icon: Search },
  { to: '/profile', label: 'Profile', icon: User },
];

export default function BottomNav() {
  return (
    <nav className="flex bg-bg-2 border-t border-line pt-2.5 pb-5 px-0">
      {tabs.map(({ to, label, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) =>
            `flex-1 flex flex-col items-center gap-1 text-[10px] ${
              isActive ? 'text-accent' : 'text-ink-3'
            }`
          }
        >
          <Icon size={22} strokeWidth={2} />
          <span>{label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
