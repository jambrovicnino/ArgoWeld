import { useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Car,
  ArrowLeft,
  MapPin,
  Calendar,
  Gauge,
  User,
  Building2,
  CreditCard,
  Route,
  Clock,
  Briefcase,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/common/EmptyState';
import { useVehiclesStore } from '@/stores/vehiclesStore';
import { ROUTES } from '@/router/routes';
import { formatDate } from '@/lib/utils';
import type { Vehicle, VehicleTrip } from '@/types';

/* ─── Helpers ─── */
function getVehicleTypeBadge(tip: Vehicle['tip']): React.JSX.Element {
  switch (tip) {
    case 'lastno':
      return <Badge variant="success" className="text-sm">Lastno vozilo</Badge>;
    case 'najem':
      return <Badge variant="accent" className="text-sm">Rent-a-car</Badge>;
  }
}

/* ─── Vehicle header card ─── */
function VehicleHeader({ vozilo, totalKm, totalTrips }: { vozilo: Vehicle; totalKm: number; totalTrips: number }): React.JSX.Element {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex flex-col sm:flex-row gap-6">
          <div className="flex items-center justify-center sm:justify-start">
            <div className="h-20 w-20 rounded-full bg-blue-100 flex items-center justify-center">
              <Car className="h-10 w-10 text-blue-600" />
            </div>
          </div>
          <div className="flex-1 min-w-0 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <h1 className="text-2xl font-bold">{vozilo.naziv}</h1>
              {getVehicleTypeBadge(vozilo.tip)}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 text-sm">
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <Car className="h-3.5 w-3.5 shrink-0" />
                Registrska: <span className="font-mono font-medium text-foreground">{vozilo.registrska}</span>
              </span>
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <Route className="h-3.5 w-3.5 shrink-0" />
                {totalTrips} potovanj · {totalKm.toLocaleString('sl-SI')} km skupaj
              </span>
              {vozilo.tip === 'najem' && vozilo.najemodajalec && (
                <span className="flex items-center gap-1.5 text-muted-foreground">
                  <Building2 className="h-3.5 w-3.5 shrink-0" />
                  {vozilo.najemodajalec}
                </span>
              )}
              {vozilo.tip === 'najem' && vozilo.datum_najema_od && vozilo.datum_najema_do && (
                <span className="flex items-center gap-1.5 text-muted-foreground">
                  <Calendar className="h-3.5 w-3.5 shrink-0" />
                  Najem: {formatDate(vozilo.datum_najema_od)} — {formatDate(vozilo.datum_najema_do)}
                </span>
              )}
            </div>
            {vozilo.opombe && (
              <p className="text-sm text-muted-foreground bg-muted/50 rounded-md px-3 py-2">
                {vozilo.opombe}
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/* ─── Rental info card ─── */
function RentalInfoCard({ vozilo }: { vozilo: Vehicle }): React.JSX.Element | null {
  if (vozilo.tip !== 'najem') return null;

  const startDate = vozilo.datum_najema_od ? new Date(vozilo.datum_najema_od) : null;
  const endDate = vozilo.datum_najema_do ? new Date(vozilo.datum_najema_do) : null;
  const now = new Date();
  const isActive = startDate && endDate && now >= startDate && now <= endDate;
  const daysLeft = endDate ? Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) : null;

  return (
    <Card className="border-purple-200 bg-purple-50/30">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <CreditCard className="h-5 w-5 text-purple-600" />
          <CardTitle className="text-lg">Podatki o najemu</CardTitle>
          {isActive ? (
            <Badge variant="success">Aktiven najem</Badge>
          ) : daysLeft !== null && daysLeft < 0 ? (
            <Badge variant="destructive">Najem potekel</Badge>
          ) : (
            <Badge variant="warning">Prihaja</Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Najemodajalec</p>
            <p className="text-sm font-semibold">{vozilo.najemodajalec || '—'}</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Obdobje najema</p>
            <p className="text-sm font-semibold">
              {vozilo.datum_najema_od ? formatDate(vozilo.datum_najema_od) : '—'} — {vozilo.datum_najema_do ? formatDate(vozilo.datum_najema_do) : '—'}
            </p>
          </div>
          {daysLeft !== null && (
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                {daysLeft < 0 ? 'Poteklo pred' : 'Preostalo'}
              </p>
              <p className={`text-sm font-semibold ${daysLeft < 30 ? 'text-red-600' : daysLeft < 60 ? 'text-amber-600' : 'text-emerald-600'}`}>
                {Math.abs(daysLeft)} dni
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

/* ─── Stats row ─── */
function StatsRow({ trips, vozilo }: { trips: VehicleTrip[]; vozilo: Vehicle }): React.JSX.Element {
  const totalKm = trips.reduce((sum, t) => sum + t.kilometri, 0);
  const uniqueDrivers = new Set(trips.map((t) => t.voznik_id)).size;
  const uniqueProjects = new Set(trips.filter((t) => t.projekt_id).map((t) => t.projekt_id)).size;
  const uniqueLocations = new Set(trips.flatMap((t) => [t.od_lokacija, t.do_lokacija])).size;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-blue-100 p-2"><Route className="h-4 w-4 text-blue-600" /></div>
            <div>
              <p className="text-2xl font-bold">{trips.length}</p>
              <p className="text-xs text-muted-foreground">Potovanj</p>
            </div>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-amber-100 p-2"><Gauge className="h-4 w-4 text-amber-600" /></div>
            <div>
              <p className="text-2xl font-bold">{totalKm.toLocaleString('sl-SI')}</p>
              <p className="text-xs text-muted-foreground">Kilometrov</p>
            </div>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-emerald-100 p-2"><User className="h-4 w-4 text-emerald-600" /></div>
            <div>
              <p className="text-2xl font-bold">{uniqueDrivers}</p>
              <p className="text-xs text-muted-foreground">Voznikov</p>
            </div>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-purple-100 p-2"><Briefcase className="h-4 w-4 text-purple-600" /></div>
            <div>
              <p className="text-2xl font-bold">{uniqueProjects}</p>
              <p className="text-xs text-muted-foreground">Projektov</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/* ─── Drivers list ─── */
function DriversSection({ trips }: { trips: VehicleTrip[] }): React.JSX.Element {
  // Group by driver
  const driverMap = useMemo(() => {
    const map = new Map<number, { ime: string; trips: number; km: number; lastTrip: string; projects: Set<string> }>();
    for (const trip of trips) {
      const existing = map.get(trip.voznik_id);
      if (existing) {
        existing.trips++;
        existing.km += trip.kilometri;
        if (trip.datum > existing.lastTrip) existing.lastTrip = trip.datum;
        if (trip.projekt_naziv) existing.projects.add(trip.projekt_naziv);
      } else {
        const projects = new Set<string>();
        if (trip.projekt_naziv) projects.add(trip.projekt_naziv);
        map.set(trip.voznik_id, {
          ime: trip.voznik_ime,
          trips: 1,
          km: trip.kilometri,
          lastTrip: trip.datum,
          projects,
        });
      }
    }
    return map;
  }, [trips]);

  if (driverMap.size === 0) {
    return <EmptyState title="Ni voznikov" description="Ni evidentiranih voznikov za to vozilo." icon={User} />;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <User className="h-5 w-5 text-muted-foreground" />
          <CardTitle className="text-lg">Vozniki tega vozila</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {Array.from(driverMap.entries()).map(([driverId, data]) => (
            <Link key={driverId} to={ROUTES.DELAVEC_DETAIL(driverId)} className="block">
              <div className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors">
                <div className="min-w-0">
                  <p className="font-medium text-sm">{data.ime}</p>
                  <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground mt-0.5">
                    <span>{data.trips} potovanj</span>
                    <span>{data.km.toLocaleString('sl-SI')} km</span>
                    <span>Zadnje: {formatDate(data.lastTrip)}</span>
                  </div>
                  {data.projects.size > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {Array.from(data.projects).map((proj) => (
                        <Badge key={proj} variant="outline" className="text-[10px]">{proj}</Badge>
                      ))}
                    </div>
                  )}
                </div>
                <Badge variant="secondary" className="shrink-0">{data.km.toLocaleString('sl-SI')} km</Badge>
              </div>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

/* ─── Trip history ─── */
function TripHistory({ trips }: { trips: VehicleTrip[] }): React.JSX.Element {
  const sorted = [...trips].sort((a, b) => new Date(b.datum).getTime() - new Date(a.datum).getTime());

  if (sorted.length === 0) {
    return <EmptyState title="Ni potovanj" description="Ni evidentiranih potovanj za to vozilo." icon={MapPin} />;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-muted-foreground" />
          <CardTitle className="text-lg">Zgodovina potovanj</CardTitle>
          <Badge variant="secondary">{sorted.length}</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {sorted.map((trip) => (
            <div key={trip.id} className="flex items-start gap-3 p-3 rounded-lg border">
              <div className="mt-1.5 h-3 w-3 rounded-full bg-blue-500 shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium text-sm">{trip.od_lokacija} → {trip.do_lokacija}</span>
                  <Badge variant="outline" className="text-[10px]">{trip.kilometri} km</Badge>
                </div>
                <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />{formatDate(trip.datum)}
                  </span>
                  <Link to={ROUTES.DELAVEC_DETAIL(trip.voznik_id)} className="flex items-center gap-1 hover:text-primary transition-colors">
                    <User className="h-3 w-3" />{trip.voznik_ime}
                  </Link>
                  {trip.projekt_naziv && trip.projekt_id && (
                    <Link to={ROUTES.PROJEKT_DETAIL(trip.projekt_id)} className="flex items-center gap-1 hover:text-primary transition-colors">
                      <Briefcase className="h-3 w-3" />{trip.projekt_naziv}
                    </Link>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">{trip.namen}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

/* ─── Construction sites (locations) ─── */
function LocationsSection({ trips }: { trips: VehicleTrip[] }): React.JSX.Element {
  const locationMap = useMemo(() => {
    const map = new Map<string, { count: number; km: number; projects: Set<string>; lastDate: string }>();
    for (const trip of trips) {
      for (const loc of [trip.od_lokacija, trip.do_lokacija]) {
        const existing = map.get(loc);
        if (existing) {
          existing.count++;
          existing.km += trip.kilometri;
          if (trip.projekt_naziv) existing.projects.add(trip.projekt_naziv);
          if (trip.datum > existing.lastDate) existing.lastDate = trip.datum;
        } else {
          const projects = new Set<string>();
          if (trip.projekt_naziv) projects.add(trip.projekt_naziv);
          map.set(loc, { count: 1, km: trip.kilometri, projects, lastDate: trip.datum });
        }
      }
    }
    return Array.from(map.entries()).sort((a, b) => b[1].count - a[1].count);
  }, [trips]);

  if (locationMap.length === 0) return <></>;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <MapPin className="h-5 w-5 text-muted-foreground" />
          <CardTitle className="text-lg">Lokacije / Gradbišča</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {locationMap.map(([loc, data]) => (
            <div key={loc} className="flex items-center justify-between p-3 rounded-lg border bg-card">
              <div className="min-w-0">
                <p className="font-medium text-sm">{loc}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {data.count}× · Zadnjič: {formatDate(data.lastDate)}
                </p>
                {data.projects.size > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {Array.from(data.projects).map((proj) => (
                      <Badge key={proj} variant="outline" className="text-[10px]">{proj}</Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

/* ─── Main page ─── */
export function VoziloDetailPage(): React.JSX.Element {
  const { id } = useParams<{ id: string }>();
  const { getVozilo, potovanja } = useVehiclesStore();
  const vozilo = getVozilo(Number(id));

  const vehicleTrips = useMemo(
    () => potovanja.filter((t) => t.vozilo_id === Number(id)),
    [potovanja, id]
  );

  const totalKm = vehicleTrips.reduce((sum, t) => sum + t.kilometri, 0);

  if (!vozilo) {
    return (
      <div className="space-y-6">
        <Link to={ROUTES.VOZILA}>
          <Button variant="ghost" size="sm" className="gap-1.5"><ArrowLeft className="h-4 w-4" />Nazaj na vozila</Button>
        </Link>
        <EmptyState title="Vozilo ni najdeno" description="Vozilo s tem ID-jem ne obstaja." icon={Car} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Link to={ROUTES.VOZILA}>
        <Button variant="ghost" size="sm" className="gap-1.5"><ArrowLeft className="h-4 w-4" />Nazaj na vozila</Button>
      </Link>
      <VehicleHeader vozilo={vozilo} totalKm={totalKm} totalTrips={vehicleTrips.length} />
      <RentalInfoCard vozilo={vozilo} />
      <StatsRow trips={vehicleTrips} vozilo={vozilo} />
      <DriversSection trips={vehicleTrips} />
      <LocationsSection trips={vehicleTrips} />
      <TripHistory trips={vehicleTrips} />
    </div>
  );
}
