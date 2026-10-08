import { Diamond, NotebookPen, Flag, ContactRound, Settings } from 'lucide-react';

export type MainNavTab = 'records' | 'goals' | 'home' | 'info' | 'settings';

interface AppNavigationProps {
  activeTab: MainNavTab;
  onTabChange: (tab: MainNavTab) => void;
  unreadTabs?: Partial<Record<MainNavTab, boolean>>;
}

interface NavItem {
  id: MainNavTab;
  label: string;
  icon: React.ReactNode;
}

export function AppNavigation({ activeTab, onTabChange, unreadTabs = {} }: AppNavigationProps) {
  const navItems: NavItem[] = [
    { id: 'records', label: '기록실', icon: <NotebookPen size={20} /> },
    { id: 'goals', label: '월간 목표', icon: <Flag size={20} /> },
    { id: 'home', label: '클럽하우스', icon: <Diamond size={22} /> },
    { id: 'info', label: '선수 수첩', icon: <ContactRound size={20} /> },
    { id: 'settings', label: '설정', icon: <Settings size={18} /> },
  ];

  return (
    <nav className="app-main-nav" aria-label="주 메뉴">
      <div className="nav-club-identity" aria-hidden="true"><Diamond size={32} /><strong>DIAMOND<span>GM</span></strong><small>THE PLAYER'S JOURNEY</small></div>
      {navItems.map(item => {
        const isActive = activeTab === item.id;
        return (
          <button
            key={item.id}
            className={`nav-tab-button ${isActive ? 'active' : ''}`}
            onClick={() => onTabChange(item.id)}
            aria-label={`${item.label}${unreadTabs[item.id] ? ' · 새 소식 있음' : ''}`}
            aria-current={isActive ? 'page' : undefined}
          >
            <span className="nav-tab-icon" aria-hidden="true">{item.icon}{unreadTabs[item.id] && <span className="nav-notification-dot" />}</span>
            <span className="nav-tab-label">{item.label}</span>
          </button>
        );
      })}
      <div className="nav-season-note" aria-hidden="true">오늘의 선택이<br />내일의 선수를 만듭니다.</div>
    </nav>
  );
}

