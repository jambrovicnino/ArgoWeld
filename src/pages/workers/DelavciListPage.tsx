import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  Euro,
  FileText,
  FolderOpen,
  Mail,
  Phone,
  Search,
  UserPlus,
  Users,
  Wrench,
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { PageHeader } from '@/components/common/PageHeader';
import { EmptyState } from '@/components/common/EmptyState';
import { StatusBadge } from '@/components/common/StatusBadge';
import { WORKER_STATUSES } from '@/lib/constants';
import { useWorkersStore } from '@/stores/workersStore';
import { useProjectsStore } from '@/stores/projectsStore';
import { ROUTES } from '@/router/routes';
import type { Worker, WorkerStatus } from '@/types';

type StatusFilter = WorkerStatus | 'vsi';

function getDocumentAlerts(worker: Worker): { expired: number; expiring: number } {
  let expired = 0;
  let expiring = 0;

  for (const doc of worker.dokumenti) {
    if (doc.status_veljavnosti === 'potekel') {
      expired++;
    } else if (doc.status_veljavnosti === 'poteka_kmalu') {
      expiring++;
    }
  }

  return { expired, expiring };
}

function getProjectName(
  projektId: number | null,
  projekti: { id: number; naziv: string }[]
): string | null {
  if (projektId === null) return null;
  const project = projekti.find((p) => p.id === projektId);
  return project?.naziv ?? null;
}

function matchesSearch(worker: Worker, query: string): boolean {
  if (query === '') return true;
  const lowerQuery = query.toLowerCase();
  const fullName = `${worker.ime} ${worker.priimek}`.toLowerCase();
  return fullName.includes(lowerQuery);
}

