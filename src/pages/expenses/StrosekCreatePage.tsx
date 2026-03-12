import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Save,
  Euro,
  CalendarDays,
  FolderKanban,
  Tag,
  FileText,
  Car,
  Gauge,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useExpensesStore } from '@/stores/expensesStore';
import { useProjectsStore } from '@/stores/projectsStore';
import { useVehiclesStore } from '@/stores/vehiclesStore';
import { EXPENSE_CATEGORIES } from '@/lib/constants';
import { ROUTES } from '@/router/routes';
import type { ExpenseCategory } from '@/types';

const nativeSelectClass =
  'flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm';

export function StrosekCreatePage(): React.JSX.Element {
  const navigate = useNavigate();
  const { addStrosek } = useExpensesStore();
  const { projekti } = useProjectsStore();
  const { vozila } = useVehiclesStore();

  const [kategorija, setKategorija] = useState<ExpenseCategory>('transport');
  const [znesek, setZnesek] = useState('');
  const [datum, setDatum] = useState(new Date().toISOString().slice(0, 10));
  const [opis, setOpis] = useState('');
  const [projektId, setProjektId] = useState<string>('');
  const [vozilo, setVozilo] = useState('');
  const [kilometri, setKilometri] = useState('');

  const selectedCategory = EXPENSE_CATEGORIES.find((c) => c.value === kategorija);
  const isTransport = kategorija === 'transport' || kategorija === 'gorivo';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!znesek || parseFloat(znesek) <= 0) return;

    const projekt = projektId ? projekti.find((p) => p.id === Number(projektId)) : null;

    addStrosek({
      kategorija,
      znesek: parseFloat(znesek),
      datum,
      opis: opis.trim(),
      projekt_id: projekt ? projekt.id : null,
      projekt_naziv: projekt ? projekt.naziv : undefined,
      vozilo: vozilo || undefined,
      kilometri: kilometri ? parseFloat(kilometri) : undefined,
    });

    navigate(ROUTES.STROSKI);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 pb-28 md:pb-16">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link to={ROUTES.STROSKI}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-xl font-bold">Nov strošek</h1>
          <p className="text-sm text-muted-foreground">Vnesite podatke o strošku</p>
        </div>
      </div>

      {/* Kategorija — pill buttons */}
      <Card>
        <CardContent className="p-4 space-y-3">
          <Label className="flex items-center gap-1.5">
            <Tag className="h-3.5 w-3.5" />
            Kategorija <span className="text-destructive">*</span>
          </Label>
          <div className="flex flex-wrap gap-2">
            {EXPENSE_CATEGORIES.map((cat) => {
              const isActive = kategorija === cat.value;
              return (
                <button
                  key={cat.value}
                  type="button"
                  onClick={() => setKategorija(cat.value as ExpenseCategory)}
                  className={`rounded-full border px-4 py-1.5 text-sm font-medium transition-colors ${
                    isActive
                      ? 'text-white border-transparent'
                      : 'border-border bg-background hover:bg-muted'
                  }`}
                  style={isActive ? { backgroundColor: cat.color } : undefined}
                >
                  {cat.label}
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Znesek + Datum */}
      <Card>
        <CardContent className="p-4 space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="znesek">
                <Euro className="mr-1 inline h-3.5 w-3.5" />
                Znesek (EUR) <span className="text-destructive">*</span>
              </Label>
              <Input
                id="znesek"
                type="number"
                min="0.01"
                step="0.01"
                value={znesek}
                onChange={(e) => setZnesek(e.target.value)}
                placeholder="0.00"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="datum">
                <CalendarDays className="mr-1 inline h-3.5 w-3.5" />
                Datum
              </Label>
              <input
                id="datum"
                type="date"
                className={nativeSelectClass}
                value={datum}
                onChange={(e) => setDatum(e.target.value)}
              />
            </div>
          </div>

          {/* Opis */}
          <div className="space-y-1.5">
            <Label htmlFor="opis">
              <FileText className="mr-1 inline h-3.5 w-3.5" />
              Opis
            </Label>
            <textarea
              id="opis"
              rows={2}
              className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              value={opis}
              onChange={(e) => setOpis(e.target.value)}
              placeholder="Kratek opis stroška..."
            />
          </div>

          {/* Projekt */}
          <div className="space-y-1.5">
            <Label htmlFor="projekt">
              <FolderKanban className="mr-1 inline h-3.5 w-3.5" />
              Projekt (opcijsko)
            </Label>
            <select
              id="projekt"
              className={nativeSelectClass}
              value={projektId}
              onChange={(e) => setProjektId(e.target.value)}
            >
              <option value="">— Brez projekta —</option>
              {projekti.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.naziv} ({p.lokacija})
                </option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Transport fields — shown only for transport/gorivo */}
      {isTransport && (
        <Card>
          <CardContent className="p-4 space-y-4">
            <p className="text-sm font-medium flex items-center gap-1.5">
              <Car className="h-4 w-4 text-muted-foreground" />
              Podatki o prevozu
            </p>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="vozilo">Vozilo</Label>
                <select
                  id="vozilo"
                  className={nativeSelectClass}
                  value={vozilo}
                  onChange={(e) => setVozilo(e.target.value)}
                >
                  <option value="">— Izberi vozilo —</option>
                  {vozila.map((v) => (
                    <option key={v.id} value={`${v.naziv} (${v.registrska})`}>
                      {v.naziv} ({v.registrska})
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="km">
                  <Gauge className="mr-1 inline h-3.5 w-3.5" />
                  Kilometri
                </Label>
                <Input
                  id="km"
                  type="number"
                  min="0"
                  step="1"
                  value={kilometri}
                  onChange={(e) => setKilometri(e.target.value)}
                  placeholder="0"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Preview */}
      {znesek && parseFloat(znesek) > 0 && (
        <div className="rounded-lg border bg-muted/30 p-4">
          <p className="text-xs text-muted-foreground mb-1">Predogled</p>
          <div className="flex items-center gap-3">
            <div
              className="h-10 w-10 rounded-full flex items-center justify-center text-white shrink-0"
              style={{ backgroundColor: selectedCategory?.color || '#6b7280' }}
            >
              <Euro className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-semibold">
                {parseFloat(znesek).toLocaleString('sl-SI', { minimumFractionDigits: 2 })} €
              </p>
              <p className="text-sm text-muted-foreground truncate">
                {selectedCategory?.label}
                {opis ? ` · ${opis}` : ''}
                {projektId ? ` · ${projekti.find((p) => p.id === Number(projektId))?.naziv}` : ''}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Sticky submit */}
      <div className="fixed bottom-16 left-0 right-0 z-40 border-t bg-background/95 backdrop-blur-sm p-4 md:bottom-0">
        <div className="mx-auto flex max-w-screen-xl items-center justify-between gap-3">
          <p className="hidden text-sm text-muted-foreground sm:block">
            Izberite kategorijo in vnesite znesek.
          </p>
          <Button type="submit" disabled={!znesek || parseFloat(znesek) <= 0} className="ml-auto">
            <Save className="mr-2 h-4 w-4" />
            Dodaj strošek
          </Button>
        </div>
      </div>
    </form>
  );
}
