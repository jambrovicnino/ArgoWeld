import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import {
  Users,
  Briefcase,
  Euro,
  UserPlus,
  AlertTriangle,
  TrendingUp,
  FileWarning,
  ArrowRight,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { useWorkersStore } from '@/stores/workersStore';
import { useProjectsStore } from '@/stores/projectsStore';
import { useExpensesStore } from '@/stores/expensesStore';
import { usePipelineStore } from '@/stores/pipelineStore';
import { EXPENSE_CATEGORIES, PIPELINE_STAGES, PROJECT_PHASES, ALERT_THRESHOLDS } from '@/lib/constants';
import { ROUTES } from '@/router/routes';
import type { Alert } from '@/types';
import type { BudgetBreakdown } from '@/types';

function sumBudget(budget: BudgetBreakdown): number {
  return budget.delo + budget.transport + budget.nastanitev + budget.orodje + budget.dnevnice + budget.drugo;
}

function formatEur(amount: number): string {
  return new Intl.NumberFormat('sl-SI', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('sl-SI', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function getMonthLabel(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('sl-SI', { month: 'short', year: '2-digit' });
}

function getStageName(stageValue: string): string {
  const stage = PIPELINE_STAGES.find((s) => s.value === stageValue);
  return stage?.label ?? stageValue;
}

function getPhaseName(phaseValue: string): string {
  const phase = PROJECT_PHASES.find((p) => p.value === phaseValue);
  return phase?.label ?? phaseValue;
}

function getBudgetColor(percentage: number): string {
  if (percentage > ALERT_THRESHOLDS.BUDGET_DANGER_PCT * 100) return 'text-red-600';
  if (percentage > ALERT_THRESHOLDS.BUDGET_WARNING_PCT * 100) return 'text-amber-600';
  return 'text-emerald-600';
}

function getBudgetProgressClass(percentage: number): string {
  if (percentage > ALERT_THRESHOLDS.BUDGET_DANGER_PCT * 100) return '[&>div]:bg-red-500';
  if (percentage > ALERT_THRESHOLDS.BUDGET_WARNING_PCT * 100) return '[&>div]:bg-amber-500';
  return '[&>div]:bg-emerald-500';
}

export function DashboardPage(): React.JSX.Element {
  const { delavci } = useWorkersStore();
  const { projekti } = useProjectsStore();
  const { stroski } = useExpensesStore();
  const { kandidati } = usePipelineStore();

  const aktivniDelavci = useMemo(
    () => delavci.filter((d) => d.status === 'zaposlen').length,
    [delavci]
  );

  const aktivniProjekti = useMemo(
    () => projekti.filter((p) => p.faza !== 'zakljucen'),
    [projekti]
  );

  const skupniStroski = useMemo(() => {
    return stroski.reduce((sum, s) => sum + s.znesek, 0);
  }, [stroski]);

  // Alerts: document issues for workers
  const alerts = useMemo((): Alert[] => {
    const result: Alert[] = [];

    for (const delavec of delavci) {
      for (const doc of delavec.dokumenti) {
        const fullName = `${delavec.ime} ${delavec.priimek}`;

        if (doc.tip === 'trc' && doc.status_veljavnosti === 'potekel') {
          result.push({
            id: `trc-exp-${delavec.id}-${doc.id}`,
            tip: 'trc_potekel',
            resnost: 'kriticno',
            naslov: `TRC potekel: ${fullName}`,
            opis: doc.datum_poteka ? `Potekel dne ${formatDate(doc.datum_poteka)}` : 'TRC je potekel',
            povezava: ROUTES.DELAVEC_DETAIL(delavec.id),
          });
        }

        if (doc.tip === 'trc' && doc.status_veljavnosti === 'poteka_kmalu') {
          result.push({
            id: `trc-warn-${delavec.id}-${doc.id}`,
            tip: 'trc_poteka',
            resnost: 'opozorilo',
            naslov: `TRC poteka kmalu: ${fullName}`,
            opis: doc.datum_poteka ? `Poteka dne ${formatDate(doc.datum_poteka)}` : 'TRC poteka kmalu',
            povezava: ROUTES.DELAVEC_DETAIL(delavec.id),
          });
        }

        if (doc.tip === 'varilski_certifikat' && doc.status_veljavnosti === 'potekel') {
          result.push({
            id: `cert-exp-${delavec.id}-${doc.id}`,
            tip: 'certifikat_potekel',
            resnost: 'kriticno',
            naslov: `Certifikat potekel: ${fullName}`,
            opis: doc.datum_poteka ? `Potekel dne ${formatDate(doc.datum_poteka)}` : 'Varilski certifikat je potekel',
            povezava: ROUTES.DELAVEC_DETAIL(delavec.id),
          });
        }

        if (doc.tip === 'varilski_certifikat' && doc.status_veljavnosti === 'poteka_kmalu') {
          result.push({
            id: `cert-warn-${delavec.id}-${doc.id}`,
            tip: 'certifikat_poteka',
            resnost: 'opozorilo',
            naslov: `Certifikat poteka kmalu: ${fullName}`,
            opis: doc.datum_poteka ? `Poteka dne ${formatDate(doc.datum_poteka)}` : 'Varilski certifikat poteka kmalu',
            povezava: ROUTES.DELAVEC_DETAIL(delavec.id),
          });
        }
      }
    }

    // Budget alerts for active projects
    for (const projekt of aktivniProjekti) {
      const budget = sumBudget(projekt.proracun);
      const actual = sumBudget(projekt.dejanski_stroski);
      if (budget > 0) {
        const ratio = actual / budget;
        if (ratio > 1) {
          result.push({
            id: `budget-over-${projekt.id}`,
            tip: 'proracun_prekoracen',
            resnost: 'kriticno',
            naslov: `Proračun prekoračen: ${projekt.naziv}`,
            opis: `Dejanski: ${formatEur(actual)} / Plan: ${formatEur(budget)} (${Math.round(ratio * 100)}%)`,
            povezava: ROUTES.PROJEKT_DETAIL(projekt.id),
          });
        } else if (ratio > ALERT_THRESHOLDS.BUDGET_DANGER_PCT) {
          result.push({
            id: `budget-warn-${projekt.id}`,
            tip: 'proracun_opozorilo',
            resnost: 'opozorilo',
            naslov: `Proračun skoraj izčrpan: ${projekt.naziv}`,
            opis: `Dejanski: ${formatEur(actual)} / Plan: ${formatEur(budget)} (${Math.round(ratio * 100)}%)`,
            povezava: ROUTES.PROJEKT_DETAIL(projekt.id),
          });
        }
      }
    }

    return result;
  }, [delavci, aktivniProjekti]);

  // Monthly expense chart data - last 6 months
  const monthlyExpenseData = useMemo(() => {
    const months: Record<string, Record<string, number>> = {};

    // Build months from actual expense data
    for (const expense of stroski) {
      const d = new Date(expense.datum);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (!(key in months)) {
        months[key] = {};
        for (const cat of EXPENSE_CATEGORIES) {
          months[key][cat.value] = 0;
        }
      }
      months[key][expense.kategorija] = (months[key][expense.kategorija] || 0) + expense.znesek;
    }

    return Object.entries(months)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, categories]) => ({
        mesec: getMonthLabel(key + '-01'),
        ...categories,
      }));
  }, [stroski]);

  // Budget overview for active projects
  const budgetOverview = useMemo(() => {
    return aktivniProjekti.map((p) => {
      const budget = sumBudget(p.proracun);
      const actual = sumBudget(p.dejanski_stroski);
      const percentage = budget > 0 ? Math.round((actual / budget) * 100) : 0;
      return { id: p.id, naziv: p.naziv, faza: p.faza, budget, actual, percentage };
    });
  }, [aktivniProjekti]);

  // Recent pipeline candidates, sorted by expected arrival
  const recentPipeline = useMemo(() => {
    return [...kandidati]
      .sort((a, b) => new Date(a.pricakovani_prihod).getTime() - new Date(b.pricakovani_prihod).getTime())
      .slice(0, 5);
  }, [kandidati]);

  const criticalAlerts = alerts.filter((a) => a.resnost === 'kriticno');
  const warningAlerts = alerts.filter((a) => a.resnost === 'opozorilo');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Nadzorna plošča</h1>
        <p className="text-muted-foreground mt-1">Pregled poslovanja ArgoWeld</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Aktivni delavci</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{aktivniDelavci}</div>
            <p className="text-xs text-muted-foreground">
              od {delavci.length} skupaj
            </p>
          </CardContent>
          <CardFooter className="pt-0">
            <Link to={ROUTES.DELAVCI} className="text-xs text-primary hover:underline inline-flex items-center gap-1">
              Pregled delavcev <ArrowRight className="h-3 w-3" />
            </Link>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Aktivni projekti</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{aktivniProjekti.length}</div>
            <p className="text-xs text-muted-foreground">
              od {projekti.length} skupaj
            </p>
          </CardContent>
          <CardFooter className="pt-0">
            <Link to={ROUTES.PROJEKTI} className="text-xs text-primary hover:underline inline-flex items-center gap-1">
              Pregled projektov <ArrowRight className="h-3 w-3" />
            </Link>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Skupni stroški</CardTitle>
            <Euro className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatEur(skupniStroski)}</div>
            <p className="text-xs text-muted-foreground">
              vsi stroški
            </p>
          </CardContent>
          <CardFooter className="pt-0">
            <Link to={ROUTES.STROSKI} className="text-xs text-primary hover:underline inline-flex items-center gap-1">
              Pregled stroškov <ArrowRight className="h-3 w-3" />
            </Link>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Kandidati v Pipeline</CardTitle>
            <UserPlus className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kandidati.length}</div>
            <p className="text-xs text-muted-foreground">
              v razlicnih fazah
            </p>
          </CardContent>
          <CardFooter className="pt-0">
            <Link to={ROUTES.PIPELINE} className="text-xs text-primary hover:underline inline-flex items-center gap-1">
              Pregled Pipeline <ArrowRight className="h-3 w-3" />
            </Link>
          </CardFooter>
        </Card>
      </div>

      {/* Alerts Section */}
      {alerts.length > 0 && (
        <Card className="border-amber-200 bg-amber-50/50">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
              <CardTitle className="text-lg">Opozorila</CardTitle>
              <Badge variant="warning">{alerts.length}</Badge>
            </div>
            <CardDescription>Dokumenti in proračuni, ki zahtevajo pozornost</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {criticalAlerts.map((alert) => (
                <div key={alert.id} className="flex items-start gap-3 p-3 rounded-lg bg-red-50 border border-red-200">
                  <FileWarning className="h-4 w-4 text-red-600 mt-0.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium text-red-900">{alert.naslov}</span>
                      <Badge variant="destructive">Kriticno</Badge>
                    </div>
                    <p className="text-xs text-red-700 mt-0.5">{alert.opis}</p>
                  </div>
                  {alert.povezava && (
                    <Link to={alert.povezava}>
                      <Button variant="ghost" size="sm" className="shrink-0 text-red-700 hover:text-red-900">
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    </Link>
                  )}
                </div>
              ))}
              {warningAlerts.map((alert) => (
                <div key={alert.id} className="flex items-start gap-3 p-3 rounded-lg bg-amber-50 border border-amber-200">
                  <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium text-amber-900">{alert.naslov}</span>
                      <Badge variant="warning">Opozorilo</Badge>
                    </div>
                    <p className="text-xs text-amber-700 mt-0.5">{alert.opis}</p>
                  </div>
                  {alert.povezava && (
                    <Link to={alert.povezava}>
                      <Button variant="ghost" size="sm" className="shrink-0 text-amber-700 hover:text-amber-900">
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    </Link>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
          <CardFooter>
            <Link to={ROUTES.OPOZORILA}>
              <Button variant="outline" size="sm">
                Vsa opozorila <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </Link>
          </CardFooter>
        </Card>
      )}

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Expenses Bar Chart */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-muted-foreground" />
              <CardTitle className="text-lg">Mesečni stroški</CardTitle>
            </div>
            <CardDescription>Pregled stroškov po kategorijah za zadnjih 6 mesecev</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyExpenseData}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis dataKey="mesec" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} tickFormatter={(v: number) => `${(v / 1000).toFixed(0)}k`} />
                  <Tooltip
                    formatter={(value: number, name: string) => {
                      const cat = EXPENSE_CATEGORIES.find((c) => c.value === name);
                      return [formatEur(value), cat?.label ?? name];
                    }}
                    labelStyle={{ fontWeight: 'bold' }}
                  />
                  <Legend
                    formatter={(value: string) => {
                      const cat = EXPENSE_CATEGORIES.find((c) => c.value === value);
                      return cat?.label ?? value;
                    }}
                  />
                  {EXPENSE_CATEGORIES.map((cat) => (
                    <Bar key={cat.value} dataKey={cat.value} stackId="expenses" fill={cat.color} />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Pipeline Overview */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-muted-foreground" />
              <CardTitle className="text-lg">Pipeline kandidati</CardTitle>
            </div>
            <CardDescription>Najblizji pricakovani prihodi</CardDescription>
          </CardHeader>
          <CardContent>
            {recentPipeline.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">Ni kandidatov v Pipeline</p>
            ) : (
              <div className="space-y-3">
                {recentPipeline.map((kandidat) => (
                  <div
                    key={kandidat.id}
                    className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">
                        {kandidat.ime} {kandidat.priimek}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {kandidat.narodnost} &middot; {kandidat.tipi_varjenja.join(', ')}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge variant="accent">{getStageName(kandidat.faza)}</Badge>
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {formatDate(kandidat.pricakovani_prihod)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
          <CardFooter>
            <Link to={ROUTES.PIPELINE}>
              <Button variant="outline" size="sm">
                Celoten Pipeline <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </Link>
          </CardFooter>
        </Card>
      </div>

      {/* Budget Overview for Active Projects */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Briefcase className="h-5 w-5 text-muted-foreground" />
            <CardTitle className="text-lg">Proračun aktivnih projektov</CardTitle>
          </div>
          <CardDescription>Primerjava dejanskih stroškov s planiranim proračunom</CardDescription>
        </CardHeader>
        <CardContent>
          {budgetOverview.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">Ni aktivnih projektov</p>
          ) : (
            <div className="space-y-4">
              {budgetOverview.map((project) => (
                <div key={project.id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 min-w-0">
                      <Link
                        to={ROUTES.PROJEKT_DETAIL(project.id)}
                        className="text-sm font-medium hover:underline truncate"
                      >
                        {project.naziv}
                      </Link>
                      <Badge variant="outline" className="shrink-0">
                        {getPhaseName(project.faza)}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 ml-4">
                      <span className={`text-sm font-semibold ${getBudgetColor(project.percentage)}`}>
                        {project.percentage}%
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {formatEur(project.actual)} / {formatEur(project.budget)}
                      </span>
                    </div>
                  </div>
                  <Progress
                    value={Math.min(project.percentage, 100)}
                    className={`h-2 ${getBudgetProgressClass(project.percentage)}`}
                  />
                </div>
              ))}
            </div>
          )}
        </CardContent>
        <CardFooter>
          <Link to={ROUTES.PROJEKTI}>
            <Button variant="outline" size="sm">
              Vsi projekti <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}
