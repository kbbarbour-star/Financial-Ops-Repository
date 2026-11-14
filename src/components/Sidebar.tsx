import {
  Activity,
  AlertTriangle,
  BookOpen,
  Building2,
  Clock,
  Layers,
  Users,
  X,
} from 'lucide-react';
import type { ReactNode } from 'react';
import { TAB_METADATA } from '../data/relations';
import type { TabId } from '../types/itsm';

interface SidebarProps {
  activeTab: TabId;
  onSelectTab: (tab: TabId) => void;
  totalRecords: number;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

const TAB_ICONS: Record<TabId, ReactNode> = {
  Incidents: <AlertTriangle className="h-4 w-4 shrink-0" />,
  IncidentActivity: <Activity className="h-4 w-4 shrink-0" />,
  Services: <Building2 className="h-4 w-4 shrink-0" />,
  AssignmentGroups: <Layers className="h-4 w-4 shrink-0" />,
  Users: <Users className="h-4 w-4 shrink-0" />,
  SLA_Definitions: <Clock className="h-4 w-4 shrink-0" />,
  KnowledgeBase: <BookOpen className="h-4 w-4 shrink-0" />,
};

const GROUPS: Array<{
  heading: 'Operations' | 'Organization & Catalog' | 'Governance & Playbooks';
  tabs: TabId[];
}> = [
  { heading: 'Operations', tabs: ['Incidents', 'IncidentActivity'] },
  { heading: 'Organization & Catalog', tabs: ['Services', 'AssignmentGroups', 'Users'] },
  { heading: 'Governance & Playbooks', tabs: ['SLA_Definitions', 'KnowledgeBase'] },
];

export function Sidebar({
  activeTab,
  onSelectTab,
  totalRecords,
  mobileOpen,
  onCloseMobile,
}: SidebarProps) {
  const navContent = (
    <div className="flex h-full flex-col bg-white border-r border-slate-200">
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
        <div>
          <div className="font-display text-base font-bold tracking-tight text-slate-900 whitespace-nowrap">
            Meridian ITSM
          </div>
          <div className="text-xs text-slate-500 whitespace-nowrap">
            Financial Ops Repository
          </div>
        </div>
        <button
          type="button"
          onClick={onCloseMobile}
          aria-label="Close navigation menu"
          className="lg:hidden rounded-md p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <nav aria-label="Dataset Tabs" className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        {GROUPS.map((group) => (
          <div key={group.heading}>
            <div className="px-2.5 pb-1.5 text-xs font-medium text-slate-500">
              {group.heading}
            </div>
            <ul className="space-y-0.5">
              {group.tabs.map((tabId) => {
                const meta = TAB_METADATA[tabId];
                const isActive = activeTab === tabId;
                return (
                  <li key={tabId}>
                    <button
                      type="button"
                      onClick={() => {
                        onSelectTab(tabId);
                        onCloseMobile();
                      }}
                      className={`w-full flex items-center justify-between gap-2 px-2.5 py-2 text-sm rounded-md transition-colors whitespace-nowrap focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700 ${
                        isActive
                          ? 'bg-blue-50 text-blue-800 font-semibold'
                          : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900 font-medium'
                      }`}
                    >
                      <span className="flex items-center gap-2.5 min-w-0">
                        <span className={isActive ? 'text-blue-700' : 'text-slate-400'}>
                          {TAB_ICONS[tabId]}
                        </span>
                        <span className="truncate">{meta.label}</span>
                      </span>
                      <span
                        className={`font-mono text-xs tabular-nums shrink-0 ${
                          isActive ? 'text-blue-700' : 'text-slate-400'
                        }`}
                      >
                        {meta.count}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="px-5 py-3.5 border-t border-slate-200 bg-slate-50/70">
        <div className="flex items-center justify-between text-xs text-slate-600">
          <span>Total Records</span>
          <span className="font-mono font-semibold text-slate-900 tabular-nums">
            {totalRecords}
          </span>
        </div>
        <div className="mt-1 text-xs text-slate-500">
          7 tabs · Elapsed 24x7 SLA
        </div>
      </div>
    </div>
  );

  return (
    <>
      <aside className="hidden lg:block w-[248px] shrink-0 h-screen sticky top-0">
        {navContent}
      </aside>
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-slate-900/30"
            onClick={onCloseMobile}
            aria-hidden="true"
          />
          <div className="relative w-[264px] max-w-[85vw] h-full z-10">
            {navContent}
          </div>
        </div>
      )}
    </>
  );
}
