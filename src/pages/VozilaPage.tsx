import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Car,
  MapPin,
  Calendar,
  Gauge,
  User,
  Building2,
  CreditCard,
  Fuel,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PageHeader } from '@/components/common/PageHeader';
import { EmptyState } from '@/components/common/EmptyState';
import { useVehiclesStore } from '@/stores/vehiclesStore';
import { ROUTES } from '@/router/routes';
import { formatDate, formatCurrency } from '@/lib/utils';
import { Search } from 'lucide-react';
import type { Vehicle, VehicleTrip } from '@/types';

function getVehicleTypeBadge(tip: Vehicle['tip']): React.JSX.Element {
  switch (tip) {
    case 'lastno':
      return <Badge variant="success">Lastno</Badge>;
    case 'najem':
      return <Badge variant="accent">Rent-a-car</Badge>;
  }
}

export function VozilaPage(): React.JSX.Element {
  const { vozila, potovanja } = useVehiclesStore();
  const [searchQuery, setSearchQuery] = useState('');

  const totalKm = useMemo(() => potovanja.reduce((sum, t) => sum + t.kilometri, 0), [potovanja]);
  const rentalCount = vozila.filter((v) => v.tip === 'najem').length;
  const ownedCount = vozila.filter((v) => v.tip === 'lastno').length;

  const filteredTrips = useMemo(() => {
    const sorted = [...potovanja].sort((a, b) => new Date(b.datum).getTime() - new Date(a.datum).getTime());
    if (!searchQuery) return sorted;
    const q = searchQuery.toLowerCase();
    return sorted.filter(
      (t) =>
        t.voznik_ime.toLowerCase().includes(q) ||
        t.vozilo_naziv.toLowerCase().includes(q) ||
        t.vozilo_registrska.toLowerCase().includes(q) ||
        t.od_lokacija.toLowerCase().includes(q) ||
        t.do_lokacija.toLowerCase().includes(q) ||
        (t.projekt_naziv && t.projekt_naziv.toLowerCase().includes(q))
    );
  }, [potovanja, searchQuery]);

  // Group trips by vehicle for stats
  const vehicleStats = useMemo(() => {
    const stats = new Map<number, { trips: number; km: number }>();
    for (const trip of potovanja) {
      const existing = stats.get(trip.vozilo_id) || { trips: 0, km: 0 };
      stats.set(trip.vozilo_id, { trips: existing.trips + 1, km: existing.km + trip.kilometri });
    }
    return stats;
  }, [potovanja]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Vozila"
        description="Upravljanje voznega parka in potovanj"
      />

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-blue-100 p-2"><Car className="h-4 w-4 text-blue-600" /></div>
              <div>
                <p className="text-2xl font-bold">{vozila.length}</p>
                <p className="text-xs text-muted-foreground">Skupaj vozil</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-emerald-100 p-2"><Car className="h-4 w-4 text-emerald-600" /></div>
              <div>
                <p className="text-2xl font-bold">{ownedCount}</p>
                <p className="text-xs text-muted-foreground">Lastna vozila</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-purple-100 p-2"><CreditCard className="h-4 w-4 text-purple-600" /></div>
              <div>
                <p className="text-2xl font-bold">{rentalCount}</p>
                <p className="text-xs text-muted-foreground">Rent-a-car</p>
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
                <p className="text-xs text-muted-foreground">Skupaj km</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="vozila" className="space-y-4">
        <TabsList>
          <TabsTrigger value="vozila" className="gap-1.5">
            <Car className="h-3.5 w-3.5" />Vozila
          </TabsTrigger>
          <TabsTrigger value="potovanja" className="gap-1.5">
            <MapPin className="h-3.5 w-3.5" />Potovanja
          </TabsTrigger>
        </TabsList>

        <TabsContent value="vozila">
          {vozila.length === 0 ? (
            <EmptyState title="Ni vozil" description="Dodajte prvo vozilo za začetek sledenja." icon={Car} />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {vozila.map((vozilo) => {
                const stats = vehicleStats.get(vozilo.id);
                return (
                  <Link key={vozilo.id} to={ROUTES.VOZILO_DETAIL(vozilo.id)}>
                  <Card className="hover:shadow-md transition-shadow cursor-pointer">
                    <CardContent className="pt-6 space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className="font-semibold text-base">{vozilo.naziv}</h3>
                          <p className="text-sm font-mono text-muted-foreground">{vozilo.registrska}</p>
                        </div>
                        {getVehicleTypeBadge(vozilo.tip)}
                      </div>

                      {vozilo.tip === 'najem' && (
                        <div className="bg-muted/50 rounded-md px-3 py-2 space-y-1 text-xs text-muted-foreground">
                          {vozilo.najemodajalec && (
                            <span className="flex items-center gap-1.5">
                              <Building2 className="h-3 w-3" />{vozilo.najemodajalec}
                            </span>
                          )}
                          {vozilo.datum_najema_od && vozilo.datum_najema_do && (
                            <span className="flex items-center gap-1.5">
                              <Calendar className="h-3 w-3" />
                              {formatDate(vozilo.datum_najema_od)} — {formatDate(vozilo.datum_najema_do)}
                            </span>
                          )}
                        </div>
                      )}

                      <div className="flex gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1.5">
                          <MapPin className="h-3.5 w-3.5" />{stats?.trips ?? 0} potovanj
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Gauge className="h-3.5 w-3.5" />{(stats?.km ?? 0).toLocaleString('sl-SI')} km
                        </span>
                      </div>

                      {vozilo.opombe && (
                        <p className="text-xs text-muted-foreground">{vozilo.opombe}</p>
                      )}
                    </CardContent>
                  </Card>
                  </Link>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="potovanja">
          <div className="space-y-4">
            {/* Search */}
            <div className="relative w-full sm:max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Iskanje po vozniku, vozilu, lokaciji..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {filteredTrips.length === 0 ? (
              <EmptyState title="Ni potovanj" description="Ni evidentiranih potovanj." icon={MapPin} />
            ) : (
              <div className="space-y-2">
                {filteredTrips.map((trip) => (
                  <Card key={trip.id}>
                    <CardContent className="py-3">
                      <div className="flex items-center justify-between gap-4">
                        <div className="min-w-0 flex-1">
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
                            <span className="flex items-center gap-1">
                              <Car className="h-3 w-3" />{trip.vozilo_naziv} ({trip.vozilo_registrska})
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">{trip.namen}</p>
                        </div>
                        {trip.projekt_naziv && (
                          <Badge variant="secondary" className="text-[10px] shrink-0">{trip.projekt_naziv}</Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
