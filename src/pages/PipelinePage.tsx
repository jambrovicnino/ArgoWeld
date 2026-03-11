import { useMemo } from 'react';
import {
  Users,
  UserPlus,
  FileCheck,
  Clock,
  CheckCircle2,
  Circle,
  ArrowRight,
  Wrench,
  Globe,
  FileText,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { usePipelineStore } from '@/stores/pipelineStore';
import { PIPELINE_STAGES } from '@/lib/constants';
import { formatDate } from '@/lib/utils';
import type { PipelineCandidate, PipelineStage } from '@/types';

function getStageBadgeVariant(
  faza: PipelineStage
): 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning' | 'accent' {
  switch (faza) {
    case 'zainteresiran':
      return 'secondary';
    case 'test_nacrtrovan':
      return 'accent';
    case 'test_opravljen':
      return 'accent';
    case 'zbiranje_dokumentov':
      return 'warning';
    case 'vizum_vlozen':
      return 'warning';
    case 'vizum_odobren':
      return 'success';
    case 'prispel':
      return 'success';
    default:
      return 'outline';
  }
}

function daysUntilArrival(dateStr: string): number {
  const target = new Date(dateStr);
  return Math.ceil((target.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

function formatArrivalLabel(dateStr: string): string {
  const days = daysUntilArrival(dateStr);
  if (days < 0) return `Prispel pred ${Math.abs(days)} dnevi`;
  if (days === 0) return 'Danes';
  if (days === 1) return 'Jutri';
  return `Cez ${days} dni`;
}

function getArrivalColor(dateStr: string): string {
  const days = daysUntilArrival(dateStr);
  if (days < 0) return 'text-emerald-600';
  if (days <= 7) return 'text-red-600';
  if (days <= 30) return 'text-amber-600';
  return 'text-muted-foreground';
}

function countDocumentsReceived(kandidat: PipelineCandidate): number {
  return kandidat.dokumenti.filter((d) => d.prejeto).length;
}

function getDocProgressPercent(kandidat: PipelineCandidate): number {
  if (kandidat.dokumenti.length === 0) return 0;
  return Math.round((countDocumentsReceived(kandidat) / kandidat.dokumenti.length) * 100);
}

function getDocProgressColor(percent: number): string {
  if (percent === 100) return '[&>div]:bg-emerald-500';
  if (percent >= 50) return '[&>div]:bg-amber-500';
  return '[&>div]:bg-red-400';
}

interface StageSummaryProps {
  kandidati: PipelineCandidate[];
}

function StageSummary({ kandidati }: StageSummaryProps): React.JSX.Element {
  const stageCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const stage of PIPELINE_STAGES) {
      counts.set(stage.value, 0);
    }
    for (const k of kandidati) {
      counts.set(k.faza, (counts.get(k.faza) ?? 0) + 1);
    }
    return counts;
  }, [kandidati]);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Faze pipeline-a</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-1 overflow-x-auto pb-2">
          {PIPELINE_STAGES.map((stage, index) => {
            const count = stageCounts.get(stage.value) ?? 0;
            return (
              <div key={stage.value} className="flex items-center">
                <div className="flex flex-col items-center min-w-[100px]">
                  <div
                    className={`${stage.color} text-white rounded-lg px-3 py-2 text-center w-full`}
                  >
                    <div className="text-lg font-bold">{count}</div>
                    <div className="text-[10px] leading-tight font-medium opacity-90">
                      {stage.label}
                    </div>
                  </div>
                </div>
                {index < PIPELINE_STAGES.length - 1 && (
                  <ArrowRight className="h-4 w-4 text-muted-foreground mx-1 shrink-0" />
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

interface StatsCardsProps {
  kandidati: PipelineCandidate[];
}

function StatsCards({ kandidati }: StatsCardsProps): React.JSX.Element {
  const totalKandidati = kandidati.length;

  const closestArrivals = useMemo(() => {
    return [...kandidati]
      .filter((k) => k.faza !== 'prispel')
      .sort(
        (a, b) =>
          new Date(a.pricakovani_prihod).getTime() - new Date(b.pricakovani_prihod).getTime()
      )
      .slice(0, 3);
  }, [kandidati]);

  const totalDocs = useMemo(() => {
    let received = 0;
    let total = 0;
    for (const k of kandidati) {
      for (const d of k.dokumenti) {
        total++;
        if (d.prejeto) received++;
      }
    }
    return { received, total };
  }, [kandidati]);

  const arrivedCount = kandidati.filter((k) => k.faza === 'prispel').length;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Skupaj kandidatov</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalKandidati}</div>
          <p className="text-xs text-muted-foreground">v vseh fazah pipeline-a</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Prispeli</CardTitle>
          <CheckCircle2 className="h-4 w-4 text-emerald-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{arrivedCount}</div>
          <p className="text-xs text-muted-foreground">
            od {totalKandidati} kandidatov
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Dokumentacija</CardTitle>
          <FileCheck className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {totalDocs.received}/{totalDocs.total}
          </div>
          <p className="text-xs text-muted-foreground">prejetih dokumentov</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Najblizji prihod</CardTitle>
          <Clock className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          {closestArrivals.length > 0 ? (
            <div>
              <div className="text-2xl font-bold">
                {formatDate(closestArrivals[0].pricakovani_prihod)}
              </div>
              <p className="text-xs text-muted-foreground">
                {closestArrivals[0].ime} {closestArrivals[0].priimek}
              </p>
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">Ni prihajajocih</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

interface CandidateCardProps {
  kandidat: PipelineCandidate;
  onToggleDoc: (candidateId: number, docTip: string) => void;
}

function CandidateCard({ kandidat, onToggleDoc }: CandidateCardProps): React.JSX.Element {
  const received = countDocumentsReceived(kandidat);
  const total = kandidat.dokumenti.length;
  const progressPercent = getDocProgressPercent(kandidat);

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <CardTitle className="text-base">
              {kandidat.ime} {kandidat.priimek}
            </CardTitle>
            <div className="flex items-center gap-3 mt-1.5 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-1">
                <Globe className="h-3.5 w-3.5" />
                {kandidat.narodnost}
              </span>
              <span className="inline-flex items-center gap-1">
                <Wrench className="h-3.5 w-3.5" />
                {kandidat.tipi_varjenja.join(', ')}
              </span>
            </div>
          </div>
          <Badge variant={getStageBadgeVariant(kandidat.faza)} className="shrink-0">
            {PIPELINE_STAGES.find((s) => s.value === kandidat.faza)?.label ?? kandidat.faza}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Expected arrival */}
        <div className="flex items-center justify-between text-sm">
          <span className="flex items-center gap-1.5 text-muted-foreground">
            <Clock className="h-3.5 w-3.5" />
            Pricakovani prihod
          </span>
          <div className="text-right">
            <span className="font-medium">{formatDate(kandidat.pricakovani_prihod)}</span>
            <span className={`ml-2 text-xs ${getArrivalColor(kandidat.pricakovani_prihod)}`}>
              {formatArrivalLabel(kandidat.pricakovani_prihod)}
            </span>
          </div>
        </div>

        {/* Notes */}
        {kandidat.opombe && (
          <p className="text-xs text-muted-foreground bg-muted/50 rounded-md px-3 py-2">
            {kandidat.opombe}
          </p>
        )}

        {/* Document progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <FileText className="h-3.5 w-3.5" />
              Dokumenti
            </span>
            <span className="text-xs font-medium">
              {received}/{total} prejetih
            </span>
          </div>
          <Progress
            value={progressPercent}
            className={`h-2 ${getDocProgressColor(progressPercent)}`}
          />
        </div>

        {/* Document checklist */}
        <div className="space-y-1.5 pt-1">
          {kandidat.dokumenti.map((doc) => (
            <label
              key={doc.tip}
              className="flex items-center gap-2 text-sm cursor-pointer group"
            >
              <Checkbox
                checked={doc.prejeto}
                onCheckedChange={() => onToggleDoc(kandidat.id, doc.tip)}
              />
              <span
                className={
                  doc.prejeto
                    ? 'text-muted-foreground line-through'
                    : 'text-foreground group-hover:text-primary'
                }
              >
                {doc.naziv}
              </span>
              {doc.prejeto ? (
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 ml-auto shrink-0" />
              ) : (
                <Circle className="h-3.5 w-3.5 text-muted-foreground/40 ml-auto shrink-0" />
              )}
            </label>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

interface StageGroupProps {
  stageValue: string;
  stageLabel: string;
  stageColor: string;
  kandidati: PipelineCandidate[];
  onToggleDoc: (candidateId: number, docTip: string) => void;
}

function StageGroup({
  stageValue,
  stageLabel,
  stageColor,
  kandidati,
  onToggleDoc,
}: StageGroupProps): React.JSX.Element | null {
  if (kandidati.length === 0) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <div className={`${stageColor} h-3 w-3 rounded-full`} />
        <h3 className="font-semibold text-sm">{stageLabel}</h3>
        <Badge variant="outline" className="text-xs">
          {kandidati.length}
        </Badge>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
        {kandidati.map((k) => (
          <CandidateCard key={k.id} kandidat={k} onToggleDoc={onToggleDoc} />
        ))}
      </div>
    </div>
  );
}

export function PipelinePage(): React.JSX.Element {
  const { kandidati, toggleDocument } = usePipelineStore();

  const candidatesByStage = useMemo(() => {
    const grouped = new Map<string, PipelineCandidate[]>();
    for (const stage of PIPELINE_STAGES) {
      grouped.set(stage.value, []);
    }
    for (const k of kandidati) {
      const list = grouped.get(k.faza);
      if (list) {
        list.push(k);
      }
    }
    return grouped;
  }, [kandidati]);

  const activeStages = useMemo(() => {
    return PIPELINE_STAGES.filter((stage) => {
      const group = candidatesByStage.get(stage.value);
      return group != null && group.length > 0;
    });
  }, [candidatesByStage]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Pipeline</h1>
        <p className="text-muted-foreground mt-1">Kandidati v procesu</p>
      </div>

      {/* Stats overview */}
      <StatsCards kandidati={kandidati} />

      {/* Stage pipeline visualization */}
      <StageSummary kandidati={kandidati} />

      {/* Candidates grouped by stage */}
      {kandidati.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <UserPlus className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground">Ni kandidatov v pipeline-u</p>
            <p className="text-xs text-muted-foreground mt-1">
              Dodajte prvega kandidata za zacetek sledenja
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-8">
          {activeStages.map((stage) => (
            <StageGroup
              key={stage.value}
              stageValue={stage.value}
              stageLabel={stage.label}
              stageColor={stage.color}
              kandidati={candidatesByStage.get(stage.value) ?? []}
              onToggleDoc={toggleDocument}
            />
          ))}
        </div>
      )}
    </div>
  );
}
