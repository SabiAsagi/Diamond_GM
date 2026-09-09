import { Home, Trophy, Users, Activity, Award, Settings, Map } from 'lucide-react';

export type MainNavTab = 'home' | 'matches' | 'relationships' | 'town' | 'stats' | 'trophies' | 'settings';

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
    { id: 'matches', label: '경기·대회', icon: <Trophy size={18} /> },
    { id: 'relationships', label: '인연', icon: <Users size={18} /> },
    { id: 'town', label: '연고지', icon: <Map size={18} /> },
    { id: 'stats', label: '내 선수', icon: <Activity size={18} /> },
    { id: 'trophies', label: '업적', icon: <Award size={18} /> },
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
