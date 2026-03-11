import { useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  MapPin,
  Calendar,
  Users,
  Euro,
  Building2,
  Wrench,
  FolderKanban,
  Handshake,
  FileText,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/common/StatusBadge';
import { EmptyState } from '@/components/common/EmptyState';
import { useProjectsStore } from '@/stores/projectsStore';
import { useWorkersStore } from '@/stores/workersStore';
import { useExpensesStore } from '@/stores/expensesStore';
import { EXPENSE_CATEGORIES } from '@/lib/constants';
import { ROUTES } from '@/router/routes';
import { formatDate, formatCurrency, totalBudget } from '@/lib/utils';
import type { Project, WorkerAssignment, BudgetBreakdown } from '@/types';

function getBudgetProgressColor(pct: number): string {
  if (pct > 90) return '[&>div]:bg-red-500';
  if (pct > 70) return '[&>div]:bg-amber-500';
  return '[&>div]:bg-emerald-500';
}

function BudgetCategory({ label, planned, actual }: { label: string; planned: number; actual: number }): React.JSX.Element {
  const pct = planned > 0 ? Math.round((actual / planned) * 100) : 0;
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium">{formatCurrency(actual)} / {formatCurrency(planned)}</span>
      </div>
      <Progress value={Math.min(pct, 100)} className={`h-2 ${getBudgetProgressColor(pct)}`} />
    </div>
  );
}

const BUDGET_LABELS: Record<keyof BudgetBreakdown, string> = {
  delo: 'Delo',
  transport: 'Transport',
  nastanitev: 'Nastanitev',
  orodje: 'Orodje/Oprema',
  dnevnice: 'Dnevnice',
  drugo: 'Drugo',
};

