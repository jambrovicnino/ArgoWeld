import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FileText,
  Search,
  AlertTriangle,
  CheckCircle2,
  Clock,
  HelpCircle,
  User,
  Plus,
  X,
  Save,
  Calendar,
  Shield,
  Filter,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PageHeader } from '@/components/common/PageHeader';
import { EmptyState } from '@/components/common/EmptyState';
import { useWorkersStore } from '@/stores/workersStore';
import { DOC_TYPES } from '@/lib/constants';
import { ROUTES } from '@/router/routes';
import { formatDate } from '@/lib/utils';
import type { WorkerDocument, DocType, ValidityStatus } from '@/types';

/* ─── Types ─── */
interface DocWithWorker extends WorkerDocument {
  worker_ime: string;
  worker_priimek: string;
  worker_id: number;
}

type DocFilter = 'vse' | DocType;
type StatusFilter = 'vse' | ValidityStatus;

const nativeSelectClass =
  'flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm';

const VALIDITY_OPTIONS: { value: ValidityStatus; label: string }[] = [
  { value: 'veljaven', label: 'Veljaven' },
  { value: 'poteka_kmalu', label: 'Poteče kmalu' },
  { value: 'potekel', label: 'Potekel' },
  { value: 'manjka', label: 'Manjka' },
];

/* ─── Helpers ─── */
function getStatusIcon(status: ValidityStatus) {
  switch (status) {
    case 'veljaven':
      return <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />;
    case 'poteka_kmalu':
      return <Clock className="h-3.5 w-3.5 text-amber-500" />;
    case 'potekel':
      return <AlertTriangle className="h-3.5 w-3.5 text-red-500" />;
    case 'manjka':
      return <HelpCircle className="h-3.5 w-3.5 text-gray-400" />;
  }
}

function getStatusBadgeVariant(status: ValidityStatus): 'success' | 'warning' | 'destructive' | 'outline' {
  switch (status) {
    case 'veljaven': return 'success';
    case 'poteka_kmalu': return 'warning';
    case 'potekel': return 'destructive';
    case 'manjka': return 'outline';
  }
}

function getStatusLabel(status: ValidityStatus): string {
  return VALIDITY_OPTIONS.find((v) => v.value === status)?.label ?? status;
}

function getDocTypeLabel(tip: DocType): string {
  return DOC_TYPES.find((d) => d.value === tip)?.label ?? tip;
}