export function DelavciListPage(): React.JSX.Element {
  const { delavci } = useWorkersStore();
  const { projekti } = useProjectsStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('vsi');

  const filteredDelavci = useMemo(() => {
    return delavci.filter((worker) => {
      if (!matchesSearch(worker, searchQuery)) return false;
      if (statusFilter !== 'vsi' && worker.status !== statusFilter) return false;
      return true;
    });
  }, [delavci, searchQuery, statusFilter]);

  const stats = useMemo(() => {
    const total = delavci.length;
    const employed = delavci.filter((d) => d.status === 'zaposlen').length;
    const inProcess = delavci.filter((d) => d.status === 'v_procesu').length;
    const inNegotiation = delavci.filter((d) => d.status === 'v_dogovoru').length;
    return { total, employed, inProcess, inNegotiation };
  }, [delavci]);

  return (
    <div className="space-y-6">
      <PageHeader title="Delavci" description="Seznam vseh delavcev">
        <Button asChild>
          <Link to={ROUTES.DELAVEC_NOV}>
            <UserPlus className="mr-2 h-4 w-4" />
            Nov delavec
          </Link>
        </Button>
      </PageHeader>

      {/* Summary stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <SummaryCard
          label="Skupaj delavcev"
          value={stats.total}
          icon={Users}
          className="text-foreground"
        />
        <SummaryCard
          label="Zaposleni"
          value={stats.employed}
          icon={Users}
          className="text-emerald-600"
        />
        <SummaryCard
          label="V procesu"
          value={stats.inProcess}
          icon={Users}
          className="text-amber-600"
        />
        <SummaryCard
          label="V dogovoru"
          value={stats.inNegotiation}
          icon={Users}
          className="text-blue-600"
        />
      </div>

      {/* Search and filter */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Iskanje po imenu ali priimku..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <StatusFilterBadge
            label="Vsi"
            filterValue="vsi"
            activeFilter={statusFilter}
            count={delavci.length}
            onSelect={setStatusFilter}
          />
          {WORKER_STATUSES.map((s) => (
            <StatusFilterBadge
              key={s.value}
              label={s.label}
              filterValue={s.value}
              activeFilter={statusFilter}
              count={delavci.filter((d) => d.status === s.value).length}
              onSelect={setStatusFilter}
            />
          ))}
        </div>
      </div>

      {/* Worker cards grid */}
      {filteredDelavci.length === 0 ? (
        <EmptyState
          title="Ni najdenih delavcev"
          description="Prilagodite iskalne pogoje ali dodajte novega delavca."
          icon={Users}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredDelavci.map((worker) => (
            <WorkerCard
              key={worker.id}
              worker={worker}
              projectName={getProjectName(worker.trenutni_projekt_id, projekti)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

interface SummaryCardProps {
  label: string;
  value: number;
  icon: React.ElementType;
  className?: string;
}

function SummaryCard({ label, value, icon: Icon, className }: SummaryCardProps): React.JSX.Element {
  return (
    <Card>
      <CardContent className="flex items-center gap-3 p-4">
        <div className={className}>
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <p className="text-2xl font-bold">{value}</p>
          <p className="text-xs text-muted-foreground">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}

interface StatusFilterBadgeProps {
  label: string;
  filterValue: StatusFilter;
  activeFilter: StatusFilter;
  count: number;
  onSelect: (value: StatusFilter) => void;
}

function StatusFilterBadge({
  label,
  filterValue,
  activeFilter,
  count,
  onSelect,
}: StatusFilterBadgeProps): React.JSX.Element {
  const isActive = activeFilter === filterValue;

  return (
    <button
      type="button"
      onClick={() => onSelect(filterValue)}
      className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-full"
    >
      <Badge variant={isActive ? 'default' : 'outline'} className="cursor-pointer">
        {label} ({count})
      </Badge>
    </button>
  );
}

interface WorkerCardProps {
  worker: Worker;
  projectName: string | null;
}

function WorkerCard({ worker, projectName }: WorkerCardProps): React.JSX.Element {
  const alerts = getDocumentAlerts(worker);
  const hasAlerts = alerts.expired > 0 || alerts.expiring > 0;

  return (
    <Link to={ROUTES.DELAVEC_DETAIL(worker.id)} className="block group">
      <Card className="h-full transition-shadow hover:shadow-md">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <CardTitle className="text-base font-semibold truncate">
                {worker.ime} {worker.priimek}
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-0.5">{worker.narodnost}</p>
            </div>
            <StatusBadge status={worker.status} />
          </div>
        </CardHeader>

        <CardContent className="space-y-3">
          {/* Welding types */}
          {worker.tipi_varjenja.length > 0 && (
            <div className="flex items-center gap-1.5 flex-wrap">
              <Wrench className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              {worker.tipi_varjenja.map((tip) => (
                <Badge key={tip} variant="secondary" className="text-[11px] px-1.5 py-0">
                  {tip}
                </Badge>
              ))}
            </div>
          )}

          {/* Current project */}
          <div className="flex items-center gap-2 text-sm">
            <FolderOpen className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            {projectName ? (
              <span className="truncate">{projectName}</span>
            ) : (
              <span className="text-muted-foreground italic">Brez projekta</span>
            )}
          </div>

          {/* Hourly rate */}
          <div className="flex items-center gap-2 text-sm">
            <Euro className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            <span>{worker.urna_postavka.toFixed(2)} &euro;/uro</span>
          </div>

          {/* Contact */}
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1 truncate">
              <Phone className="h-3 w-3 shrink-0" />
              {worker.telefon}
            </span>
            <span className="flex items-center gap-1 truncate">
              <Mail className="h-3 w-3 shrink-0" />
              {worker.email}
            </span>
          </div>

          {/* Documents and alerts */}
          <div className="flex items-center justify-between border-t pt-3">
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <FileText className="h-3.5 w-3.5" />
              {worker.dokumenti.length} {worker.dokumenti.length === 1 ? 'dokument' : 'dokumentov'}
            </span>

            {hasAlerts && (
              <div className="flex items-center gap-2">
                {alerts.expired > 0 && (
                  <span className="flex items-center gap-1 text-xs text-destructive font-medium">
                    <AlertTriangle className="h-3.5 w-3.5" />
                    {alerts.expired} {alerts.expired === 1 ? 'potekel' : 'poteklih'}
                  </span>
                )}
                {alerts.expiring > 0 && (
                  <span className="flex items-center gap-1 text-xs text-amber-600 font-medium">
                    <AlertTriangle className="h-3.5 w-3.5" />
                    {alerts.expiring} {alerts.expiring === 1 ? 'poteče' : 'potečejo'} kmalu
                  </span>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
