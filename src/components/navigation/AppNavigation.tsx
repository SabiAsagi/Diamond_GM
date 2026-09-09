import { Home, Trophy, Users, MapPin, Settings } from 'lucide-react';

export type MainNavTab = 'home' | 'records' | 'people' | 'outing' | 'settings';

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
    { id: 'home', label: '홈', icon: <Home size={18} /> },
    { id: 'records', label: '기록', icon: <Trophy size={18} /> },
    { id: 'people', label: '인물', icon: <Users size={18} /> },
    { id: 'outing', label: '외출', icon: <MapPin size={18} /> },
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
