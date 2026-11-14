import {
  Download,
  FileSpreadsheet,
  Menu,
  Pause,
  Play,
  RotateCcw,
  Search,
  X,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { DataGrid, type SortConfig } from './components/DataGrid';
import { DetailDrawer } from './components/DetailDrawer';
import { Sidebar } from './components/Sidebar';
import { SummaryStrip } from './components/SummaryStrip';
import {
  INCIDENTS_RECORDS,
  INCIDENT_ACTIVITY_RECORDS,
  REFERENCE_CLOCK_ISO,
} from './data/incidentsAndActivity';
import { KNOWLEDGE_BASE_RECORDS } from './data/knowledgeBase';
import { TAB_METADATA, slaById } from './data/relations';
import { SERVICES_RECORDS } from './data/services';
import { SLA_DEFINITIONS } from './data/slaDefinitions';
import { ASSIGNMENT_GROUPS, USERS_RECORDS } from './data/usersAndGroups';
import type { DrawerSelection, PriorityLevel, TabId } from './types/itsm';
import { downloadActiveTabCsv, downloadAllTabsZip } from './utils/exportCsv';
import { evaluateIncidentSla, formatIsoShort } from './utils/slaEngine';

const TOTAL_RECORDS =
  INCIDENTS_RECORDS.length +
  USERS_RECORDS.length +
  ASSIGNMENT_GROUPS.length +
  SERVICES_RECORDS.length +
  SLA_DEFINITIONS.length +
  INCIDENT_ACTIVITY_RECORDS.length +
  KNOWLEDGE_BASE_RECORDS.length;

const INITIAL_REF_MS = Date.parse(REFERENCE_CLOCK_ISO);

export default function App() {
  const [activeTab, setActiveTab] = useState<TabId>('Incidents');
  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<'ALL' | PriorityLevel>('ALL');
  const [secondaryFilter, setSecondaryFilter] = useState<string>('ALL');
  const [sortConfig, setSortConfig] = useState<SortConfig | null>(null);
  const [drawerStack, setDrawerStack] = useState<DrawerSelection[]>([]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [referenceNowMs, setReferenceNowMs] = useState<number>(INITIAL_REF_MS);
  const [clockRunning, setClockRunning] = useState<boolean>(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!clockRunning) return;
    const timer = window.setInterval(() => {
      setReferenceNowMs((prev) => prev + 1000);
    }, 1000);
    return () => window.clearInterval(timer);
  }, [clockRunning]);

  useEffect(() => {
    if (!toastMessage) return;
    const timer = window.setTimeout(() => setToastMessage(null), 3200);
    return () => window.clearTimeout(timer);
  }, [toastMessage]);

  const handleSelectTab = (tab: TabId) => {
    setActiveTab(tab);
    setSearchQuery('');
    setPriorityFilter('ALL');
    setSecondaryFilter('ALL');
    setSortConfig(null);
  };

  const handleJumpToTabFilter = (tab: TabId, query: string) => {
    setActiveTab(tab);
    setSearchQuery(query);
    setPriorityFilter('ALL');
    setSecondaryFilter('ALL');
    setSortConfig(null);
  };

  const handleSort = (key: string) => {
    setSortConfig((prev) => {
      if (prev?.key === key) {
        return prev.direction === 'asc'
          ? { key, direction: 'desc' }
          : null;
      }
      return { key, direction: 'asc' };
    });
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setPriorityFilter('ALL');
    setSecondaryFilter('ALL');
  };

  const filteredRows = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const matchesSearch = (obj: object) =>
      !q || JSON.stringify(obj).toLowerCase().includes(q);

    switch (activeTab) {
      case 'Incidents':
        return INCIDENTS_RECORDS.filter((inc) => {
          if (priorityFilter !== 'ALL' && inc.priority !== priorityFilter) return false;
          if (secondaryFilter !== 'ALL') {
            if (secondaryFilter === 'ACTIVE') {
              if (inc.state === 'Resolved' || inc.state === 'Closed') return false;
            } else {
              const sla = slaById.get(inc.slaId);
              if (!sla) return false;
              const status = evaluateIncidentSla(inc, sla, referenceNowMs).overallStatus;
              if (status !== secondaryFilter) return false;
            }
          }
          return matchesSearch(inc);
        });

      case 'Users':
        return USERS_RECORDS.filter((u) => {
          if (secondaryFilter !== 'ALL' && u.supportTier !== secondaryFilter) return false;
          return matchesSearch(u);
        });

      case 'AssignmentGroups':
        return ASSIGNMENT_GROUPS.filter((g) => {
          if (priorityFilter !== 'ALL' && g.autoAssignPriority !== priorityFilter) {
            return false;
          }
          return matchesSearch(g);
        });

      case 'Services':
        return SERVICES_RECORDS.filter((s) => {
          if (
            secondaryFilter !== 'ALL' &&
            !s.criticalityTier.startsWith(secondaryFilter)
          ) {
            return false;
          }
          return matchesSearch(s);
        });

      case 'SLA_Definitions':
        return SLA_DEFINITIONS.filter((sla) => {
          if (priorityFilter !== 'ALL' && sla.priority !== priorityFilter) return false;
          return matchesSearch(sla);
        });

      case 'IncidentActivity':
        return INCIDENT_ACTIVITY_RECORDS.filter((act) => {
          if (secondaryFilter !== 'ALL' && act.activityType !== secondaryFilter) {
            return false;
          }
          return matchesSearch(act);
        });

      case 'KnowledgeBase':
        return KNOWLEDGE_BASE_RECORDS.filter((kb) => {
          if (priorityFilter !== 'ALL' && kb.priority !== priorityFilter) return false;
          if (secondaryFilter !== 'ALL' && kb.incidentCategory !== secondaryFilter) {
            return false;
          }
          return matchesSearch(kb);
        });
    }
  }, [activeTab, searchQuery, priorityFilter, secondaryFilter, referenceNowMs]);

  const tabMeta = TAB_METADATA[activeTab];

  const handleExportCurrentTab = () => {
    const filename = downloadActiveTabCsv(activeTab, referenceNowMs);
    setToastMessage(`Exported ${filename} (${tabMeta.count} records)`);
  };

  const handleExportAll = () => {
    const archive = downloadAllTabsZip(referenceNowMs);
    setToastMessage(`Exported ${archive} (7 CSV tabs · ${TOTAL_RECORDS} records)`);
  };

  return (
    <div className="min-h-screen flex bg-slate-50 text-slate-900">
      <Sidebar
        activeTab={activeTab}
        onSelectTab={handleSelectTab}
        totalRecords={TOTAL_RECORDS}
        mobileOpen={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
      />

      <div className="flex-1 min-w-0 flex flex-col">
        <header className="sticky top-0 z-30 bg-white border-b border-slate-200 px-4 lg:px-6 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Open navigation menu"
              className="lg:hidden p-2 -ml-1 text-slate-600 hover:bg-slate-100 rounded-md"
            >
              <Menu className="h-4 w-4" />
            </button>
            <div className="flex items-center gap-2 text-sm min-w-0">
              <span className="text-slate-500 whitespace-nowrap hidden sm:inline">
                Financial ITSM
              </span>
              <span className="text-slate-300 hidden sm:inline">/</span>
              <span className="font-display font-semibold text-slate-900 truncate">
                {tabMeta.label}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={handleExportCurrentTab}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-md hover:bg-slate-50 transition-colors whitespace-nowrap shrink-0"
            >
              <FileSpreadsheet className="h-3.5 w-3.5 text-slate-500" />
              <span>Export Tab CSV</span>
            </button>
            <button
              type="button"
              onClick={handleExportAll}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-blue-700 rounded-md hover:bg-blue-800 transition-colors whitespace-nowrap shrink-0"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Export All (7 Tabs)</span>
            </button>
          </div>
        </header>

        <main className="flex-1 px-4 lg:px-6 py-5 space-y-4 max-w-[1600px] w-full mx-auto">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-3">
            <div>
              <h1 className="font-display text-xl font-bold tracking-tight text-slate-900">
                {tabMeta.label}
              </h1>
              <p className="mt-0.5 text-[13px] text-slate-600">{tabMeta.description}</p>
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-600 bg-white border border-slate-200 rounded-md px-3 py-1.5 shrink-0 self-start md:self-auto">
              <span className="text-slate-500 whitespace-nowrap">24x7 SLA Clock:</span>
              <span className="font-mono font-medium text-slate-900 tabular-nums whitespace-nowrap">
                {formatIsoShort(new Date(referenceNowMs).toISOString())}
              </span>
              <button
                type="button"
                onClick={() => setClockRunning((prev) => !prev)}
                aria-label={clockRunning ? 'Pause elapsed clock' : 'Resume elapsed clock'}
                title={clockRunning ? 'Pause live SLA clock' : 'Resume live SLA clock'}
                className="p-1 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded"
              >
                {clockRunning ? (
                  <Pause className="h-3.5 w-3.5" />
                ) : (
                  <Play className="h-3.5 w-3.5" />
                )}
              </button>
              <button
                type="button"
                onClick={() => setReferenceNowMs(INITIAL_REF_MS)}
                aria-label="Reset SLA reference clock"
                title="Reset to reference timestamp"
                className="p-1 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded"
              >
                <RotateCcw className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          <SummaryStrip
            activeTab={activeTab}
            filteredCount={filteredRows.length}
            referenceNowMs={referenceNowMs}
          />

          <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={`Search ${tabMeta.label} by ID, summary, service, owner...`}
                aria-label={`Search ${tabMeta.label}`}
                className="w-full pl-9 pr-8 py-1.5 text-[13px] bg-white border border-slate-200 rounded-md text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  aria-label="Clear search query"
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {(activeTab === 'Incidents' ||
                activeTab === 'AssignmentGroups' ||
                activeTab === 'SLA_Definitions' ||
                activeTab === 'KnowledgeBase') && (
                <div
                  role="group"
                  aria-label="Filter by priority"
                  className="inline-flex items-center p-0.5 bg-slate-200/70 rounded-md"
                >
                  {(['ALL', 'P1', 'P2', 'P3', 'P4'] as const).map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPriorityFilter(p)}
                      className={`px-2.5 py-1 text-xs font-medium rounded transition-colors whitespace-nowrap ${
                        priorityFilter === p
                          ? 'bg-white text-slate-900'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {p === 'ALL' ? 'All Priorities' : p}
                    </button>
                  ))}
                </div>
              )}

              {renderSecondarySegmentedFilter(
                activeTab,
                secondaryFilter,
                setSecondaryFilter
              )}
            </div>
          </div>

          <DataGrid
            activeTab={activeTab}
            rows={filteredRows}
            sortConfig={sortConfig}
            onSort={handleSort}
            onSelectRow={(sel) => setDrawerStack([sel])}
            onResetFilters={handleResetFilters}
            referenceNowMs={referenceNowMs}
          />
        </main>
      </div>

      <DetailDrawer
        stack={drawerStack}
        onPush={(sel) => setDrawerStack((prev) => [...prev, sel])}
        onPop={() => setDrawerStack((prev) => prev.slice(0, -1))}
        onClose={() => setDrawerStack([])}
        onJumpToTabFilter={handleJumpToTabFilter}
        referenceNowMs={referenceNowMs}
      />

      {toastMessage && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-4 right-4 z-50 bg-slate-900 text-white text-xs font-medium px-4 py-2.5 rounded-md shadow-sm flex items-center gap-3"
        >
          <span>{toastMessage}</span>
          <button
            type="button"
            onClick={() => setToastMessage(null)}
            aria-label="Dismiss notification"
            className="text-slate-400 hover:text-white"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}

function renderSecondarySegmentedFilter(
  tab: TabId,
  value: string,
  onChange: (next: string) => void
) {
  let options: Array<{ id: string; label: string }> = [];

  switch (tab) {
    case 'Incidents':
      options = [
        { id: 'ALL', label: 'All States' },
        { id: 'ACTIVE', label: 'Active Queue' },
        { id: 'Within Target', label: 'Within SLA' },
        { id: 'At Risk', label: 'At Risk' },
        { id: 'Breached', label: 'Breached' },
        { id: 'Met', label: 'SLA Met' },
      ];
      break;
    case 'Services':
      options = [
        { id: 'ALL', label: 'All Tiers' },
        { id: 'Tier 0', label: 'Tier 0' },
        { id: 'Tier 1', label: 'Tier 1' },
        { id: 'Tier 2', label: 'Tier 2' },
        { id: 'Tier 3', label: 'Tier 3' },
      ];
      break;
    case 'Users':
      options = [
        { id: 'ALL', label: 'All Tiers' },
        { id: 'Command', label: 'Command' },
        { id: 'L3', label: 'L3' },
        { id: 'L2', label: 'L2' },
        { id: 'L1', label: 'L1' },
      ];
      break;
    case 'IncidentActivity':
      options = [
        { id: 'ALL', label: 'All Events' },
        { id: 'Created', label: 'Created' },
        { id: 'Escalation', label: 'Escalation' },
        { id: 'SLA Breach', label: 'SLA Breach' },
        { id: 'Resolution', label: 'Resolution' },
      ];
      break;
    case 'KnowledgeBase':
      options = [
        { id: 'ALL', label: 'All Domains' },
        { id: 'Application', label: 'Application' },
        { id: 'Network', label: 'Network' },
        { id: 'Database', label: 'Database' },
        { id: 'Authentication', label: 'Auth' },
        { id: 'API', label: 'API' },
        { id: 'Security', label: 'Security' },
      ];
      break;
    default:
      return null;
  }

  return (
    <div
      role="group"
      aria-label="Secondary tab filter"
      className="inline-flex flex-wrap items-center p-0.5 bg-slate-200/70 rounded-md"
    >
      {options.map((opt) => (
        <button
          key={opt.id}
          type="button"
          onClick={() => onChange(opt.id)}
          className={`px-2.5 py-1 text-xs font-medium rounded transition-colors whitespace-nowrap ${
            value === opt.id
              ? 'bg-white text-slate-900'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
