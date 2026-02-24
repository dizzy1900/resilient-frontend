import { cn } from '@/lib/utils';

export type SidebarTab = 'overview' | 'risk-finance' | 'adaptation';

interface Tab {
  id: SidebarTab;
  label: string;
}

const TABS: Tab[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'risk-finance', label: 'Risk & Finance' },
  { id: 'adaptation', label: 'Adaptation' },
];

interface SidebarTabsProps {
  activeTab: SidebarTab;
  onTabChange: (tab: SidebarTab) => void;
}

export const SidebarTabs = ({ activeTab, onTabChange }: SidebarTabsProps) => {
  return (
    <div className="px-4 pt-3 pb-0">
      <div className="flex gap-0 border-b border-sidebar-border">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={cn(
              'relative flex-1 px-2 py-2.5 text-xs font-medium transition-colors duration-150 focus:outline-none whitespace-nowrap',
              activeTab === tab.id
                ? 'text-foreground'
                : 'text-muted-foreground hover:text-foreground/80'
            )}
          >
            {tab.label}
            {activeTab === tab.id && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-t-full" />
            )}
          </button>
        ))}
      </div>
    </div>
  );
};
