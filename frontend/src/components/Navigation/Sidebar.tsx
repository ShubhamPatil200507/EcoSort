import React from 'react';
import {
  LayoutDashboard,
  ScanLine,
  History,
  Compass,
  Settings,
  ExternalLink,
  Leaf,
  Globe,
  Sparkles,
  ShieldCheck
} from 'lucide-react';
import { AppView } from '../../types';

interface SidebarProps {
  currentView: AppView;
  onNavigate: (view: AppView) => void;
  historyCount?: number;
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  onNavigate,
  historyCount = 0,
  isOpenMobile = false,
  onCloseMobile,
}) => {
  const mainNavItems = [
    {
      key: 'overview' as AppView,
      label: 'Overview',
      icon: <LayoutDashboard className="w-4 h-4" />,
      description: 'System metrics & quick start',
    },
    {
      key: 'analysis' as AppView,
      label: 'New Analysis',
      icon: <ScanLine className="w-4 h-4" />,
      badge: 'Core',
      badgeClass: 'bg-[#EAF4EC] text-[#174D3A]',
      description: 'Capture, detect & optimize',
    },
    {
      key: 'history' as AppView,
      label: 'Analysis History',
      icon: <History className="w-4 h-4" />,
      count: historyCount > 0 ? historyCount : undefined,
      description: 'Past sessions & audit trails',
    },
    {
      key: 'centres' as AppView,
      label: 'Collection Centres',
      icon: <Compass className="w-4 h-4" />,
      description: 'Verified facility directory',
    },
    {
      key: 'settings' as AppView,
      label: 'Settings & Privacy',
      icon: <Settings className="w-4 h-4" />,
      description: 'Retention, location, models',
    },
  ];

  const handleItemClick = (view: AppView) => {
    onNavigate(view);
    if (onCloseMobile) onCloseMobile();
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div
          className="fixed inset-0 bg-stone-900/50 backdrop-blur-xs z-40 lg:hidden"
          onClick={onCloseMobile}
          aria-hidden="true"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-72 bg-white border-r border-[#E1E7E0] flex flex-col justify-between transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full'
        }`}
        aria-label="Workspace Sidebar"
      >
        {/* Top: Identity */}
        <div>
          <div className="h-16 px-5 border-b border-[#E1E7E0] flex items-center justify-between">
            <button
              type="button"
              onClick={() => handleItemClick('overview')}
              className="flex items-center gap-2.5 text-left cursor-pointer group"
            >
              <div className="w-9 h-9 rounded-xl bg-[#174D3A] text-white flex items-center justify-center shadow-xs group-hover:bg-[#10382B] transition-colors">
                <Leaf className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-extrabold text-base tracking-tight text-[#17231D]">EcoSort</span>
                  <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded-full bg-[#EAF4EC] text-[#174D3A] border border-[#287A54]/20">
                    Research
                  </span>
                </div>
                <p className="text-[11px] text-[#66736B] leading-none">Decision-Aware Sorting</p>
              </div>
            </button>
          </div>

          {/* Nav List */}
          <nav className="p-3 space-y-1">
            <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-[#66736B]">
              Workspace Navigation
            </div>

            {mainNavItems.map((item) => {
              const isActive = currentView === item.key;
              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => handleItemClick(item.key)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer select-none ${
                    isActive
                      ? 'bg-[#174D3A] text-white shadow-xs'
                      : 'text-[#17231D] hover:bg-[#F7F7F2] hover:text-[#174D3A]'
                  }`}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <span className={isActive ? 'text-white' : 'text-[#66736B]'}>{item.icon}</span>
                    <span className="truncate">{item.label}</span>
                  </div>

                  {item.badge && (
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                        isActive ? 'bg-white/20 text-white' : item.badgeClass
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}

                  {item.count !== undefined && (
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full tabular-nums ${
                        isActive ? 'bg-white/20 text-white' : 'bg-stone-100 text-stone-700'
                      }`}
                    >
                      {item.count}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom: Public Portal Switcher, Governance, GitHub */}
        <div className="p-3 border-t border-[#E1E7E0] space-y-2 bg-[#F7F7F2]/50">
          <button
            type="button"
            onClick={() => handleItemClick('landing')}
            className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold bg-white border border-[#E1E7E0] text-[#17231D] hover:bg-[#EAF4EC] hover:text-[#174D3A] transition-colors cursor-pointer shadow-2xs"
          >
            <div className="flex items-center gap-2">
              <Globe className="w-3.5 h-3.5 text-[#287A54]" />
              <span>Public Website</span>
            </div>
            <ExternalLink className="w-3 h-3 text-stone-400" />
          </button>

          <div className="px-3 py-2 rounded-xl bg-white border border-[#E1E7E0] space-y-1">
            <div className="flex items-center justify-between text-[11px] font-bold text-[#17231D]">
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-[#287A54]" />
                <span>Model Engine</span>
              </div>
              <span className="text-[10px] font-mono text-[#66736B]">v1.0.0</span>
            </div>
            <p className="text-[10px] text-[#66736B] leading-tight">
              MobileNetV3 + HiGHS Exact MILP Solver
            </p>
          </div>

          <a
            href="https://github.com/ShubhamPatil200507/EcoSort"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-1.5 text-[11px] font-medium text-[#66736B] hover:text-[#17231D] py-1 transition-colors"
          >
            <span>GitHub Repository</span>
            <ExternalLink className="w-3 h-3 text-stone-400" />
          </a>
        </div>
      </aside>
    </>
  );
};
