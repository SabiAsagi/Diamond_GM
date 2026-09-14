import { Home, ClipboardList, Target, LineChart, Settings } from 'lucide-react';

export type MainNavTab = 'records' | 'goals' | 'home' | 'info' | 'settings';

interface AppNavigationProps {
  activeTab: MainNavTab;
  onTabChange: (tab: MainNavTab) => void;
}

interface NavItem {
  id: MainNavTab;
  label: string;
  icon: React.ReactNode;
}

export function AppNavigation({ activeTab, onTabChange }: AppNavigationProps) {
  const navItems: NavItem[] = [
    { id: 'records', label: '기록', icon: <ClipboardList size={18} /> },
    { id: 'goals', label: '목표', icon: <Target size={18} /> },
    { id: 'home', label: '홈', icon: <Home size={18} /> },
    { id: 'info', label: '정보', icon: <LineChart size={18} /> },
    { id: 'settings', label: '설정', icon: <Settings size={18} /> },
  ];

  return (
    <nav className="app-main-nav">
      {navItems.map(item => {
        const isActive = activeTab === item.id;
        return (
          <button
            key={item.id}
            className={`nav-tab-button ${isActive ? 'active' : ''}`}
            onClick={() => onTabChange(item.id)}
            aria-label={item.label}
          >
            <span className="nav-tab-icon">{item.icon}</span>
            <span className="nav-tab-label">{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}

