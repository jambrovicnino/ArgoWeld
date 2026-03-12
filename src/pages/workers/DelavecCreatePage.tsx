import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Save,
  User,
  FileText,
  Phone,
  Mail,
  Euro,
  Wrench,
  ChevronDown,
  ChevronUp,
  Globe,
  CalendarDays,
  Plus,
  X,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useWorkersStore } from '@/stores/workersStore';
import {
  WELDING_TYPES,
  WORKER_STATUSES,
  NATIONALITIES,
  DOC_TYPES,
} from '@/lib/constants';
import { ROUTES } from '@/router/routes';
import type { WorkerStatus, WeldingType, DocType, ValidityStatus } from '@/types';

const nativeSelectClass =
  'flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm';

// ---------------------------------------------------------------------------
// Document row type for the form
// ---------------------------------------------------------------------------
interface DocRow {
  tip: DocType;
  naziv: string;
  datum_izdaje: string;
  datum_poteka: string;
  status_veljavnosti: ValidityStatus;
  opombe: string;
}

const EMPTY_DOC: DocRow = {
  tip: 'trc',
  naziv: '',
  datum_izdaje: '',
  datum_poteka: '',
  status_veljavnosti: 'veljaven',
  opombe: '',
};

// ---------------------------------------------------------------------------
// Section header component (collapsible)
// ---------------------------------------------------------------------------
interface SectionHeaderProps {
  icon: React.ElementType;
  title: string;
  badge?: number;
  open: boolean;
  onToggle: () => void;
}

function SectionHeader({ icon: Icon, title, badge, open, onToggle }: SectionHeaderProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="flex w-full items-center justify-between rounded-lg bg-muted/50 px-4 py-3 transition-colors hover:bg-muted"
    >
      <span className="flex items-center gap-2 font-semibold">
        <Icon className="h-4 w-4 text-primary" />
        {title}
        {badge !== undefined && badge > 0 && (
          <Badge variant="secondary" className="ml-1 text-[11px]">
            {badge}
          </Badge>
        )}
      </span>
      {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
    </button>
  );
}

