import { useMemo } from 'react';
import {
  UserPlus,
  FileText,
  Stamp,
  Plane,
  UserCheck,
  Clock,
  Wallet,
  RefreshCw,
  ArrowRight,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { useWorkersStore } from '@/stores/workersStore';
import { useProjectsStore } from '@/stores/projectsStore';
import { useExpensesStore } from '@/stores/expensesStore';
import { usePipelineStore } from '@/stores/pipelineStore';
import { daysUntilExpiry, totalBudget } from '@/lib/utils';
import { ALERT_THRESHOLDS } from '@/lib/constants';
import type { Worker, Project, Expense, PipelineCandidate } from '@/types';

const PROCESS_STEPS = [
  { label: 'Rekrutacija', icon: UserPlus, key: 'recruitment' },
  { label: 'Dokumenti', icon: FileText, key: 'documents' },
  { label: 'Vizum', icon: Stamp, key: 'visa' },
  { label: 'Prihod', icon: Plane, key: 'arrival' },
  { label: 'Dodelitev', icon: UserCheck, key: 'assignment' },
  { label: 'Sledenje', icon: Clock, key: 'tracking' },
  { label: 'Finance', icon: Wallet, key: 'finance' },
  { label: 'Obnova', icon: RefreshCw, key: 'renewal' },
] as const;

type HealthStatus = 'green' | 'amber' | 'red';

function computeStepHealth(
  key: string,
  delavci: Worker[],
  projekti: Project[],
  kandidati: PipelineCandidate[],
  _stroski: Expense[],
): HealthStatus {
  switch (key) {
    case 'recruitment': {
      const activeCandidates = kandidati.filter(
        (k) => k.faza !== 'prispel',
      ).length;
      if (activeCandidates === 0) return 'amber';
      return 'green';
    }
    case 'documents': {
      const expiredDocs = delavci.flatMap((d) =>
        d.dokumenti.filter((doc) => {
          const days = daysUntilExpiry(doc.datum_poteka);
          return days !== null && days < 0;
        }),
      );
      if (expiredDocs.length > 0) return 'red';
      const warningDocs = delavci.flatMap((d) =>
        d.dokumenti.filter((doc) => {
          const days = daysUntilExpiry(doc.datum_poteka);
          return days !== null && days <= ALERT_THRESHOLDS.TRC_WARNING_DAYS;
        }),
      );
      if (warningDocs.length > 0) return 'amber';
      return 'green';
    }
    case 'visa': {
      const visaStages = kandidati.filter(
        (k) => k.faza === 'vizum_vlozen',
      );
      const stuckVisa = visaStages.length;
      if (stuckVisa > 3) return 'red';
      if (stuckVisa > 0) return 'amber';
      return 'green';
    }
    case 'arrival': {
      const pendingArrival = kandidati.filter(
        (k) => k.faza === 'vizum_odobren',
      );
      if (pendingArrival.length > 3) return 'amber';
      return 'green';
    }
    case 'assignment': {
      const unassigned = delavci.filter(
        (d) => d.status === 'zaposlen' && d.trenutni_projekt_id === null,
      );
      if (unassigned.length > 3) return 'red';
      if (unassigned.length > 0) return 'amber';
      return 'green';
    }
    case 'tracking': {
      const activeProjects = projekti.filter((p) => p.faza === 'aktiven');
      const behindSchedule = activeProjects.filter((p) => p.napredek < 30);
      if (behindSchedule.length > 0) return 'amber';
      return 'green';
    }
    case 'finance': {
      const overBudget = projekti.some((p) => {
        const actual = totalBudget(p.dejanski_stroski);
        const planned = totalBudget(p.proracun);
        return planned > 0 && actual / planned > ALERT_THRESHOLDS.BUDGET_DANGER_PCT;
      });
      if (overBudget) return 'red';
      const warningBudget = projekti.some((p) => {
        const actual = totalBudget(p.dejanski_stroski);
        const planned = totalBudget(p.proracun);
        return planned > 0 && actual / planned > ALERT_THRESHOLDS.BUDGET_WARNING_PCT;
      });
      if (warningBudget) return 'amber';
      return 'green';
    }
    case 'renewal': {
      const trcExpiring = delavci.flatMap((d) =>
        d.dokumenti.filter((doc) => {
          if (doc.tip !== 'trc') return false;
          const days = daysUntilExpiry(doc.datum_poteka);
          return days !== null && days <= ALERT_THRESHOLDS.TRC_WARNING_DAYS;
        }),
      );
      if (trcExpiring.some((doc) => {
        const days = daysUntilExpiry(doc.datum_poteka);
        return days !== null && days < 0;
      })) return 'red';
      if (trcExpiring.length > 0) return 'amber';
      return 'green';
    }
    default:
      return 'green';
  }
}

const HEALTH_COLORS: Record<HealthStatus, string> = {
  green: 'bg-emerald-500',
  amber: 'bg-amber-500',
  red: 'bg-red-500',
};

export function ProcessDiagram(): React.JSX.Element {
  const { delavci } = useWorkersStore();
  const { projekti } = useProjectsStore();
  const { stroski } = useExpensesStore();
  const { kandidati } = usePipelineStore();

  const stepsWithHealth = useMemo(() => {
    return PROCESS_STEPS.map((step) => ({
      ...step,
      health: computeStepHealth(step.key, delavci, projekti, kandidati, stroski),
    }));
  }, [delavci, projekti, kandidati, stroski]);

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
      {stepsWithHealth.map((step, index) => {
        const Icon = step.icon;
        return (
          <div key={step.key} className="flex items-center gap-1">
            <Card className="flex-1 hover:shadow-md transition-shadow">
              <CardContent className="p-3 flex flex-col items-center gap-2 text-center">
                <div className="relative">
                  <Icon className="h-6 w-6 text-muted-foreground" />
                  <span
                    className={`absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full ${HEALTH_COLORS[step.health]}`}
                  />
                </div>
                <span className="text-xs font-medium leading-tight">
                  {step.label}
                </span>
              </CardContent>
            </Card>
            {index < PROCESS_STEPS.length - 1 && (
              <ArrowRight className="h-3 w-3 text-muted-foreground shrink-0 hidden lg:block" />
            )}
          </div>
        );
      })}
    </div>
  );
}