/* ─── Main component ─── */
export function DokumentiPage(): React.JSX.Element {
  const { delavci, addDocument } = useWorkersStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [docFilter, setDocFilter] = useState<DocFilter>('vse');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('vse');
  const [showAddForm, setShowAddForm] = useState(false);

  // Add-form state
  const [newWorker, setNewWorker] = useState('');
  const [newTip, setNewTip] = useState<DocType>('trc');
  const [newNaziv, setNewNaziv] = useState('');
  const [newIzdaja, setNewIzdaja] = useState('');
  const [newPotek, setNewPotek] = useState('');
  const [newStatus, setNewStatus] = useState<ValidityStatus>('veljaven');
  const [newOpombe, setNewOpombe] = useState('');

  // Flatten all docs from all workers
  const allDocs = useMemo<DocWithWorker[]>(() => {
    const docs: DocWithWorker[] = [];
    for (const d of delavci) {
      for (const doc of d.dokumenti) {
        docs.push({
          ...doc,
          worker_ime: d.ime,
          worker_priimek: d.priimek,
          worker_id: d.id,
        });
      }
    }
    // Sort: expired first, then expiring, then others
    const order: Record<string, number> = { potekel: 0, poteka_kmalu: 1, manjka: 2, veljaven: 3 };
    docs.sort((a, b) => (order[a.status_veljavnosti] ?? 4) - (order[b.status_veljavnosti] ?? 4));
    return docs;
  }, [delavci]);

  // Stats
  const stats = useMemo(() => {
    const total = allDocs.length;
    const valid = allDocs.filter((d) => d.status_veljavnosti === 'veljaven').length;
    const expiring = allDocs.filter((d) => d.status_veljavnosti === 'poteka_kmalu').length;
    const expired = allDocs.filter((d) => d.status_veljavnosti === 'potekel').length;
    const missing = allDocs.filter((d) => d.status_veljavnosti === 'manjka').length;
    return { total, valid, expiring, expired, missing };
  }, [allDocs]);

  // Filter
  const filteredDocs = useMemo(() => {
    return allDocs.filter((doc) => {
      if (docFilter !== 'vse' && doc.tip !== docFilter) return false;
      if (statusFilter !== 'vse' && doc.status_veljavnosti !== statusFilter) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const workerName = `${doc.worker_ime} ${doc.worker_priimek}`.toLowerCase();
        const docName = (doc.naziv || '').toLowerCase();
        if (!workerName.includes(q) && !docName.includes(q)) return false;
      }
      return true;
    });
  }, [allDocs, docFilter, statusFilter, searchQuery]);

  // Submit new doc
  const handleAddDoc = () => {
    if (!newWorker) return;
    const workerId = Number(newWorker);
    addDocument(workerId, {
      tip: newTip,
      naziv: newNaziv.trim() || getDocTypeLabel(newTip),
      datum_izdaje: newIzdaja || undefined,
      datum_poteka: newPotek || undefined,
      status_veljavnosti: newStatus,
      opombe: newOpombe.trim() || undefined,
    });
    // Reset
    setNewNaziv('');
    setNewIzdaja('');
    setNewPotek('');
    setNewStatus('veljaven');
    setNewOpombe('');
    setShowAddForm(false);
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Dokumenti" description="Arhiv vseh dokumentov delavcev">
        <Button onClick={() => setShowAddForm(!showAddForm)}>
          {showAddForm ? <X className="mr-2 h-4 w-4" /> : <Plus className="mr-2 h-4 w-4" />}
          {showAddForm ? 'Prekliči' : 'Dodaj dokument'}
        </Button>
      </PageHeader>

      {/* ── Add document form ── */}
      {showAddForm && (
        <Card className="border-primary/30 bg-primary/[0.02]">
          <CardContent className="p-4 space-y-4">
            <p className="font-semibold text-sm flex items-center gap-1.5">
              <Plus className="h-4 w-4 text-primary" />
              Nov dokument
            </p>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {/* Worker */}
              <div className="space-y-1.5">
                <Label>
                  <User className="mr-1 inline h-3.5 w-3.5" />
                  Delavec <span className="text-destructive">*</span>
                </Label>
                <select className={nativeSelectClass} value={newWorker} onChange={(e) => setNewWorker(e.target.value)}>
                  <option value="">Izberi delavca...</option>
                  {delavci.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.ime} {d.priimek}
                    </option>
                  ))}
                </select>
              </div>

              {/* Tip */}
              <div className="space-y-1.5">
                <Label>
                  <Shield className="mr-1 inline h-3.5 w-3.5" />
                  Tip dokumenta
                </Label>
                <select className={nativeSelectClass} value={newTip} onChange={(e) => setNewTip(e.target.value as DocType)}>
                  {DOC_TYPES.map((dt) => (
                    <option key={dt.value} value={dt.value}>{dt.label}</option>
                  ))}
                </select>
              </div>

              {/* Naziv */}
              <div className="space-y-1.5">
                <Label>Naziv / oznaka</Label>
                <Input value={newNaziv} onChange={(e) => setNewNaziv(e.target.value)} placeholder="npr. TRC 2026" />
              </div>

              {/* Datum izdaje */}
              <div className="space-y-1.5">
                <Label>Datum izdaje</Label>
                <input type="date" className={nativeSelectClass} value={newIzdaja} onChange={(e) => setNewIzdaja(e.target.value)} />
              </div>

              {/* Datum poteka */}
              <div className="space-y-1.5">
                <Label>Datum poteka</Label>
                <input type="date" className={nativeSelectClass} value={newPotek} onChange={(e) => setNewPotek(e.target.value)} />
              </div>

              {/* Status */}
              <div className="space-y-1.5">
                <Label>Status veljavnosti</Label>
                <select className={nativeSelectClass} value={newStatus} onChange={(e) => setNewStatus(e.target.value as ValidityStatus)}>
                  {VALIDITY_OPTIONS.map((v) => (
                    <option key={v.value} value={v.value}>{v.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Opombe + submit */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
              <div className="flex-1 space-y-1.5">
                <Label>Opombe</Label>
                <Input value={newOpombe} onChange={(e) => setNewOpombe(e.target.value)} placeholder="Dodatne opombe..." />
              </div>
              <Button onClick={handleAddDoc} disabled={!newWorker} className="shrink-0">
                <Save className="mr-2 h-4 w-4" />
                Shrani dokument
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Stats ── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        <StatCard label="Skupaj" value={stats.total} icon={FileText} color="text-foreground" />
        <StatCard label="Veljavni" value={stats.valid} icon={CheckCircle2} color="text-emerald-600" />
        <StatCard label="Potečejo" value={stats.expiring} icon={Clock} color="text-amber-600" />
        <StatCard label="Potekli" value={stats.expired} icon={AlertTriangle} color="text-red-600" />
        <StatCard label="Manjkajoči" value={stats.missing} icon={HelpCircle} color="text-gray-500" />
      </div>

      {/* ── Filters ── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Iskanje po delavcu ali dokumentu..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          {/* Status filter pills */}
          <button
            type="button"
            onClick={() => setStatusFilter('vse')}
            className="focus-visible:outline-none rounded-full"
          >
            <Badge variant={statusFilter === 'vse' ? 'default' : 'outline'} className="cursor-pointer">
              Vsi ({allDocs.length})
            </Badge>
          </button>
          {VALIDITY_OPTIONS.map((v) => {
            const count = allDocs.filter((d) => d.status_veljavnosti === v.value).length;
            return (
              <button
                key={v.value}
                type="button"
                onClick={() => setStatusFilter(statusFilter === v.value ? 'vse' : v.value)}
                className="focus-visible:outline-none rounded-full"
              >
                <Badge
                  variant={statusFilter === v.value ? 'default' : 'outline'}
                  className="cursor-pointer"
                >
                  {v.label} ({count})
                </Badge>
              </button>
            );
          })}
        </div>
      </div>

      {/* Doc type filter */}
      <div className="flex flex-wrap gap-2 items-center">
        <Filter className="h-3.5 w-3.5 text-muted-foreground" />
        <button type="button" onClick={() => setDocFilter('vse')} className="focus-visible:outline-none rounded-full">
          <Badge variant={docFilter === 'vse' ? 'default' : 'outline'} className="cursor-pointer text-[11px]">
            Vsi tipi
          </Badge>
        </button>
        {DOC_TYPES.map((dt) => {
          const count = allDocs.filter((d) => d.tip === dt.value).length;
          if (count === 0) return null;
          return (
            <button
              key={dt.value}
              type="button"
              onClick={() => setDocFilter(docFilter === dt.value ? 'vse' : dt.value as DocFilter)}
              className="focus-visible:outline-none rounded-full"
            >
              <Badge
                variant={docFilter === dt.value ? 'default' : 'outline'}
                className="cursor-pointer text-[11px]"
              >
                {dt.label} ({count})
              </Badge>
            </button>
          );
        })}
      </div>

      {/* ── Document list ── */}
      {filteredDocs.length === 0 ? (
        <EmptyState
          title="Ni dokumentov"
          description="Prilagodite filtre ali dodajte nove dokumente."
          icon={FileText}
        />
      ) : (
        <div className="space-y-2">
          {filteredDocs.map((doc) => (
            <Card key={`${doc.worker_id}-${doc.id}`} className="hover:shadow-sm transition-shadow">
              <CardContent className="py-3 px-4">
                <div className="flex items-center gap-3">
                  {/* Status icon */}
                  <div className="shrink-0">{getStatusIcon(doc.status_veljavnosti)}</div>

                  {/* Main info */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-sm truncate">{doc.naziv || getDocTypeLabel(doc.tip)}</span>
                      <Badge variant="secondary" className="text-[10px]">{getDocTypeLabel(doc.tip)}</Badge>
                    </div>
                    <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-0.5 text-xs text-muted-foreground">
                      <Link
                        to={ROUTES.DELAVEC_DETAIL(doc.worker_id)}
                        className="flex items-center gap-1 hover:text-primary transition-colors"
                      >
                        <User className="h-3 w-3" />
                        {doc.worker_ime} {doc.worker_priimek}
                      </Link>
                      {doc.datum_izdaje && (
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          Izdaja: {formatDate(doc.datum_izdaje)}
                        </span>
                      )}
                      {doc.datum_poteka && (
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          Potek: {formatDate(doc.datum_poteka)}
                        </span>
                      )}
                      {doc.opombe && <span className="italic">{doc.opombe}</span>}
                    </div>
                  </div>

                  {/* Status badge */}
                  <Badge variant={getStatusBadgeVariant(doc.status_veljavnosti)} className="shrink-0 text-[10px]">
                    {getStatusLabel(doc.status_veljavnosti)}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── Sub-components ─── */
function StatCard({ label, value, icon: Icon, color }: { label: string; value: number; icon: React.ElementType; color: string }) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3 p-4">
        <div className={color}><Icon className="h-5 w-5" /></div>
        <div>
          <p className="text-2xl font-bold">{value}</p>
          <p className="text-xs text-muted-foreground">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}