export function ProjektDetailPage(): React.JSX.Element {
  const { id } = useParams<{ id: string }>();
  const getProjekt = useProjectsStore((s) => s.getProjekt);
  const { delavci } = useWorkersStore();
  const { stroski } = useExpensesStore();

  const projekt = getProjekt(Number(id));

  if (!projekt) {
    return (
      <div className="space-y-6">
        <Link to={ROUTES.PROJEKTI}>
          <Button variant="ghost" size="sm" className="gap-1.5"><ArrowLeft className="h-4 w-4" />Nazaj na projekte</Button>
        </Link>
        <EmptyState title="Projekt ni najden" description="Projekt s tem ID-jem ne obstaja." icon={FolderKanban} />
      </div>
    );
  }

  const budgetTotal = totalBudget(projekt.proracun);
  const actualTotal = totalBudget(projekt.dejanski_stroski);
  const budgetPct = budgetTotal > 0 ? Math.round((actualTotal / budgetTotal) * 100) : 0;

  const assignedWorkers = delavci.filter((d) => projekt.delavci_ids.includes(d.id));
  const projectExpenses = stroski.filter((s) => s.projekt_id === projekt.id);
  const totalExpenses = projectExpenses.reduce((sum, e) => sum + e.znesek, 0);

  return (
    <div className="space-y-6">
      {/* Back button */}
      <Link to={ROUTES.PROJEKTI}>
        <Button variant="ghost" size="sm" className="gap-1.5"><ArrowLeft className="h-4 w-4" />Nazaj na projekte</Button>
      </Link>

      {/* Project header */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <h1 className="text-2xl font-bold">{projekt.naziv}</h1>
              <StatusBadge status={projekt.faza} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-sm">
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <MapPin className="h-3.5 w-3.5 shrink-0" />
                {projekt.lokacija}, {projekt.drzava}
              </span>
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <Building2 className="h-3.5 w-3.5 shrink-0" />
                {projekt.narocnik}
              </span>
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <Calendar className="h-3.5 w-3.5 shrink-0" />
                {formatDate(projekt.zacetek)} — {formatDate(projekt.konec)}
              </span>
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <Users className="h-3.5 w-3.5 shrink-0" />
                {assignedWorkers.length} delavcev
              </span>
            </div>
            {projekt.opombe && (
              <p className="text-sm text-muted-foreground bg-muted/50 rounded-md px-3 py-2">{projekt.opombe}</p>
            )}
            <div className="space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Napredek projekta</span>
                <span className="font-medium">{projekt.napredek}%</span>
              </div>
              <Progress value={projekt.napredek} className="h-3" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-2xl font-bold">{formatCurrency(budgetTotal)}</p>
              <p className="text-xs text-muted-foreground">Proračun</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className={`text-2xl font-bold ${budgetPct > 90 ? 'text-red-600' : budgetPct > 70 ? 'text-amber-600' : 'text-emerald-600'}`}>
                {formatCurrency(actualTotal)}
              </p>
              <p className="text-xs text-muted-foreground">Dejanski stroški ({budgetPct}%)</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-2xl font-bold">{assignedWorkers.length}</p>
              <p className="text-xs text-muted-foreground">Delavcev na lokaciji</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-2xl font-bold">{projekt.partnerji.length}</p>
              <p className="text-xs text-muted-foreground">Partnerjev</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Budget breakdown */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Euro className="h-4 w-4 text-muted-foreground" />
              Proračun po kategorijah
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {(Object.keys(BUDGET_LABELS) as (keyof BudgetBreakdown)[]).map((key) => (
              <BudgetCategory
                key={key}
                label={BUDGET_LABELS[key]}
                planned={projekt.proracun[key]}
                actual={projekt.dejanski_stroski[key]}
              />
            ))}
          </CardContent>
        </Card>

        {/* Worker assignments (bauštela) */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              Razporeditev delavcev (bauštela)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {(projekt.razporeditve || []).length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">Ni razporeditev.</p>
            ) : (
              <div className="space-y-3">
                {(projekt.razporeditve || []).map((assignment: WorkerAssignment) => (
                  <div key={assignment.id} className="flex items-center justify-between bg-muted/30 rounded-lg px-3 py-2.5">
                    <div className="min-w-0">
                      <Link to={ROUTES.DELAVEC_DETAIL(assignment.delavec_id)} className="font-medium text-sm hover:text-primary transition-colors">
                        {assignment.delavec_ime}
                      </Link>
                      <div className="text-xs text-muted-foreground flex flex-wrap gap-2 mt-0.5">
                        {assignment.vloga && (
                          <span className="flex items-center gap-1"><Wrench className="h-3 w-3" />{assignment.vloga}</span>
                        )}
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDate(assignment.od)} — {assignment.do ? formatDate(assignment.do) : 'aktivno'}
                        </span>
                      </div>
                    </div>
                    {!assignment.do && <Badge variant="success" className="text-[10px] shrink-0">Na lokaciji</Badge>}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Partners */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Handshake className="h-4 w-4 text-muted-foreground" />
              Partnerji
            </CardTitle>
          </CardHeader>
          <CardContent>
            {projekt.partnerji.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">Ni partnerjev.</p>
            ) : (
              <div className="space-y-2">
                {projekt.partnerji.map((partner) => (
                  <div key={partner.id} className="flex items-center justify-between bg-muted/30 rounded-lg px-3 py-2.5">
                    <div>
                      <p className="font-medium text-sm">{partner.naziv}</p>
                      <p className="text-xs text-muted-foreground">{partner.kontakt}</p>
                    </div>
                    <StatusBadge status={partner.status} />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent expenses */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              Stroški projekta ({formatCurrency(totalExpenses)})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {projectExpenses.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">Ni stroškov.</p>
            ) : (
              <div className="space-y-2">
                {projectExpenses.sort((a, b) => new Date(b.datum).getTime() - new Date(a.datum).getTime()).slice(0, 8).map((expense) => {
                  const cat = EXPENSE_CATEGORIES.find((c) => c.value === expense.kategorija);
                  return (
                    <div key={expense.id} className="flex items-center justify-between text-sm bg-muted/30 rounded-lg px-3 py-2">
                      <div className="min-w-0">
                        <span className="font-medium">{expense.opis}</span>
                        <div className="text-xs text-muted-foreground flex gap-2 mt-0.5">
                          <span>{formatDate(expense.datum)}</span>
                          <span>{cat?.label}</span>
                        </div>
                      </div>
                      <span className="font-semibold shrink-0 ml-2">{formatCurrency(expense.znesek)}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
