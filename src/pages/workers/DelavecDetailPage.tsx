import { useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  User,
  Phone,
  Mail,
  Globe,
  Wrench,
  Calendar,
  MapPin,
  FileText,
  Heart,
  Briefcase,
  Camera,
  ArrowLeft,
  AlertCircle,
  CheckCircle2,
  Shield,
  Euro,
  Building2,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/common/StatusBadge';
import { EmptyState } from '@/components/common/EmptyState';
import { useWorkersStore } from '@/stores/workersStore';
import { useProjectsStore } from '@/stores/projectsStore';
import { useVehiclesStore } from '@/stores/vehiclesStore';
import { DOC_TYPES } from '@/lib/constants';
import { ROUTES } from '@/router/routes';
import {
  formatDate,
  formatCurrency,
  getInitials,
  daysUntilExpiry,
  validityColor,
  validityBg,
} from '@/lib/utils';
import type { Worker, WorkerDocument, HealthCheck, WorkHistory, WeldingPhoto } from '@/types';

function getDocTypeLabel(tipValue: string): string {
  const docType = DOC_TYPES.find((d) => d.value === tipValue);
  return docType?.label ?? tipValue;
}

function getHealthResultBadge(rezultat: HealthCheck['rezultat']): React.JSX.Element {
  switch (rezultat) {
    case 'sposoben':
      return <Badge variant="success">Sposoben</Badge>;
    case 'pogojno_sposoben':
      return <Badge variant="warning">Pogojno sposoben</Badge>;
    case 'nesposoben':
      return <Badge variant="destructive">Nesposoben</Badge>;
  }
}

/* ─── Profile header ─── */
function ProfileHeader({ delavec, currentProject }: { delavec: Worker; currentProject?: string }): React.JSX.Element {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex flex-col sm:flex-row gap-6">
          <div className="flex items-center justify-center sm:justify-start">
            <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center text-primary text-2xl font-bold">
              {getInitials(delavec.ime, delavec.priimek)}
            </div>
          </div>
          <div className="flex-1 min-w-0 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <h1 className="text-2xl font-bold">{delavec.ime} {delavec.priimek}</h1>
              <StatusBadge status={delavec.status} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 text-sm">
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <Globe className="h-3.5 w-3.5 shrink-0" />
                {delavec.narodnost}
              </span>
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <Phone className="h-3.5 w-3.5 shrink-0" />
                {delavec.telefon}
              </span>
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <Mail className="h-3.5 w-3.5 shrink-0" />
                {delavec.email}
              </span>
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <Calendar className="h-3.5 w-3.5 shrink-0" />
                Zaposlen od {formatDate(delavec.datum_zaposlitve)}
              </span>
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <Euro className="h-3.5 w-3.5 shrink-0" />
                {formatCurrency(delavec.urna_postavka)}/uro
              </span>
              {currentProject && (
                <span className="flex items-center gap-1.5 text-muted-foreground">
                  <Building2 className="h-3.5 w-3.5 shrink-0" />
                  {currentProject}
                </span>
              )}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {delavec.tipi_varjenja.map((tip) => (
                <Badge key={tip} variant="outline" className="gap-1">
                  <Wrench className="h-3 w-3" />
                  {tip}
                </Badge>
              ))}
            </div>
            {delavec.opombe && (
              <p className="text-sm text-muted-foreground bg-muted/50 rounded-md px-3 py-2">
                {delavec.opombe}
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/* ─── Stat cards row ─── */
function StatCards({ delavec }: { delavec: Worker }): React.JSX.Element {
  const validDocs = delavec.dokumenti.filter((d) => d.status_veljavnosti === 'veljaven').length;
  const totalDocs = delavec.dokumenti.length;
  const latestHealth = [...(delavec.zdravniski_pregledi || [])].sort(
    (a, b) => new Date(b.datum_pregleda).getTime() - new Date(a.datum_pregleda).getTime()
  )[0];
  const expDocs = delavec.dokumenti.filter(
    (d) => d.status_veljavnosti === 'potekel' || d.status_veljavnosti === 'poteka_kmalu'
  ).length;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-blue-100 p-2">
              <FileText className="h-4 w-4 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{validDocs}/{totalDocs}</p>
              <p className="text-xs text-muted-foreground">Veljavnih dok.</p>
            </div>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-3">
            <div className={`rounded-full p-2 ${expDocs > 0 ? 'bg-red-100' : 'bg-emerald-100'}`}>
              {expDocs > 0 ? <AlertCircle className="h-4 w-4 text-red-600" /> : <CheckCircle2 className="h-4 w-4 text-emerald-600" />}
            </div>
            <div>
              <p className="text-2xl font-bold">{expDocs}</p>
              <p className="text-xs text-muted-foreground">Opozoril</p>
            </div>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-purple-100 p-2">
              <Briefcase className="h-4 w-4 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{(delavec.delovna_zgodovina || []).length}</p>
              <p className="text-xs text-muted-foreground">Projektov</p>
            </div>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-emerald-100 p-2">
              <Heart className="h-4 w-4 text-emerald-600" />
            </div>
            <div>
              {latestHealth ? getHealthResultBadge(latestHealth.rezultat) : <p className="text-sm text-muted-foreground">N/A</p>}
              <p className="text-xs text-muted-foreground">Zdravje</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/* ─── Documents Tab ─── */
function DocumentsTab({ dokumenti }: { dokumenti: WorkerDocument[] }): React.JSX.Element {
  if (dokumenti.length === 0) {
    return <EmptyState title="Ni dokumentov" description="Delavec nima naloženih dokumentov." icon={FileText} />;
  }
  return (
    <div className="space-y-3">
      {dokumenti.map((doc) => {
        const days = daysUntilExpiry(doc.datum_poteka);
        return (
          <Card key={doc.id} className={validityBg(days)}>
            <CardContent className="py-4">
              <div className="flex items-start gap-3 min-w-0">
                <Shield className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
                <div className="space-y-1 min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-sm">{doc.naziv}</span>
                    <StatusBadge status={doc.status_veljavnosti} />
                  </div>
                  <p className="text-xs text-muted-foreground">{getDocTypeLabel(doc.tip)}</p>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    {doc.datum_izdaje && <span>Izdano: {formatDate(doc.datum_izdaje)}</span>}
                    {doc.datum_poteka && (
                      <span className={validityColor(days)}>
                        Poteče: {formatDate(doc.datum_poteka)}
                        {days !== null && (
                          <span className="ml-1">
                            ({days < 0 ? `poteklo pred ${Math.abs(days)} dnevi` : `čez ${days} dni`})
                          </span>
                        )}
                      </span>
                    )}
                  </div>
                  {doc.opombe && <p className="text-xs text-muted-foreground italic">{doc.opombe}</p>}
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

/* ─── Work History Tab ─── */
function WorkHistoryTab({ zgodovina }: { zgodovina: WorkHistory[] }): React.JSX.Element {
  if (zgodovina.length === 0) {
    return <EmptyState title="Ni delovne zgodovine" description="Delavec nima vnešene delovne zgodovine." icon={Briefcase} />;
  }
  const sorted = [...zgodovina].sort((a, b) => new Date(b.od).getTime() - new Date(a.od).getTime());
  return (
    <div className="space-y-3">
      {sorted.map((entry) => (
        <Card key={entry.id}>
          <CardContent className="py-4">
            <div className="flex items-start gap-3">
              <div className="mt-1.5 h-3 w-3 rounded-full bg-primary shrink-0" />
              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-sm">{entry.projekt_naziv}</span>
                  {entry.projekt_id && (
                    <Link to={ROUTES.PROJEKT_DETAIL(entry.projekt_id)}>
                      <Badge variant="outline" className="text-[10px] cursor-pointer hover:bg-muted">ArgoWeld projekt</Badge>
                    </Link>
                  )}
                  {!entry.do && <Badge variant="success" className="text-[10px]">Aktivno</Badge>}
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{entry.lokacija}, {entry.drzava}</span>
                  <span className="flex items-center gap-1"><Wrench className="h-3 w-3" />{entry.vloga}</span>
                  <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{formatDate(entry.od)} — {entry.do ? formatDate(entry.do) : 'danes'}</span>
                </div>
                {entry.opis && <p className="text-xs text-muted-foreground">{entry.opis}</p>}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

/* ─── Health Checks Tab ─── */
function HealthChecksTab({ pregledi }: { pregledi: HealthCheck[] }): React.JSX.Element {
  if (pregledi.length === 0) {
    return <EmptyState title="Ni zdravniških pregledov" description="Delavec nima evidentiranih zdravniških pregledov." icon={Heart} />;
  }
  const sorted = [...pregledi].sort((a, b) => new Date(b.datum_pregleda).getTime() - new Date(a.datum_pregleda).getTime());
  return (
    <div className="space-y-3">
      {sorted.map((pregled) => {
        const daysToNext = daysUntilExpiry(pregled.datum_naslednjega);
        return (
          <Card key={pregled.id}>
            <CardContent className="py-4">
              <div className="flex items-start gap-3">
                <Heart className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-sm">{pregled.tip_pregleda}</span>
                    {getHealthResultBadge(pregled.rezultat)}
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    <span>Ustanova: {pregled.ustanova}</span>
                    <span>Datum: {formatDate(pregled.datum_pregleda)}</span>
                    <span className={validityColor(daysToNext)}>
                      Naslednji: {formatDate(pregled.datum_naslednjega)}
                      {daysToNext !== null && daysToNext < 30 && (
                        <span className="ml-1 font-medium">({daysToNext < 0 ? 'zamujeno!' : `čez ${daysToNext} dni`})</span>
                      )}
                    </span>
                  </div>
                  {pregled.opombe && <p className="text-xs text-muted-foreground italic">{pregled.opombe}</p>}
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

/* ─── Photos Tab ─── */
function PhotosTab({ fotografije }: { fotografije: WeldingPhoto[] }): React.JSX.Element {
  if (fotografije.length === 0) {
    return <EmptyState title="Ni fotografij" description="Delavec nima naloženih fotografij varilskih del." icon={Camera} />;
  }
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {fotografije.map((foto) => (
        <Card key={foto.id} className="overflow-hidden">
          <div className="aspect-video bg-muted">
            <img src={foto.url} alt={foto.naziv} className="w-full h-full object-cover" loading="lazy" />
          </div>
          <CardContent className="pt-3 pb-4 space-y-1">
            <p className="font-medium text-sm">{foto.naziv}</p>
            <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
              <span>{formatDate(foto.datum)}</span>
              {foto.projekt_naziv && (
                <span className="flex items-center gap-1"><Building2 className="h-3 w-3" />{foto.projekt_naziv}</span>
              )}
            </div>
            {foto.opis && <p className="text-xs text-muted-foreground">{foto.opis}</p>}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

/* ─── Vehicle trips for this worker ─── */
function VehicleTripsSection({ workerId }: { workerId: number }): React.JSX.Element {
  const { potovanja } = useVehiclesStore();
  const workerTrips = useMemo(
    () => potovanja.filter((t) => t.voznik_id === workerId).sort((a, b) => new Date(b.datum).getTime() - new Date(a.datum).getTime()),
    [potovanja, workerId]
  );
  if (workerTrips.length === 0) {
    return <EmptyState title="Ni potovanj" description="Delavec nima evidentiranih potovanj z vozili." icon={MapPin} />;
  }
  return (
    <div className="space-y-2">
      {workerTrips.map((trip) => (
        <Card key={trip.id}>
          <CardContent className="py-3">
            <div className="flex items-center justify-between gap-4">
              <div className="min-w-0">
                <span className="font-medium text-sm">{trip.od_lokacija} → {trip.do_lokacija}</span>
                <div className="text-xs text-muted-foreground flex flex-wrap gap-2 mt-0.5">
                  <span>{formatDate(trip.datum)}</span>
                  <span>{trip.kilometri} km</span>
                  <span>{trip.vozilo_naziv} ({trip.vozilo_registrska})</span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">{trip.namen}</p>
              </div>
              {trip.projekt_naziv && (
                <Badge variant="outline" className="text-[10px] shrink-0">{trip.projekt_naziv}</Badge>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

/* ─── Main page ─── */
export function DelavecDetailPage(): React.JSX.Element {
  const { id } = useParams<{ id: string }>();
  const getDelavec = useWorkersStore((s) => s.getDelavec);
  const { projekti } = useProjectsStore();
  const delavec = getDelavec(Number(id));

  if (!delavec) {
    return (
      <div className="space-y-6">
        <Link to={ROUTES.DELAVCI}>
          <Button variant="ghost" size="sm" className="gap-1.5"><ArrowLeft className="h-4 w-4" />Nazaj na seznam</Button>
        </Link>
        <EmptyState title="Delavec ni najden" description="Delavec s tem ID-jem ne obstaja." icon={User} />
      </div>
    );
  }

  const currentProject = delavec.trenutni_projekt_id
    ? projekti.find((p) => p.id === delavec.trenutni_projekt_id)?.naziv
    : undefined;

  return (
    <div className="space-y-6">
      <Link to={ROUTES.DELAVCI}>
        <Button variant="ghost" size="sm" className="gap-1.5"><ArrowLeft className="h-4 w-4" />Nazaj na seznam</Button>
      </Link>
      <ProfileHeader delavec={delavec} currentProject={currentProject} />
      <StatCards delavec={delavec} />
      <Tabs defaultValue="dokumenti" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-5 h-auto">
          <TabsTrigger value="dokumenti" className="gap-1.5 text-xs sm:text-sm">
            <FileText className="h-3.5 w-3.5" />Dokumenti
            {delavec.dokumenti.length > 0 && (
              <Badge variant="secondary" className="h-5 min-w-5 justify-center text-[10px] ml-1">{delavec.dokumenti.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="zgodovina" className="gap-1.5 text-xs sm:text-sm">
            <Briefcase className="h-3.5 w-3.5" />Zgodovina
          </TabsTrigger>
          <TabsTrigger value="zdravje" className="gap-1.5 text-xs sm:text-sm">
            <Heart className="h-3.5 w-3.5" />Zdravje
          </TabsTrigger>
          <TabsTrigger value="fotografije" className="gap-1.5 text-xs sm:text-sm">
            <Camera className="h-3.5 w-3.5" />Fotografije
          </TabsTrigger>
          <TabsTrigger value="potovanja" className="gap-1.5 text-xs sm:text-sm">
            <MapPin className="h-3.5 w-3.5" />Potovanja
          </TabsTrigger>
        </TabsList>
        <TabsContent value="dokumenti"><DocumentsTab dokumenti={delavec.dokumenti} /></TabsContent>
        <TabsContent value="zgodovina"><WorkHistoryTab zgodovina={delavec.delovna_zgodovina || []} /></TabsContent>
        <TabsContent value="zdravje"><HealthChecksTab pregledi={delavec.zdravniski_pregledi || []} /></TabsContent>
        <TabsContent value="fotografije"><PhotosTab fotografije={delavec.fotografije || []} /></TabsContent>
        <TabsContent value="potovanja"><VehicleTripsSection workerId={delavec.id} /></TabsContent>
      </Tabs>
    </div>
  );
}
