import React from 'react';
import { Route, Truck, TrendingUp, Settings } from 'lucide-react';

export type NgoTab = 'plan' | 'pickups' | 'impact' | 'settings';

interface NgoTabBarProps {
  activeTab: NgoTab;
  onTabChange: (tab: NgoTab) => void;
  confirmedCount: number;
  activeTripsCount: number;
}

export const NgoTabBar: React.FC<NgoTabBarProps> = ({
  activeTab,
  onTabChange,
  confirmedCount,
  activeTripsCount,
}) => {
  const tabs = [
    {
      id: 'plan' as const,
      label: 'Plan & Route',
      icon: <Route className="h-4 w-4" />,
      badge: confirmedCount > 0 ? `${confirmedCount} waiting` : undefined,
    },
    {
      id: 'pickups' as const,
      label: 'Live Pickups',
      icon: <Truck className="h-4 w-4" />,
      badge: activeTripsCount > 0 ? `${activeTripsCount} active` : undefined,
    },
    {
      id: 'impact' as const,
      label: 'Audited Impact',
      icon: <TrendingUp className="h-4 w-4" />,
    },
    {
      id: 'settings' as const,
      label: 'Rule Engine',
      icon: <Settings className="h-4 w-4" />,
    },
  ];

  return (
    <div className="flex items-center gap-1 border-b border-slate-200 overflow-x-auto pb-px">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onTabChange(tab.id)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold transition-all duration-150 border-b-2 whitespace-nowrap min-h-[44px] cursor-pointer ${
              isActive
                ? 'border-emerald-600 text-emerald-700 bg-emerald-50/60'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
            }`}
          >
            {tab.icon}
            <span>{tab.label}</span>
            {tab.badge && (
              <span
                className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                  isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                }`}
              >
                {tab.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};
