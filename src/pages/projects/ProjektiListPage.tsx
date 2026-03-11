import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  MapPin,
  Calendar,
  Users,
  Euro,
  Building2,
  TrendingUp,
  ArrowRight,
  Plus,
  FolderOpen,
} from 'lucide-react';

import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';

import { useProjectsStore } from '@/stores/projectsStore';
import { useWorkersStore } from '@/stores/workersStore';
import { PROJECT_PHASES } from '@/lib/constants';
import { ROUTES } from '@/router/routes';
import type { BudgetBreakdown, ProjectPhase } from '@/types';

type PhaseFilter = ProjectPhase | 'vsi';

function sumBudget(b: BudgetBreakdown): number {
  return Object.values(b).reduce((a, c) => a + c, 0);
}

function formatNumber(n: number): string {
  return n.toLocaleString('sl-SI');
}

function formatEur(n: number): string {
  return `${formatNumber(Math.round(n))} \u20AC`;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('sl-SI', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function getPhaseLabel(faza: ProjectPhase): string {
  const phase = PROJECT_PHASES.find((p) => p.value === faza);
  return phase?.label ?? faza;
}

function getPhaseBadgeVariant(faza: ProjectPhase): 'accent' | 'success' | 'warning' | 'secondary' {
  switch (faza) {
    case 'mobilizacija':
      return 'accent';
    case 'aktiven':
      return 'success';
    case 'zakljucevanje':
      return 'warning';
    case 'zakljucen':
      return 'secondary';
  }
}

function getBudgetRatioColor(ratio: number): string {
  if (ratio > 0.9) return 'bg-red-500';
  if (ratio > 0.7) return 'bg-amber-500';
  return 'bg-emerald-500';
}

function getBudgetTextColor(budget: number, actual: number): string {
  if (budget === 0) return 'text-muted-foreground';

  const ratio = actual / budget;

  if (ratio > 0.9) return 'text-red-600';
  if (ratio > 0.7) return 'text-amber-600';
  return 'text-emerald-600';
}

function formatWorkerCount(count: number): string {
  if (count === 1) return '1 delavec';
  if (count === 2) return '2 delavca';
  if (count === 3 || count === 4) return `${count} delavci`;
  return `${count} delavcev`;
}

const PHASE_FILTERS: Array<{ value: PhaseFilter; label: string }> = [
  { value: 'vsi', label: 'Vsi' },
  ...PROJECT_PHASES.map((p) => ({ value: p.value as PhaseFilter, label: p.label })),
];

export function ProjektiListPage(): React.JSX.Element {
  const { projekti } = useProjectsStore();
  const { delavci } = useWorkersStore();
  const [activeFilter, setActiveFilter] = useState<PhaseFilter>('vsi');

  const filteredProjekti = useMemo(() => {
    if (activeFilter === 'vsi') {
      return projekti;
    }
    return projekti.filter((p) => p.faza === activeFilter);
  }, [projekti, activeFilter]);

  const summary = useMemo(() => {
    const totalBudget = projekti.reduce((sum, p) => sum + sumBudget(p.proracun), 0);
    const totalActual = projekti.reduce((sum, p) => sum + sumBudget(p.dejanski_stroski), 0);
    const activeCount = projekti.filter((p) => p.faza === 'aktiven').length;

    return {
      total: projekti.length,
      active: activeCount,
      totalBudget,
      totalActual,
    };
  }, [projekti]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Projekti</h1>
          <p className="text-muted-foreground mt-1">Seznam vseh projektov</p>
        </div>
        <Button asChild>
          <Link to={ROUTES.PROJEKT_NOV}>
            <Plus className="mr-2 h-4 w-4" />
            Nov projekt
          </Link>
        </Button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-blue-100 p-2">
                <FolderOpen className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Skupaj projektov</p>
                <p className="text-2xl font-bold">{summary.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-emerald-100 p-2">
                <TrendingUp className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Aktivnih</p>
                <p className="text-2xl font-bold">{summary.active}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-violet-100 p-2">
                <Euro className="h-5 w-5 text-violet-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Skupni proracun</p>
                <p className="text-2xl font-bold">{formatEur(summary.totalBudget)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-amber-100 p-2">
                <Euro className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Dejanski stroski</p>
                <p className="text-2xl font-bold">{formatEur(summary.totalActual)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Phase filter tabs */}
      <div className="flex flex-wrap gap-2">
        {PHASE_FILTERS.map((filter) => {
          const isActive = activeFilter === filter.value;
          return (
            <button
              key={filter.value}
              onClick={() => setActiveFilter(filter.value)}
              className={`rounded-full border px-4 py-1.5 text-sm font-medium transition-colors ${
                isActive
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border bg-background text-muted-foreground hover:bg-muted'
              }`}
            >
              {filter.label}
              {filter.value !== 'vsi' && (
                <span className="ml-1.5 text-xs opacity-70">
                  ({projekti.filter((p) => p.faza === filter.value).length})
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Project cards grid */}
      {filteredProjekti.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FolderOpen className="h-12 w-12 text-muted-foreground/50" />
            <p className="mt-4 text-lg font-medium text-muted-foreground">
              Ni najdenih projektov
            </p>
            <p className="text-sm text-muted-foreground">
              {activeFilter === 'vsi'
                ? 'Dodajte prvi projekt za zacetek.'
                : 'Ni projektov v tej fazi.'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3">
          {filteredProjekti.map((projekt) => {
            const budget = sumBudget(projekt.proracun);
            const actual = sumBudget(projekt.dejanski_stroski);
            const budgetRatio = budget > 0 ? actual / budget : 0;
            const workerCount = projekt.delavci_ids.length;
            const assignedNames = delavci
              .filter((d) => projekt.delavci_ids.includes(d.id))
              .map((d) => `${d.ime} ${d.priimek}`);

            return (
              <Card key={projekt.id} className="flex flex-col transition-shadow hover:shadow-md">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-lg leading-tight">{projekt.naziv}</CardTitle>
                    <Badge variant={getPhaseBadgeVariant(projekt.faza)}>
                      {getPhaseLabel(projekt.faza)}
                    </Badge>
                  </div>

                  <div className="mt-2 flex flex-col gap-1.5 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5 shrink-0" />
                      <span>
                        {projekt.lokacija}, {projekt.drzava}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Building2 className="h-3.5 w-3.5 shrink-0" />
                      <span>{projekt.narocnik}</span>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="flex-1 space-y-4">
                  {/* Progress */}
                  <div>
                    <div className="mb-1.5 flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Napredek</span>
                      <span className="font-medium">{projekt.napredek}%</span>
                    </div>
                    <Progress value={projekt.napredek} className="h-2" />
                  </div>

                  {/* Budget vs Actual */}
                  <div className="rounded-lg bg-muted/50 p-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Proracun</span>
                      <span className="font-medium">{formatEur(budget)}</span>
                    </div>
                    <div className="mt-1 flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Porabljeno</span>
                      <span className={`font-medium ${getBudgetTextColor(budget, actual)}`}>
                        {formatEur(actual)}
                      </span>
                    </div>
                    {budget > 0 && (
                      <div className="mt-2">
                        <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                          <div
                            className={`h-full rounded-full transition-all ${getBudgetRatioColor(budgetRatio)}`}
                            style={{ width: `${Math.min(budgetRatio * 100, 100)}%` }}
                          />
                        </div>
                        <p className="mt-1 text-right text-xs text-muted-foreground">
                          {Math.round(budgetRatio * 100)}% porabljeno
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Meta info */}
                  <div className="flex flex-col gap-1.5 text-sm">
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <Users className="h-3.5 w-3.5 shrink-0" />
                      <span>{formatWorkerCount(workerCount)}</span>
                    </div>
                    {assignedNames.length > 0 && (
                      <p className="ml-5 text-xs text-muted-foreground/70 truncate" title={assignedNames.join(', ')}>
                        {assignedNames.slice(0, 3).join(', ')}
                        {assignedNames.length > 3 && ` +${assignedNames.length - 3}`}
                      </p>
                    )}
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <Calendar className="h-3.5 w-3.5 shrink-0" />
                      <span>
                        {formatDate(projekt.zacetek)} &ndash; {formatDate(projekt.konec)}
                      </span>
                    </div>
                  </div>
                </CardContent>

                <CardFooter className="pt-3">
                  <Button asChild variant="outline" className="w-full">
                    <Link to={ROUTES.PROJEKT_DETAIL(projekt.id)}>
                      Podrobnosti
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