// ---------------------------------------------------------------------------
// Validity status helpers
// ---------------------------------------------------------------------------
const VALIDITY_OPTIONS: { value: ValidityStatus; label: string }[] = [
  { value: 'veljaven', label: 'Veljaven' },
  { value: 'poteka_kmalu', label: 'Poteče kmalu' },
  { value: 'potekel', label: 'Potekel' },
  { value: 'manjka', label: 'Manjka' },
];

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------
export function DelavecCreatePage(): React.JSX.Element {
  const navigate = useNavigate();
  const { addDelavec, addDocument } = useWorkersStore();

  // --- Basic info ---
  const [ime, setIme] = useState('');
  const [priimek, setPriimek] = useState('');
  const [narodnost, setNarodnost] = useState('');
  const [status, setStatus] = useState<WorkerStatus>('v_dogovoru');
  const [telefon, setTelefon] = useState('');
  const [email, setEmail] = useState('');
  const [urnaPostavka, setUrnaPostavka] = useState('');
  const [datumZaposlitve, setDatumZaposlitve] = useState('');
  const [opombe, setOpombe] = useState('');

  // --- Welding types ---
  const [tipiVarjenja, setTipiVarjenja] = useState<WeldingType[]>([]);

  // --- Documents ---
  const [dokumenti, setDokumenti] = useState<DocRow[]>([]);

  // --- Collapsible sections ---
  const [openSections, setOpenSections] = useState({
    osnovni: true,
    varjenje: true,
    dokumenti: false,
  });

  const toggleSection = (key: keyof typeof openSections) =>
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));

  // --- Welding toggle ---
  const toggleWeldingType = (wt: WeldingType) => {
    setTipiVarjenja((prev) =>
      prev.includes(wt) ? prev.filter((t) => t !== wt) : [...prev, wt]
    );
  };

  // --- Document helpers ---
  const addDocRow = () => setDokumenti((prev) => [...prev, { ...EMPTY_DOC }]);
  const removeDocRow = (idx: number) =>
    setDokumenti((prev) => prev.filter((_, i) => i !== idx));
  const updateDocRow = (idx: number, field: keyof DocRow, value: string) => {
    setDokumenti((prev) =>
      prev.map((d, i) => (i === idx ? { ...d, [field]: value } : d))
    );
  };

  // --- Submit ---
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!ime.trim()) return;

    const workerId = addDelavec({
      ime: ime.trim(),
      priimek: priimek.trim(),
      narodnost: narodnost || 'Drugo',
      telefon: telefon.trim(),
      email: email.trim(),
      urna_postavka: parseFloat(urnaPostavka) || 0,
      tipi_varjenja: tipiVarjenja,
      trenutni_projekt_id: null,
      status,
      datum_zaposlitve: datumZaposlitve || new Date().toISOString().slice(0, 10),
      opombe: opombe.trim(),
    });

    // Add documents
    for (const doc of dokumenti) {
      if (doc.naziv.trim() || doc.datum_poteka) {
        addDocument(workerId, {
          tip: doc.tip,
          naziv: doc.naziv.trim() || DOC_TYPES.find((d) => d.value === doc.tip)?.label || doc.tip,
          datum_izdaje: doc.datum_izdaje || undefined,
          datum_poteka: doc.datum_poteka || undefined,
          status_veljavnosti: doc.status_veljavnosti,
          opombe: doc.opombe.trim() || undefined,
        });
      }
    }

    navigate(ROUTES.DELAVEC_DETAIL(workerId));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 pb-28 md:pb-16">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link to={ROUTES.DELAVCI}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-xl font-bold">Nov delavec</h1>
          <p className="text-sm text-muted-foreground">
            Izpolnite podatke novega delavca
          </p>
        </div>
      </div>

      {/* ────────────────────── SECTION 1: Osnovni podatki ────────────────────── */}
      <Card>
        <CardContent className="p-0">
          <SectionHeader
            icon={User}
            title="Osnovni podatki"
            open={openSections.osnovni}
            onToggle={() => toggleSection('osnovni')}
          />
          {openSections.osnovni && (
            <div className="space-y-4 p-4">
              {/* Ime + Priimek */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="ime">
                    Ime <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="ime"
                    value={ime}
                    onChange={(e) => setIme(e.target.value)}
                    placeholder="npr. Marko"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="priimek">Priimek</Label>
                  <Input
                    id="priimek"
                    value={priimek}
                    onChange={(e) => setPriimek(e.target.value)}
                    placeholder="npr. Nikolić"
                  />
                </div>
              </div>

              {/* Narodnost + Status */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="narodnost">
                    <Globe className="mr-1 inline h-3.5 w-3.5" />
                    Narodnost / Država
                  </Label>
                  <select
                    id="narodnost"
                    className={nativeSelectClass}
                    value={narodnost}
                    onChange={(e) => setNarodnost(e.target.value)}
                  >
                    <option value="">Izberi...</option>
                    {NATIONALITIES.map((n) => (
                      <option key={n} value={n}>
                        {n}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="status">Status</Label>
                  <select
                    id="status"
                    className={nativeSelectClass}
                    value={status}
                    onChange={(e) => setStatus(e.target.value as WorkerStatus)}
                  >
                    {WORKER_STATUSES.map((s) => (
                      <option key={s.value} value={s.value}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Telefon + Email */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="telefon">
                    <Phone className="mr-1 inline h-3.5 w-3.5" />
                    Telefon
                  </Label>
                  <Input
                    id="telefon"
                    type="tel"
                    value={telefon}
                    onChange={(e) => setTelefon(e.target.value)}
                    placeholder="+386 ..."
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="email">
                    <Mail className="mr-1 inline h-3.5 w-3.5" />
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="ime@email.com"
                  />
                </div>
              </div>

              {/* Urna postavka + Datum zaposlitve */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="urna_postavka">
                    <Euro className="mr-1 inline h-3.5 w-3.5" />
                    Urna postavka (EUR/uro)
                  </Label>
                  <Input
                    id="urna_postavka"
                    type="number"
                    min="0"
                    step="0.5"
                    value={urnaPostavka}
                    onChange={(e) => setUrnaPostavka(e.target.value)}
                    placeholder="0.00"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="datum_zaposlitve">
                    <CalendarDays className="mr-1 inline h-3.5 w-3.5" />
                    Datum zaposlitve
                  </Label>
                  <input
                    id="datum_zaposlitve"
                    type="date"
                    className={nativeSelectClass}
                    value={datumZaposlitve}
                    onChange={(e) => setDatumZaposlitve(e.target.value)}
                  />
                </div>
              </div>

              {/* Opombe */}
              <div className="space-y-1.5">
                <Label htmlFor="opombe">Opombe</Label>
                <textarea
                  id="opombe"
                  rows={2}
                  className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  value={opombe}
                  onChange={(e) => setOpombe(e.target.value)}
                  placeholder="Dodatne informacije o delavcu..."
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ────────────────────── SECTION 2: Tehnike varjenja ────────────────────── */}
      <Card>
        <CardContent className="p-0">
          <SectionHeader
            icon={Wrench}
            title="Tehnike varjenja"
            badge={tipiVarjenja.length}
            open={openSections.varjenje}
            onToggle={() => toggleSection('varjenje')}
          />
          {openSections.varjenje && (
            <div className="p-4">
              <p className="text-sm text-muted-foreground mb-3">
                Izberite vse tehnike varjenja, ki jih delavec obvlada:
              </p>
              <div className="flex flex-wrap gap-2">
                {WELDING_TYPES.map((wt) => {
                  const selected = tipiVarjenja.includes(wt as WeldingType);
                  return (
                    <button
                      key={wt}
                      type="button"
                      onClick={() => toggleWeldingType(wt as WeldingType)}
                      className={`rounded-full border px-4 py-1.5 text-sm font-medium transition-colors ${
                        selected
                          ? 'border-primary bg-primary text-primary-foreground'
                          : 'border-border bg-background hover:bg-muted'
                      }`}
                    >
                      {wt}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ────────────────────── SECTION 3: Dokumenti ────────────────────── */}
      <Card>
        <CardContent className="p-0">
          <SectionHeader
            icon={FileText}
            title="Dokumenti"
            badge={dokumenti.length}
            open={openSections.dokumenti}
            onToggle={() => toggleSection('dokumenti')}
          />
          {openSections.dokumenti && (
            <div className="space-y-4 p-4">
              <p className="text-sm text-muted-foreground">
                Dodajte dokumente delavca (TRC, delovno dovoljenje, certifikati...).
                Stanje in roke veljavnosti lahko dopolnite tudi kasneje.
              </p>

              {dokumenti.map((doc, idx) => (
                <div
                  key={idx}
                  className="relative space-y-3 rounded-lg border border-border p-4"
                >
                  {/* Remove button */}
                  <button
                    type="button"
                    onClick={() => removeDocRow(idx)}
                    className="absolute right-2 top-2 rounded-full p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                  >
                    <X className="h-4 w-4" />
                  </button>

                  {/* Tip + Naziv */}
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label>Tip dokumenta</Label>
                      <select
                        className={nativeSelectClass}
                        value={doc.tip}
                        onChange={(e) =>
                          updateDocRow(idx, 'tip', e.target.value)
                        }
                      >
                        {DOC_TYPES.map((dt) => (
                          <option key={dt.value} value={dt.value}>
                            {dt.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <Label>Naziv / oznaka</Label>
                      <Input
                        value={doc.naziv}
                        onChange={(e) =>
                          updateDocRow(idx, 'naziv', e.target.value)
                        }
                        placeholder="npr. TRC 2026"
                      />
                    </div>
                  </div>

                  {/* Datumi + Status */}
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <div className="space-y-1.5">
                      <Label>Datum izdaje</Label>
                      <input
                        type="date"
                        className={nativeSelectClass}
                        value={doc.datum_izdaje}
                        onChange={(e) =>
                          updateDocRow(idx, 'datum_izdaje', e.target.value)
                        }
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Datum poteka</Label>
                      <input
                        type="date"
                        className={nativeSelectClass}
                        value={doc.datum_poteka}
                        onChange={(e) =>
                          updateDocRow(idx, 'datum_poteka', e.target.value)
                        }
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Status veljavnosti</Label>
                      <select
                        className={nativeSelectClass}
                        value={doc.status_veljavnosti}
                        onChange={(e) =>
                          updateDocRow(idx, 'status_veljavnosti', e.target.value)
                        }
                      >
                        {VALIDITY_OPTIONS.map((v) => (
                          <option key={v.value} value={v.value}>
                            {v.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Opombe */}
                  <div className="space-y-1.5">
                    <Label>Opombe</Label>
                    <Input
                      value={doc.opombe}
                      onChange={(e) =>
                        updateDocRow(idx, 'opombe', e.target.value)
                      }
                      placeholder="Dodatne opombe k dokumentu..."
                    />
                  </div>
                </div>
              ))}

              {/* Quick-add buttons for common docs */}
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setDokumenti((prev) => [
                      ...prev,
                      { ...EMPTY_DOC, tip: 'trc', naziv: 'TRC (Dovoljenje za prebivanje)' },
                    ])
                  }
                >
                  <Plus className="mr-1 h-3.5 w-3.5" />
                  TRC
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setDokumenti((prev) => [
                      ...prev,
                      { ...EMPTY_DOC, tip: 'delovno_dovoljenje', naziv: 'Delovno dovoljenje' },
                    ])
                  }
                >
                  <Plus className="mr-1 h-3.5 w-3.5" />
                  Delovno dovoljenje
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setDokumenti((prev) => [
                      ...prev,
                      { ...EMPTY_DOC, tip: 'varilski_certifikat', naziv: 'Varilski certifikat' },
                    ])
                  }
                >
                  <Plus className="mr-1 h-3.5 w-3.5" />
                  Certifikat
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setDokumenti((prev) => [
                      ...prev,
                      { ...EMPTY_DOC, tip: 'potni_list', naziv: 'Potni list' },
                    ])
                  }
                >
                  <Plus className="mr-1 h-3.5 w-3.5" />
                  Potni list
                </Button>
                <Separator orientation="vertical" className="h-6" />
                <Button type="button" variant="ghost" size="sm" onClick={addDocRow}>
                  <Plus className="mr-1 h-3.5 w-3.5" />
                  Dodaj drug dokument
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ────────────────────── Sticky submit ────────────────────── */}
      <div className="fixed bottom-16 left-0 right-0 z-40 border-t bg-background/95 backdrop-blur-sm p-4 md:bottom-0">
        <div className="mx-auto flex max-w-screen-xl items-center justify-between gap-3">
          <p className="hidden text-sm text-muted-foreground sm:block">
            Samo ime je obvezno. Ostale podatke lahko dopolnite kasneje.
          </p>
          <Button type="submit" disabled={!ime.trim()} className="ml-auto">
            <Save className="mr-2 h-4 w-4" />
            Ustvari delavca
          </Button>
        </div>
      </div>
    </form>
  );
}
