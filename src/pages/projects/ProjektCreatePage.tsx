import { useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Save,
  Plus,
  FileText,
  Users,
  Car,
  Euro,
  Handshake,
  X,
  Search,
  ChevronDown,
  ChevronUp,
  User,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { StatusBadge } from '@/components/common/StatusBadge';
import { useProjectsStore } from '@/stores/projectsStore';
import { useWorkersStore } from '@/stores/workersStore';
import { useVehiclesStore } from '@/stores/vehiclesStore';
import { COUNTRIES, PROJECT_PHASES, WELDING_TYPES } from '@/lib/constants';
import { ROUTES } from '@/router/routes';
import type { ProjectPhase, BudgetBreakdown, WorkerAssignment } from '@/types';

const BUDGET_LABELS: Record<keyof BudgetBreakdown, string> = {
  delo: 'Delo',
  transport: 'Transport',
  nastanitev: 'Nastanitev',
  orodje: 'Orodje',
  dnevnice: 'Dnevnice',
  drugo: 'Drugo',
};

const nativeSelectClass =
  'flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm';

interface PartnerRow {
  naziv: string;
  kontakt: string;
  status: 'aktiven' | 'v_dogovoru';
  opombe?: string;
}

interface NewWorkerForm {
  ime: string;
  priimek: string;
  narodnost: string;
  tipiVarjenja: string[];
}

export function ProjektCreatePage() {
  const navigate = useNavigate();
  const { addProjekt } = useProjectsStore();
  const { delavci, addDelavec } = useWorkersStore();
  const { vozila } = useVehiclesStore();

  // Section 1: Osnovni podatki
  const [naziv, setNaziv] = useState('');
  const [lokacija, setLokacija] = useState('');
  const [drzava, setDrzava] = useState('');
  const [narocnik, setNarocnik] = useState('');
  const [faza, setFaza] = useState<string>('mobilizacija');
  const [zacetek, setZacetek] = useState('');
  const [konec, setKonec] = useState('');
  const [opombe, setOpombe] = useState('');

  // Section 2: Delavci
  const [razporeditve, setRazporeditve] = useState<WorkerAssignment[]>([]);
  const [workerSearchOpen, setWorkerSearchOpen] = useState(false);
  const [workerSearch, setWorkerSearch] = useState('');
  const [newWorkerOpen, setNewWorkerOpen] = useState(false);
  const [newWorker, setNewWorker] = useState<NewWorkerForm>({
    ime: '',
    priimek: '',
    narodnost: '',
    tipiVarjenja: [],
  });

  // Section 3: Proracun
  const [proracun, setProracun] = useState<BudgetBreakdown>({
    delo: 0,
    transport: 0,
    nastanitev: 0,
    orodje: 0,
    dnevnice: 0,
    drugo: 0,
  });

  // Section 4: Vozila
  const [selectedVehicleIds, setSelectedVehicleIds] = useState<number[]>([]);

  // Section 5: Partnerji
  const [partnerji, setPartnerji] = useState<PartnerRow[]>([]);

  // Collapsible sections
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    osnovni: true,
    delavci: true,
    proracun: false,
    vozila: false,
    partnerji: false,
  });

  const toggleSection = (key: string) => {
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // Budget total
  const budgetTotal = useMemo(
    () => Object.values(proracun).reduce((sum, v) => sum + v, 0),
    [proracun]
  );

  // Filtered workers for search
  const filteredWorkers = useMemo(() => {
    const assignedIds = new Set(razporeditve.map((r) => r.delavec_id));
    const q = workerSearch.toLowerCase();
    return delavci.filter(
      (d) =>
        !assignedIds.has(d.id) &&
        (`${d.ime} ${d.priimek}`.toLowerCase().includes(q) || q === '')
    );
  }, [delavci, razporeditve, workerSearch]);

  const today = new Date().toISOString().split('T')[0];

  // Assign worker
  const assignWorker = (workerId: number, workerName: string) => {
    setRazporeditve((prev) => [
      ...prev,
      {
        id: Date.now(),
        delavec_id: workerId,
        delavec_ime: workerName,
        od: today,
        vloga: '',
      },
    ]);
    setWorkerSearchOpen(false);
    setWorkerSearch('');
  };

  // Remove worker
  const removeWorker = (assignmentId: number) => {
    setRazporeditve((prev) => prev.filter((r) => r.id !== assignmentId));
  };

  // Update worker assignment
  const updateAssignment = (
    assignmentId: number,
    field: 'vloga' | 'od',
    value: string
  ) => {
    setRazporeditve((prev) =>
      prev.map((r) => (r.id === assignmentId ? { ...r, [field]: value } : r))
    );
  };

  // Save new worker
  const saveNewWorker = () => {
    if (!newWorker.ime.trim() || !newWorker.priimek.trim()) return;

    // addDelavec uses Date.now() for id internally
    const expectedId = Date.now();
    addDelavec({
      ime: newWorker.ime.trim(),
      priimek: newWorker.priimek.trim(),
      narodnost: newWorker.narodnost,
      telefon: '',
      email: '',
      urna_postavka: 0,
      tipi_varjenja: newWorker.tipiVarjenja as WorkerAssignment extends never
        ? never
        : typeof newWorker.tipiVarjenja,
      trenutni_projekt_id: null,
      status: 'zaposlen',
      datum_zaposlitve: today,
      opombe: '',
    });

    // Auto-assign the new worker
    // We need to find the worker by the id that was just created
    // Since addDelavec uses Date.now(), we use expectedId as approximation
    // But safer: find by name match on latest entry
    const fullName = `${newWorker.ime.trim()} ${newWorker.priimek.trim()}`;
    setRazporeditve((prev) => [
      ...prev,
      {
        id: Date.now() + 1,
        delavec_id: expectedId,
        delavec_ime: fullName,
        od: today,
        vloga: '',
      },
    ]);

    setNewWorker({ ime: '', priimek: '', narodnost: '', tipiVarjenja: [] });
    setNewWorkerOpen(false);
  };

  // Toggle welding type for new worker
  const toggleWeldingType = (wt: string) => {
    setNewWorker((prev) => ({
      ...prev,
      tipiVarjenja: prev.tipiVarjenja.includes(wt)
        ? prev.tipiVarjenja.filter((t) => t !== wt)
        : [...prev.tipiVarjenja, wt],
    }));
  };

  // Toggle vehicle
  const toggleVehicle = (vehicleId: number) => {
    setSelectedVehicleIds((prev) =>
      prev.includes(vehicleId)
        ? prev.filter((id) => id !== vehicleId)
        : [...prev, vehicleId]
    );
  };

  // Update budget field
  const updateBudget = (field: keyof BudgetBreakdown, value: string) => {
    setProracun((prev) => ({
      ...prev,
      [field]: parseFloat(value) || 0,
    }));
  };

  // Add partner
  const addPartner = () => {
    setPartnerji((prev) => [
      ...prev,
      { naziv: '', kontakt: '', status: 'aktiven' as const },
    ]);
  };

  // Update partner
  const updatePartner = (
    index: number,
    field: keyof PartnerRow,
    value: string
  ) => {
    setPartnerji((prev) =>
      prev.map((p, i) => (i === index ? { ...p, [field]: value } : p))
    );
  };

  // Remove partner
  const removePartner = (index: number) => {
    setPartnerji((prev) => prev.filter((_, i) => i !== index));
  };

  // Submit
  const handleSubmit = () => {
    if (!naziv.trim()) return;
    const id = addProjekt({
      naziv: naziv.trim(),
      lokacija,
      drzava,
      narocnik,
      faza: faza as ProjectPhase,
      zacetek,
      konec,
      napredek: 0,
      proracun,
      dejanski_stroski: {
        delo: 0,
        transport: 0,
        nastanitev: 0,
        orodje: 0,
        dnevnice: 0,
        drugo: 0,
      },
      delavci_ids: razporeditve.map((r) => r.delavec_id),
      razporeditve,
      partnerji: partnerji.map((p, i) => ({ ...p, id: Date.now() + i })),
      opombe,
    });
    navigate(ROUTES.PROJEKT_DETAIL(id));
  };

  // Section header component
  const SectionHeader = ({
    sectionKey,
    icon: Icon,
    title,
    badgeText,
  }: {
    sectionKey: string;
    icon: React.ElementType;
    title: string;
    badgeText?: string;
  }) => (
    <button
      type="button"
      className="flex w-full items-center justify-between p-4"
      onClick={() => toggleSection(sectionKey)}
    >
      <div className="flex items-center gap-2">
        <Icon className="h-5 w-5 text-muted-foreground" />
        <span className="text-base font-semibold">{title}</span>
        {!openSections[sectionKey] && badgeText && (
          <Badge variant="secondary" className="ml-2">
            {badgeText}
          </Badge>
        )}
      </div>
      {openSections[sectionKey] ? (
        <ChevronUp className="h-4 w-4 text-muted-foreground" />
      ) : (
        <ChevronDown className="h-4 w-4 text-muted-foreground" />
      )}
    </button>
  );

  return (
    <div className="pb-24">
      {/* Page header */}
      <div className="mb-6 flex items-center gap-3">
        <Link to={ROUTES.PROJEKTI}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Nov projekt</h1>
          <p className="text-sm text-muted-foreground">
            Izpolnite podatke za nov projekt
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {/* Section 1: Osnovni podatki */}
        <Card>
          <SectionHeader
            sectionKey="osnovni"
            icon={FileText}
            title="Osnovni podatki"
          />
          {openSections.osnovni && (
            <CardContent className="space-y-4">
              <Separator className="mb-4" />
              <div>
                <Label htmlFor="naziv">
                  Naziv projekta <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="naziv"
                  placeholder="Ime projekta"
                  value={naziv}
                  onChange={(e) => setNaziv(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="lokacija">Lokacija</Label>
                  <Input
                    id="lokacija"
                    placeholder="Lokacija projekta"
                    value={lokacija}
                    onChange={(e) => setLokacija(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="drzava">Država</Label>
                  <select
                    id="drzava"
                    className={nativeSelectClass}
                    value={drzava}
                    onChange={(e) => setDrzava(e.target.value)}
                  >
                    <option value="">Izberite državo</option>
                    {COUNTRIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="narocnik">Naročnik</Label>
                  <Input
                    id="narocnik"
                    placeholder="Ime naročnika"
                    value={narocnik}
                    onChange={(e) => setNarocnik(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="faza">Faza</Label>
                  <select
                    id="faza"
                    className={nativeSelectClass}
                    value={faza}
                    onChange={(e) => setFaza(e.target.value)}
                  >
                    {PROJECT_PHASES.map((p) => (
                      <option key={p.value} value={p.value}>
                        {p.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="zacetek">Začetek</Label>
                  <input
                    id="zacetek"
                    type="date"
                    className={nativeSelectClass}
                    value={zacetek}
                    onChange={(e) => setZacetek(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="konec">Konec</Label>
                  <input
                    id="konec"
                    type="date"
                    className={nativeSelectClass}
                    value={konec}
                    onChange={(e) => setKonec(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="opombe">Opombe</Label>
                <textarea
                  id="opombe"
                  className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  placeholder="Dodatne opombe..."
                  value={opombe}
                  onChange={(e) => setOpombe(e.target.value)}
                />
              </div>
            </CardContent>
          )}
        </Card>

        {/* Section 2: Delavci */}
        <Card>
          <SectionHeader
            sectionKey="delavci"
            icon={Users}
            title="Delavci"
            badgeText={
              razporeditve.length > 0
                ? `${razporeditve.length} ${razporeditve.length === 1 ? 'delavec' : razporeditve.length === 2 ? 'delavca' : razporeditve.length < 5 ? 'delavci' : 'delavcev'}`
                : undefined
            }
          />
          {openSections.delavci && (
            <CardContent className="space-y-4">
              <Separator className="mb-4" />

              {/* Assigned workers */}
              {razporeditve.map((assignment) => {
                const worker = delavci.find(
                  (d) => d.id === assignment.delavec_id
                );
                return (
                  <div
                    key={assignment.id}
                    className="rounded-lg border p-3 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">
                          {assignment.delavec_ime}
                        </span>
                        {worker && <StatusBadge status={worker.status} />}
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => removeWorker(assignment.id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                      <div>
                        <Label className="text-xs">Vloga</Label>
                        <Input
                          placeholder="Vloga na projektu"
                          value={assignment.vloga || ''}
                          onChange={(e) =>
                            updateAssignment(
                              assignment.id,
                              'vloga',
                              e.target.value
                            )
                          }
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Od</Label>
                        <input
                          type="date"
                          className={nativeSelectClass}
                          value={assignment.od}
                          onChange={(e) =>
                            updateAssignment(
                              assignment.id,
                              'od',
                              e.target.value
                            )
                          }
                        />
                      </div>
                    </div>
                    {/* Worker documents */}
                    {worker && worker.dokumenti.length > 0 && (
                      <div className="mt-2">
                        <p className="text-xs text-muted-foreground mb-1">
                          Dokumenti:
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {worker.dokumenti.map((doc) => (
                            <div
                              key={doc.id}
                              className="flex items-center gap-1 text-xs"
                            >
                              <span>{doc.naziv}</span>
                              <StatusBadge
                                status={doc.status_veljavnosti}
                                className="text-[10px] px-1 py-0"
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Add existing worker */}
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setWorkerSearchOpen(!workerSearchOpen);
                    setNewWorkerOpen(false);
                  }}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Dodaj delavca
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setNewWorkerOpen(!newWorkerOpen);
                    setWorkerSearchOpen(false);
                  }}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Nov delavec
                </Button>
              </div>

              {/* Worker search */}
              {workerSearchOpen && (
                <div className="rounded-lg border p-3 space-y-2">
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Iskanje delavcev..."
                      className="pl-8"
                      value={workerSearch}
                      onChange={(e) => setWorkerSearch(e.target.value)}
                    />
                  </div>
                  <div className="max-h-48 overflow-y-auto space-y-1">
                    {filteredWorkers.length === 0 ? (
                      <p className="text-sm text-muted-foreground py-2 text-center">
                        Ni rezultatov
                      </p>
                    ) : (
                      filteredWorkers.map((w) => (
                        <button
                          key={w.id}
                          type="button"
                          className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-accent text-left"
                          onClick={() =>
                            assignWorker(w.id, `${w.ime} ${w.priimek}`)
                          }
                        >
                          <User className="h-3.5 w-3.5 text-muted-foreground" />
                          <span>
                            {w.ime} {w.priimek}
                          </span>
                          <StatusBadge
                            status={w.status}
                            className="ml-auto text-[10px]"
                          />
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* New worker mini-form */}
              {newWorkerOpen && (
                <div className="rounded-lg border p-3 space-y-3">
                  <p className="text-sm font-medium">Nov delavec</p>
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    <div>
                      <Label className="text-xs">Ime</Label>
                      <Input
                        placeholder="Ime"
                        value={newWorker.ime}
                        onChange={(e) =>
                          setNewWorker((prev) => ({
                            ...prev,
                            ime: e.target.value,
                          }))
                        }
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Priimek</Label>
                      <Input
                        placeholder="Priimek"
                        value={newWorker.priimek}
                        onChange={(e) =>
                          setNewWorker((prev) => ({
                            ...prev,
                            priimek: e.target.value,
                          }))
                        }
                      />
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs">Narodnost</Label>
                    <Input
                      placeholder="Narodnost"
                      value={newWorker.narodnost}
                      onChange={(e) =>
                        setNewWorker((prev) => ({
                          ...prev,
                          narodnost: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Tipi varjenja</Label>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {WELDING_TYPES.map((wt) => (
                        <label
                          key={wt}
                          className="flex items-center gap-1.5 text-sm"
                        >
                          <input
                            type="checkbox"
                            checked={newWorker.tipiVarjenja.includes(wt)}
                            onChange={() => toggleWeldingType(wt)}
                            className="rounded border-input"
                          />
                          {wt}
                        </label>
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      size="sm"
                      onClick={saveNewWorker}
                      disabled={
                        !newWorker.ime.trim() || !newWorker.priimek.trim()
                      }
                    >
                      <Save className="h-4 w-4 mr-1" />
                      Shrani
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setNewWorkerOpen(false)}
                    >
                      Prekliči
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          )}
        </Card>

        {/* Section 3: Proračun */}
        <Card>
          <SectionHeader
            sectionKey="proracun"
            icon={Euro}
            title="Proračun"
            badgeText={
              budgetTotal > 0
                ? `${budgetTotal.toLocaleString('sl-SI')} EUR`
                : undefined
            }
          />
          {openSections.proracun && (
            <CardContent className="space-y-4">
              <Separator className="mb-4" />
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {(Object.keys(BUDGET_LABELS) as (keyof BudgetBreakdown)[]).map(
                  (key) => (
                    <div key={key}>
                      <Label htmlFor={`budget-${key}`}>
                        {BUDGET_LABELS[key]}
                      </Label>
                      <div className="relative">
                        <input
                          id={`budget-${key}`}
                          type="number"
                          min="0"
                          step="100"
                          className={nativeSelectClass + ' pr-12'}
                          value={proracun[key] || ''}
                          onChange={(e) => updateBudget(key, e.target.value)}
                          placeholder="0"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                          EUR
                        </span>
                      </div>
                    </div>
                  )
                )}
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Skupaj:</span>
                <span className="text-lg font-bold">
                  {budgetTotal.toLocaleString('sl-SI')} EUR
                </span>
              </div>
            </CardContent>
          )}
        </Card>

        {/* Section 4: Vozila */}
        <Card>
          <SectionHeader
            sectionKey="vozila"
            icon={Car}
            title="Vozila"
            badgeText={
              selectedVehicleIds.length > 0
                ? `${selectedVehicleIds.length} ${selectedVehicleIds.length === 1 ? 'vozilo' : selectedVehicleIds.length === 2 ? 'vozili' : selectedVehicleIds.length < 5 ? 'vozila' : 'vozil'}`
                : undefined
            }
          />
          {openSections.vozila && (
            <CardContent>
              <Separator className="mb-4" />
              {vozila.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Ni registriranih vozil
                </p>
              ) : (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {vozila.map((v) => {
                    const selected = selectedVehicleIds.includes(v.id);
                    return (
                      <button
                        key={v.id}
                        type="button"
                        className={`rounded-lg border-2 p-3 text-left transition-colors ${
                          selected
                            ? 'border-primary bg-primary/5'
                            : 'border-border hover:border-muted-foreground/50'
                        }`}
                        onClick={() => toggleVehicle(v.id)}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-sm">
                            {v.naziv}
                          </span>
                          <Badge variant={v.tip === 'lastno' ? 'default' : 'secondary'}>
                            {v.tip === 'lastno' ? 'Lastno' : 'Najem'}
                          </Badge>
                        </div>
                        <p className="mt-1 font-mono text-xs text-muted-foreground">
                          {v.registrska}
                        </p>
                      </button>
                    );
                  })}
                </div>
              )}
            </CardContent>
          )}
        </Card>

        {/* Section 5: Partnerji */}
        <Card>
          <SectionHeader
            sectionKey="partnerji"
            icon={Handshake}
            title="Partnerji"
            badgeText={
              partnerji.length > 0
                ? `${partnerji.length} ${partnerji.length === 1 ? 'partner' : partnerji.length === 2 ? 'partnerja' : partnerji.length < 5 ? 'partnerji' : 'partnerjev'}`
                : undefined
            }
          />
          {openSections.partnerji && (
            <CardContent className="space-y-3">
              <Separator className="mb-4" />
              {partnerji.map((partner, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-2 rounded-lg border p-3"
                >
                  <div className="flex-1 grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <div>
                      <Label className="text-xs">Naziv</Label>
                      <Input
                        placeholder="Ime podjetja"
                        value={partner.naziv}
                        onChange={(e) =>
                          updatePartner(idx, 'naziv', e.target.value)
                        }
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Kontakt</Label>
                      <Input
                        placeholder="Email / telefon"
                        value={partner.kontakt}
                        onChange={(e) =>
                          updatePartner(idx, 'kontakt', e.target.value)
                        }
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Status</Label>
                      <select
                        className={nativeSelectClass}
                        value={partner.status}
                        onChange={(e) =>
                          updatePartner(idx, 'status', e.target.value)
                        }
                      >
                        <option value="aktiven">Aktiven</option>
                        <option value="v_dogovoru">V dogovoru</option>
                      </select>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 mt-5"
                    onClick={() => removePartner(idx)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addPartner}
              >
                <Plus className="h-4 w-4 mr-1" />
                Dodaj partnerja
              </Button>
            </CardContent>
          )}
        </Card>
      </div>

      {/* Sticky bottom bar — above mobile nav */}
      <div className="fixed bottom-16 md:bottom-0 left-0 right-0 z-50 border-t bg-background p-4">
        <div className="mx-auto flex max-w-5xl justify-end">
          <Button
            onClick={handleSubmit}
            disabled={!naziv.trim()}
            className="gap-2"
          >
            <Save className="h-4 w-4" />
            Ustvari projekt
          </Button>
        </div>
      </div>
    </div>
  );
}
