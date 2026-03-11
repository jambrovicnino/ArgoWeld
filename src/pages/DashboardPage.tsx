import { useMemo, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
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
  Search,
  User,
  FolderKanban,
  Car,
  MapPin,
  Calendar,
  Wrench,
  Phone,
  Globe,
  Shield,
  Heart,
  Route,
  Building2,
  CreditCard,
  Gauge,
  Camera,
  X,
  Layers,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { StatusBadge } from '@/components/common/StatusBadge';
import { useWorkersStore } from '@/stores/workersStore';
import { useProjectsStore } from '@/stores/projectsStore';
import { useExpensesStore } from '@/stores/expensesStore';
import { usePipelineStore } from '@/stores/pipelineStore';
import { useVehiclesStore } from '@/stores/vehiclesStore';
import { EXPENSE_CATEGORIES, PIPELINE_STAGES, PROJECT_PHASES, ALERT_THRESHOLDS, DOC_TYPES } from '@/lib/constants';
import { ROUTES } from '@/router/routes';
import { formatDate, formatCurrency, getInitials, daysUntilExpiry, validityColor } from '@/lib/utils';
import type { Alert, BudgetBreakdown, Worker, Vehicle, Project } from '@/types';

/* ─── Types ─── */
type SearchCategory = 'vse' | 'delavci' | 'vozila' | 'projekti';

/* ─── Helpers ─── */
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

function fmtDate(dateStr: string): string {
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

function getPhaseColor(faza: string): string {
  switch (faza) {
    case 'aktiven': return 'bg-emerald-100 text-emerald-800';
    case 'mobilizacija': return 'bg-blue-100 text-blue-800';
    case 'zakljucevanje': return 'bg-amber-100 text-amber-800';
    case 'zakljucen': return 'bg-gray-100 text-gray-600';
    default: return 'bg-gray-100 text-gray-600';
  }
}

/* ─── Worker quick-view card (inline in dashboard search) ─── */
function WorkerQuickView({ delavec }: { delavec: Worker }): React.JSX.Element {
  const { projekti } = useProjectsStore();
  const { potovanja } = useVehiclesStore();
  const currentProject = delavec.trenutni_projekt_id
    ? projekti.find((p) => p.id === delavec.trenutni_projekt_id)?.naziv
    : undefined;
  const workerTrips = potovanja.filter((t) => t.voznik_id === delavec.id);
  const latestHealth = [...(delavec.zdravniski_pregledi || [])].sort(
    (a, b) => new Date(b.datum_pregleda).getTime() - new Date(a.datum_pregleda).getTime()
  )[0];

  return (
    <div className="space-y-4">
      {/* Profile */}
      <div className="flex gap-4">
        <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xl font-bold shrink-0">
          {getInitials(delavec.ime, delavec.priimek)}
        </div>
        <div className="min-w-0 space-y-1.5">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-lg font-bold">{delavec.ime} {delavec.priimek}</h3>
            <StatusBadge status={delavec.status} />
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
            <span className="flex items-center gap-1"><Globe className="h-3.5 w-3.5" />{delavec.narodnost}</span>
            <span className="flex items-center gap-1"><Phone className="h-3.5 w-3.5" />{delavec.telefon}</span>
            <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" />Od {formatDate(delavec.datum_zaposlitve)}</span>
            {currentProject && <span className="flex items-center gap-1"><Building2 className="h-3.5 w-3.5" />{currentProject}</span>}
          </div>
          <div className="flex flex-wrap gap-1">
            {delavec.tipi_varjenja.map((tip) => (
              <Badge key={tip} variant="outline" className="text-[10px] gap-0.5"><Wrench className="h-2.5 w-2.5" />{tip}</Badge>
            ))}
          </div>
        </div>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-blue-50 rounded-lg px-3 py-2 text-center">
          <p className="text-lg font-bold text-blue-700">{delavec.dokumenti.filter((d) => d.status_veljavnosti === 'veljaven').length}/{delavec.dokumenti.length}</p>
          <p className="text-[10px] text-blue-600 font-medium">Velj. dokumentov</p>
        </div>
        <div className="bg-purple-50 rounded-lg px-3 py-2 text-center">
          <p className="text-lg font-bold text-purple-700">{(delavec.delovna_zgodovina || []).length}</p>
          <p className="text-[10px] text-purple-600 font-medium">Projektov</p>
        </div>
        <div className="bg-emerald-50 rounded-lg px-3 py-2 text-center">
          <p className="text-lg font-bold text-emerald-700">
            {latestHealth ? (latestHealth.rezultat === 'sposoben' ? '✓' : latestHealth.rezultat === 'pogojno_sposoben' ? '~' : '✗') : '—'}
          </p>
          <p className="text-[10px] text-emerald-600 font-medium">Zdravje</p>
        </div>
        <div className="bg-amber-50 rounded-lg px-3 py-2 text-center">
          <p className="text-lg font-bold text-amber-700">{workerTrips.length}</p>
          <p className="text-[10px] text-amber-600 font-medium">Potovanj</p>
        </div>
      </div>

      {/* Documents summary */}
      {delavec.dokumenti.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Dokumenti</p>
          <div className="space-y-1.5">
            {delavec.dokumenti.map((doc) => {
              const days = daysUntilExpiry(doc.datum_poteka);
              return (
                <div key={doc.id} className="flex items-center justify-between text-sm px-2 py-1.5 rounded bg-muted/50">
                  <div className="flex items-center gap-2 min-w-0">
                    <Shield className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    <span className="truncate">{doc.naziv}</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <StatusBadge status={doc.status_veljavnosti} />
                    {doc.datum_poteka && (
                      <span className={`text-xs ${validityColor(days)}`}>{fmtDate(doc.datum_poteka)}</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Work history */}
      {(delavec.delovna_zgodovina || []).length > 0 && (
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Delovna zgodovina</p>
          <div className="space-y-1.5">
            {(delavec.delovna_zgodovina || []).slice(0, 4).map((entry) => (
              <div key={entry.id} className="flex items-center justify-between text-sm px-2 py-1.5 rounded bg-muted/50">
                <div className="flex items-center gap-2 min-w-0">
                  <Briefcase className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  <span className="truncate">{entry.projekt_naziv}</span>
                  <span className="text-xs text-muted-foreground shrink-0">{entry.vloga}</span>
                </div>
                <span className="text-xs text-muted-foreground shrink-0">
                  {fmtDate(entry.od)} — {entry.do ? fmtDate(entry.do) : 'danes'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Health checks */}
      {(delavec.zdravniski_pregledi || []).length > 0 && (
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Zdravniški pregledi</p>
          <div className="space-y-1.5">
            {(delavec.zdravniski_pregledi || []).slice(0, 3).map((hc) => (
              <div key={hc.id} className="flex items-center justify-between text-sm px-2 py-1.5 rounded bg-muted/50">
                <div className="flex items-center gap-2 min-w-0">
                  <Heart className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  <span className="truncate">{hc.tip_pregleda}</span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Badge variant={hc.rezultat === 'sposoben' ? 'success' : hc.rezultat === 'pogojno_sposoben' ? 'warning' : 'destructive'} className="text-[10px]">
                    {hc.rezultat === 'sposoben' ? 'Sposoben' : hc.rezultat === 'pogojno_sposoben' ? 'Pogojno' : 'Nesposoben'}
                  </Badge>
                  <span className="text-xs text-muted-foreground">{fmtDate(hc.datum_pregleda)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Photos count */}
      {(delavec.fotografije || []).length > 0 && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Camera className="h-4 w-4" />
          <span>{(delavec.fotografije || []).length} fotografij varilskih del</span>
        </div>
      )}

      {/* Vehicle trips */}
      {workerTrips.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Zadnja potovanja</p>
          <div className="space-y-1.5">
            {[...workerTrips].sort((a, b) => new Date(b.datum).getTime() - new Date(a.datum).getTime()).slice(0, 3).map((trip) => (
              <div key={trip.id} className="flex items-center justify-between text-sm px-2 py-1.5 rounded bg-muted/50">
                <div className="flex items-center gap-2 min-w-0">
                  <Car className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  <span className="truncate">{trip.od_lokacija} → {trip.do_lokacija}</span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs text-muted-foreground">{trip.vozilo_naziv}</span>
                  <Badge variant="outline" className="text-[10px]">{trip.kilometri} km</Badge>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <Link to={ROUTES.DELAVEC_DETAIL(delavec.id)}>
        <Button variant="outline" size="sm" className="w-full gap-1.5">
          Odpri celoten profil <ArrowRight className="h-3.5 w-3.5" />
        </Button>
      </Link>
    </div>
  );
}

/* ─── Vehicle quick-view card ─── */
function VehicleQuickView({ vozilo }: { vozilo: Vehicle }): React.JSX.Element {
  const { potovanja } = useVehiclesStore();
  const vehicleTrips = potovanja.filter((t) => t.vozilo_id === vozilo.id);
  const totalKm = vehicleTrips.reduce((sum, t) => sum + t.kilometri, 0);
  const uniqueDrivers = new Map<number, string>();
  const uniqueProjects = new Map<number, string>();
  const locations = new Set<string>();

  for (const trip of vehicleTrips) {
    uniqueDrivers.set(trip.voznik_id, trip.voznik_ime);
    if (trip.projekt_id && trip.projekt_naziv) {
      uniqueProjects.set(trip.projekt_id, trip.projekt_naziv);
    }
    locations.add(trip.od_lokacija);
    locations.add(trip.do_lokacija);
  }

  return (
    <div className="space-y-4">
      {/* Vehicle header */}
      <div className="flex gap-4">
        <div className="h-16 w-16 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
          <Car className="h-8 w-8 text-blue-600" />
        </div>
        <div className="min-w-0 space-y-1.5">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-lg font-bold">{vozilo.naziv}</h3>
            <Badge variant={vozilo.tip === 'lastno' ? 'success' : 'accent'}>
              {vozilo.tip === 'lastno' ? 'Lastno' : 'Rent-a-car'}
            </Badge>
          </div>
          <p className="text-sm font-mono text-muted-foreground">{vozilo.registrska}</p>
          {vozilo.opombe && <p className="text-sm text-muted-foreground">{vozilo.opombe}</p>}
        </div>
      </div>

      {/* Rental info */}
      {vozilo.tip === 'najem' && (
        <div className="bg-purple-50 rounded-lg px-4 py-3 space-y-2">
          <p className="text-xs font-semibold text-purple-700 uppercase tracking-wider">Podatki o najemu</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
            <div>
              <span className="text-muted-foreground">Najemodajalec: </span>
              <span className="font-medium">{vozilo.najemodajalec || '—'}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Obdobje: </span>
              <span className="font-medium">
                {vozilo.datum_najema_od ? fmtDate(vozilo.datum_najema_od) : '—'} — {vozilo.datum_najema_do ? fmtDate(vozilo.datum_najema_do) : '—'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Quick stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-blue-50 rounded-lg px-3 py-2 text-center">
          <p className="text-lg font-bold text-blue-700">{vehicleTrips.length}</p>
          <p className="text-[10px] text-blue-600 font-medium">Potovanj</p>
        </div>
        <div className="bg-amber-50 rounded-lg px-3 py-2 text-center">
          <p className="text-lg font-bold text-amber-700">{totalKm.toLocaleString('sl-SI')}</p>
          <p className="text-[10px] text-amber-600 font-medium">Kilometrov</p>
        </div>
        <div className="bg-emerald-50 rounded-lg px-3 py-2 text-center">
          <p className="text-lg font-bold text-emerald-700">{uniqueDrivers.size}</p>
          <p className="text-[10px] text-emerald-600 font-medium">Voznikov</p>
        </div>
        <div className="bg-purple-50 rounded-lg px-3 py-2 text-center">
          <p className="text-lg font-bold text-purple-700">{uniqueProjects.size}</p>
          <p className="text-[10px] text-purple-600 font-medium">Projektov</p>
        </div>
      </div>

      {/* Drivers */}
      {uniqueDrivers.size > 0 && (
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Vozniki</p>
          <div className="space-y-1.5">
            {Array.from(uniqueDrivers.entries()).map(([dId, dName]) => {
              const dTrips = vehicleTrips.filter((t) => t.voznik_id === dId);
              const dKm = dTrips.reduce((s, t) => s + t.kilometri, 0);
              return (
                <Link key={dId} to={ROUTES.DELAVEC_DETAIL(dId)} className="block">
                  <div className="flex items-center justify-between text-sm px-2 py-1.5 rounded bg-muted/50 hover:bg-muted transition-colors">
                    <div className="flex items-center gap-2 min-w-0">
                      <User className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      <span className="truncate font-medium">{dName}</span>
                    </div>
                    <span className="text-xs text-muted-foreground shrink-0">{dTrips.length}× · {dKm.toLocaleString('sl-SI')} km</span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Trip history */}
      {vehicleTrips.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Zgodovina potovanj</p>
          <div className="space-y-1.5">
            {[...vehicleTrips].sort((a, b) => new Date(b.datum).getTime() - new Date(a.datum).getTime()).slice(0, 5).map((trip) => (
              <div key={trip.id} className="flex items-center justify-between text-sm px-2 py-1.5 rounded bg-muted/50">
                <div className="flex items-center gap-2 min-w-0">
                  <MapPin className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  <span className="truncate">{trip.od_lokacija} → {trip.do_lokacija}</span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs text-muted-foreground">{trip.voznik_ime}</span>
                  <span className="text-xs text-muted-foreground">{fmtDate(trip.datum)}</span>
                  <Badge variant="outline" className="text-[10px]">{trip.kilometri} km</Badge>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Locations */}
      {locations.size > 0 && (
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Lokacije / Gradbišča</p>
          <div className="flex flex-wrap gap-1.5">
            {Array.from(locations).map((loc) => (
              <Badge key={loc} variant="outline" className="text-xs gap-1">
                <MapPin className="h-3 w-3" />{loc}
              </Badge>
            ))}
          </div>
        </div>
      )}

      <Link to={ROUTES.VOZILO_DETAIL(vozilo.id)}>
        <Button variant="outline" size="sm" className="w-full gap-1.5">
          Odpri celotno kartico vozila <ArrowRight className="h-3.5 w-3.5" />
        </Button>
      </Link>
    </div>
  );
}

/* ─── Project quick-view card ─── */
function ProjectQuickView({ projekt }: { projekt: Project }): React.JSX.Element {
  const budget = sumBudget(projekt.proracun);
  const actual = sumBudget(projekt.dejanski_stroski);
  const percentage = budget > 0 ? Math.round((actual / budget) * 100) : 0;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex gap-4">
        <div className="h-16 w-16 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
          <FolderKanban className="h-8 w-8 text-emerald-600" />
        </div>
        <div className="min-w-0 space-y-1.5">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-lg font-bold">{projekt.naziv}</h3>
            <span className={`px-2 py-0.5 rounded text-xs font-semibold ${getPhaseColor(projekt.faza)}`}>
              {getPhaseName(projekt.faza)}
            </span>
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
            <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{projekt.lokacija}, {projekt.drzava}</span>
            <span className="flex items-center gap-1"><Building2 className="h-3.5 w-3.5" />{projekt.narocnik}</span>
            <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" />{fmtDate(projekt.zacetek)} — {fmtDate(projekt.konec)}</span>
          </div>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-emerald-50 rounded-lg px-3 py-2 text-center">
          <p className="text-lg font-bold text-emerald-700">{projekt.napredek}%</p>
          <p className="text-[10px] text-emerald-600 font-medium">Napredek</p>
        </div>
        <div className="bg-blue-50 rounded-lg px-3 py-2 text-center">
          <p className="text-lg font-bold text-blue-700">{formatEur(budget)}</p>
          <p className="text-[10px] text-blue-600 font-medium">Proračun</p>
        </div>
        <div className={`rounded-lg px-3 py-2 text-center ${percentage > 90 ? 'bg-red-50' : 'bg-amber-50'}`}>
          <p className={`text-lg font-bold ${percentage > 90 ? 'text-red-700' : 'text-amber-700'}`}>{formatEur(actual)}</p>
          <p className={`text-[10px] font-medium ${percentage > 90 ? 'text-red-600' : 'text-amber-600'}`}>Dejanski ({percentage}%)</p>
        </div>
        <div className="bg-purple-50 rounded-lg px-3 py-2 text-center">
          <p className="text-lg font-bold text-purple-700">{projekt.razporeditve.length}</p>
          <p className="text-[10px] text-purple-600 font-medium">Delavcev</p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="space-y-1">
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Napredek projekta</span>
          <span>{projekt.napredek}%</span>
        </div>
        <Progress value={projekt.napredek} className="h-2.5 [&>div]:bg-emerald-500" />
      </div>

      {/* Workers on project */}
      {projekt.razporeditve.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Razporejeni delavci</p>
          <div className="space-y-1.5">
            {projekt.razporeditve.map((r) => (
              <Link key={r.id} to={ROUTES.DELAVEC_DETAIL(r.delavec_id)} className="block">
                <div className="flex items-center justify-between text-sm px-2 py-1.5 rounded bg-muted/50 hover:bg-muted transition-colors">
                  <div className="flex items-center gap-2 min-w-0">
                    <User className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    <span className="truncate font-medium">{r.delavec_ime}</span>
                    {r.vloga && <Badge variant="outline" className="text-[10px]">{r.vloga}</Badge>}
                  </div>
                  <span className="text-xs text-muted-foreground shrink-0">od {fmtDate(r.od)}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Partners */}
      {projekt.partnerji.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Partnerji</p>
          <div className="space-y-1.5">
            {projekt.partnerji.map((p) => (
              <div key={p.id} className="flex items-center justify-between text-sm px-2 py-1.5 rounded bg-muted/50">
                <div className="flex items-center gap-2 min-w-0">
                  <Building2 className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  <span className="truncate font-medium">{p.naziv}</span>
                </div>
                <Badge variant={p.status === 'aktiven' ? 'success' : 'warning'} className="text-[10px] shrink-0">
                  {p.status === 'aktiven' ? 'Aktiven' : 'V dogovoru'}
                </Badge>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Notes */}
      {projekt.opombe && (
        <div className="bg-muted/30 rounded-lg px-3 py-2 text-sm text-muted-foreground italic">
          {projekt.opombe}
        </div>
      )}

      <Link to={ROUTES.PROJEKT_DETAIL(projekt.id)}>
        <Button variant="outline" size="sm" className="w-full gap-1.5">
          Odpri celoten projekt <ArrowRight className="h-3.5 w-3.5" />
        </Button>
      </Link>
    </div>
  );
}

/* ─── Category filter button ─── */
function CategoryButton({
  active,
  onClick,
  icon,
  label,
  count,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  count?: number;
}): React.JSX.Element {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all
        ${active
          ? 'bg-primary text-primary-foreground shadow-sm'
          : 'bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground'
        }
      `}
    >
      {icon}
      {label}
      {count !== undefined && count > 0 && (
        <span className={`ml-0.5 text-xs ${active ? 'text-primary-foreground/80' : 'text-muted-foreground'}`}>
          ({count})
        </span>
      )}
    </button>
  );
}

/* ─── Main Dashboard ─── */
export function DashboardPage(): React.JSX.Element {
  const { delavci } = useWorkersStore();
  const { projekti } = useProjectsStore();
  const { stroski } = useExpensesStore();
  const { kandidati } = usePipelineStore();
  const { vozila, potovanja } = useVehiclesStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [searchCategory, setSearchCategory] = useState<SearchCategory>('vse');
  const [selectedResult, setSelectedResult] = useState<{ type: 'delavec' | 'vozilo' | 'projekt'; id: number } | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);

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

  // Search results for the central command search
  const searchResults = useMemo(() => {
    const q = searchQuery.toLowerCase();
    const isFiltering = q.length >= 2;

    const workers = isFiltering
      ? delavci.filter((d) => {
          const fullName = `${d.ime} ${d.priimek}`.toLowerCase();
          return fullName.includes(q)
            || d.narodnost.toLowerCase().includes(q)
            || d.telefon.includes(q)
            || d.tipi_varjenja.some((t) => t.toLowerCase().includes(q));
        })
      : delavci;

    const vehicles = isFiltering
      ? vozila.filter((v) =>
          v.naziv.toLowerCase().includes(q) ||
          v.registrska.toLowerCase().includes(q) ||
          (v.najemodajalec && v.najemodajalec.toLowerCase().includes(q))
        )
      : vozila;

    const projects = isFiltering
      ? projekti.filter((p) =>
          p.naziv.toLowerCase().includes(q) ||
          p.lokacija.toLowerCase().includes(q) ||
          p.narocnik.toLowerCase().includes(q) ||
          p.drzava.toLowerCase().includes(q)
        )
      : projekti;

    return { workers, vehicles, projects };
  }, [searchQuery, delavci, vozila, projekti]);

  // Filtered by category
  const filteredResults = useMemo(() => {
    return {
      workers: searchCategory === 'vse' || searchCategory === 'delavci' ? searchResults.workers : [],
      vehicles: searchCategory === 'vse' || searchCategory === 'vozila' ? searchResults.vehicles : [],
      projects: searchCategory === 'vse' || searchCategory === 'projekti' ? searchResults.projects : [],
    };
  }, [searchResults, searchCategory]);

  const totalResults = filteredResults.workers.length + filteredResults.vehicles.length + filteredResults.projects.length;
  const isSearching = searchQuery.length >= 2;

  function handleSelectWorker(id: number) {
    setSelectedResult({ type: 'delavec', id });
  }
  function handleSelectVehicle(id: number) {
    setSelectedResult({ type: 'vozilo', id });
  }
  function handleSelectProject(id: number) {
    setSelectedResult({ type: 'projekt', id });
  }
  function clearSearch() {
    setSearchQuery('');
    setSelectedResult(null);
  }

  const selectedWorker = selectedResult?.type === 'delavec' ? delavci.find((d) => d.id === selectedResult.id) : undefined;
  const selectedVehicle = selectedResult?.type === 'vozilo' ? vozila.find((v) => v.id === selectedResult.id) : undefined;
  const selectedProject = selectedResult?.type === 'projekt' ? projekti.find((p) => p.id === selectedResult.id) : undefined;

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
            opis: doc.datum_poteka ? `Potekel dne ${fmtDate(doc.datum_poteka)}` : 'TRC je potekel',
            povezava: ROUTES.DELAVEC_DETAIL(delavec.id),
          });
        }

        if (doc.tip === 'trc' && doc.status_veljavnosti === 'poteka_kmalu') {
          result.push({
            id: `trc-warn-${delavec.id}-${doc.id}`,
            tip: 'trc_poteka',
            resnost: 'opozorilo',
            naslov: `TRC poteka kmalu: ${fullName}`,
            opis: doc.datum_poteka ? `Poteka dne ${fmtDate(doc.datum_poteka)}` : 'TRC poteka kmalu',
            povezava: ROUTES.DELAVEC_DETAIL(delavec.id),
          });
        }

        if (doc.tip === 'varilski_certifikat' && doc.status_veljavnosti === 'potekel') {
          result.push({
            id: `cert-exp-${delavec.id}-${doc.id}`,
            tip: 'certifikat_potekel',
            resnost: 'kriticno',
            naslov: `Certifikat potekel: ${fullName}`,
            opis: doc.datum_poteka ? `Potekel dne ${fmtDate(doc.datum_poteka)}` : 'Varilski certifikat je potekel',
            povezava: ROUTES.DELAVEC_DETAIL(delavec.id),
          });
        }

        if (doc.tip === 'varilski_certifikat' && doc.status_veljavnosti === 'poteka_kmalu') {
          result.push({
            id: `cert-warn-${delavec.id}-${doc.id}`,
            tip: 'certifikat_poteka',
            resnost: 'opozorilo',
            naslov: `Certifikat poteka kmalu: ${fullName}`,
            opis: doc.datum_poteka ? `Poteka dne ${fmtDate(doc.datum_poteka)}` : 'Varilski certifikat poteka kmalu',
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

  // Monthly expense chart data
  const monthlyExpenseData = useMemo(() => {
    const months: Record<string, Record<string, number>> = {};

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

  // Recent pipeline candidates
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

      {/* ═══════════════════════════════════════════════════════ */}
      {/* Central Command Search */}
      {/* ═══════════════════════════════════════════════════════ */}
      <Card className="border-2 border-primary/20 bg-gradient-to-r from-blue-50/50 to-white">
        <CardContent className="pt-6 pb-4">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Search className="h-6 w-6 text-primary" />
              <div>
                <h2 className="text-lg font-semibold">Iskanje po bazi podatkov</h2>
                <p className="text-sm text-muted-foreground">Vpišite ime delavca, vozila, projekta ali registrsko številko</p>
              </div>
            </div>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                ref={searchRef}
                placeholder="Vpišite ime delavca, vozila ali projekta..."
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setSelectedResult(null); }}
                className="pl-12 h-12 text-base bg-white border-2 focus-visible:ring-primary/20"
              />
              {searchQuery && (
                <button type="button" onClick={clearSearch} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  <X className="h-5 w-5" />
                </button>
              )}
            </div>

            {/* Category filter tabs */}
            <div className="flex flex-wrap gap-2">
              <CategoryButton
                active={searchCategory === 'vse'}
                onClick={() => { setSearchCategory('vse'); setSelectedResult(null); }}
                icon={<Layers className="h-3.5 w-3.5" />}
                label="Vse"
                count={isSearching ? searchResults.workers.length + searchResults.vehicles.length + searchResults.projects.length : undefined}
              />
              <CategoryButton
                active={searchCategory === 'delavci'}
                onClick={() => { setSearchCategory('delavci'); setSelectedResult(null); }}
                icon={<User className="h-3.5 w-3.5" />}
                label="Delavci"
                count={searchResults.workers.length}
              />
              <CategoryButton
                active={searchCategory === 'vozila'}
                onClick={() => { setSearchCategory('vozila'); setSelectedResult(null); }}
                icon={<Car className="h-3.5 w-3.5" />}
                label="Vozila"
                count={searchResults.vehicles.length}
              />
              <CategoryButton
                active={searchCategory === 'projekti'}
                onClick={() => { setSearchCategory('projekti'); setSelectedResult(null); }}
                icon={<FolderKanban className="h-3.5 w-3.5" />}
                label="Projekti"
                count={searchResults.projects.length}
              />
            </div>

            {/* Results area */}
            <div className="space-y-4">
              {isSearching && totalResults === 0 && (
                <p className="text-center text-muted-foreground py-4">Ni rezultatov za &quot;<span className="font-medium">{searchQuery}</span>&quot;</p>
              )}

              {/* Show results: either search results or browse-all */}
              {!selectedResult && (
                <>
                  {/* Worker results */}
                  {filteredResults.workers.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
                        <User className="h-3.5 w-3.5" />Delavci ({filteredResults.workers.length})
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {filteredResults.workers.map((d) => (
                          <button
                            key={d.id}
                            type="button"
                            onClick={() => handleSelectWorker(d.id)}
                            className="flex items-center gap-3 p-3 rounded-lg border bg-white hover:bg-accent/50 transition-colors text-left w-full"
                          >
                            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary text-sm font-bold shrink-0">
                              {getInitials(d.ime, d.priimek)}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium truncate">{d.ime} {d.priimek}</p>
                              <p className="text-xs text-muted-foreground truncate">{d.narodnost} · {d.tipi_varjenja.join(', ')}</p>
                            </div>
                            <StatusBadge status={d.status} />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Vehicle results */}
                  {filteredResults.vehicles.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
                        <Car className="h-3.5 w-3.5" />Vozila ({filteredResults.vehicles.length})
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {filteredResults.vehicles.map((v) => (
                          <button
                            key={v.id}
                            type="button"
                            onClick={() => handleSelectVehicle(v.id)}
                            className="flex items-center gap-3 p-3 rounded-lg border bg-white hover:bg-accent/50 transition-colors text-left w-full"
                          >
                            <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                              <Car className="h-5 w-5 text-blue-600" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium truncate">{v.naziv}</p>
                              <p className="text-xs text-muted-foreground font-mono">{v.registrska}</p>
                            </div>
                            <Badge variant={v.tip === 'lastno' ? 'success' : 'accent'} className="text-[10px] shrink-0">
                              {v.tip === 'lastno' ? 'Lastno' : 'Najem'}
                            </Badge>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Project results */}
                  {filteredResults.projects.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
                        <FolderKanban className="h-3.5 w-3.5" />Projekti ({filteredResults.projects.length})
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {filteredResults.projects.map((p) => (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() => handleSelectProject(p.id)}
                            className="flex items-center gap-3 p-3 rounded-lg border bg-white hover:bg-accent/50 transition-colors text-left w-full"
                          >
                            <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                              <FolderKanban className="h-5 w-5 text-emerald-600" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium truncate">{p.naziv}</p>
                              <p className="text-xs text-muted-foreground truncate">{p.lokacija}, {p.drzava} · {p.narocnik}</p>
                            </div>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-semibold shrink-0 ${getPhaseColor(p.faza)}`}>
                              {getPhaseName(p.faza)}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* Inline detail view */}
              {selectedResult && (selectedWorker || selectedVehicle || selectedProject) && (
                <Card className="border-2 border-primary/10 bg-white">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between mb-4">
                      <button
                        type="button"
                        onClick={() => setSelectedResult(null)}
                        className="text-sm text-primary hover:underline flex items-center gap-1"
                      >
                        ← Nazaj na rezultate
                      </button>
                    </div>
                    {selectedWorker && <WorkerQuickView delavec={selectedWorker} />}
                    {selectedVehicle && <VehicleQuickView vozilo={selectedVehicle} />}
                    {selectedProject && <ProjectQuickView projekt={selectedProject} />}
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

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
            <CardTitle className="text-sm font-medium">Vozila</CardTitle>
            <Car className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{vozila.length}</div>
            <p className="text-xs text-muted-foreground">
              {potovanja.length} potovanj · {potovanja.reduce((s, t) => s + t.kilometri, 0).toLocaleString('sl-SI')} km
            </p>
          </CardContent>
          <CardFooter className="pt-0">
            <Link to={ROUTES.VOZILA} className="text-xs text-primary hover:underline inline-flex items-center gap-1">
              Pregled vozil <ArrowRight className="h-3 w-3" />
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
                      <Badge variant="destructive">Kritično</Badge>
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
                        {fmtDate(kandidat.pricakovani_prihod)}
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
