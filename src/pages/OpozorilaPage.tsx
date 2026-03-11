import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  AlertCircle,
  Info,
  FileWarning,
  Euro,
  Shield,
  Clock,
  ArrowRight,
  CheckCircle2,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useWorkersStore } from '@/stores/workersStore';
import { useProjectsStore } from '@/stores/projectsStore';
import { ALERT_THRESHOLDS, DOC_TYPES } from '@/lib/constants';
import { ROUTES } from '@/router/routes';
import type { Alert } from '@/types';
import type { BudgetBreakdown } from '@/types';

type SeverityFilter = 'vsa' | 'kriticno' | 'opozorilo' | 'informacija';

function sumBudget(b: BudgetBreakdown): number {
  return Object.values(b).reduce((a, c) => a + c, 0);
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('sl-SI', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function formatEur(amount: number): string {
  return new Intl.NumberFormat('sl-SI', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function getDocTypeLabel(tipValue: string): string {
  const docType = DOC_TYPES.find((d) => d.value === tipValue);
  return docType?.label ?? tipValue;
}

function getSeverityIcon(resnost: Alert['resnost']): React.JSX.Element {
  switch (resnost) {
    case 'kriticno':
      return <AlertCircle className="h-5 w-5 text-red-600 shrink-0" />;
    case 'opozorilo':
      return <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" />;
    case 'informacija':
      return <Info className="h-5 w-5 text-blue-600 shrink-0" />;
  }
}

function getSeverityBorderClass(resnost: Alert['resnost']): string {
  switch (resnost) {
    case 'kriticno':
      return 'border-l-4 border-l-red-500 bg-red-50/50';
    case 'opozorilo':
      return 'border-l-4 border-l-amber-500 bg-amber-50/50';
    case 'informacija':
      return 'border-l-4 border-l-blue-500 bg-blue-50/50';
  }
}

function getSeverityBadge(resnost: Alert['resnost']): React.JSX.Element {
  switch (resnost) {
    case 'kriticno':
      return <Badge variant="destructive">Kritično</Badge>;
    case 'opozorilo':
      return <Badge variant="warning">Opozorilo</Badge>;
    case 'informacija':
      return <Badge variant="accent">Informacija</Badge>;
  }
}

function getAlertIcon(tip: Alert['tip']): React.JSX.Element {
  switch (tip) {
    case 'trc_potekel':
    case 'trc_poteka':
      return <Shield className="h-4 w-4 text-muted-foreground" />;
    case 'certifikat_potekel':
    case 'certifikat_poteka':
      return <FileWarning className="h-4 w-4 text-muted-foreground" />;
    case 'proracun_prekoracen':
    case 'proracun_opozorilo':
      return <Euro className="h-4 w-4 text-muted-foreground" />;
    case 'manjkajoci_dokumenti':
      return <Clock className="h-4 w-4 text-muted-foreground" />;
  }
}

export function OpozorilaPage(): React.JSX.Element {
  const { delavci } = useWorkersStore();
  const { projekti } = useProjectsStore();
  const [activeFilter, setActiveFilter] = useState<SeverityFilter>('vsa');

  const alerts = useMemo((): Alert[] => {
    const result: Alert[] = [];

    for (const delavec of delavci) {
      const fullName = `${delavec.ime} ${delavec.priimek}`;
      const hasTrc = delavec.dokumenti.some((doc) => doc.tip === 'trc');
      const hasCert = delavec.dokumenti.some((doc) => doc.tip === 'varilski_certifikat');

      for (const doc of delavec.dokumenti) {
        if (doc.tip === 'trc' && doc.status_veljavnosti === 'potekel') {
          result.push({
            id: `trc-exp-${delavec.id}-${doc.id}`,
            tip: 'trc_potekel',
            resnost: 'kriticno',
            naslov: `TRC potekel: ${fullName}`,
            opis: doc.datum_poteka
              ? `Dovoljenje za prebivanje je poteklo dne ${formatDate(doc.datum_poteka)}. Delavec ne sme delati brez veljavnega TRC.`
              : 'Dovoljenje za prebivanje je poteklo. Delavec ne sme delati brez veljavnega TRC.',
            povezava: ROUTES.DELAVEC_DETAIL(delavec.id),
          });
        }

        if (doc.tip === 'trc' && doc.status_veljavnosti === 'poteka_kmalu') {
          result.push({
            id: `trc-warn-${delavec.id}-${doc.id}`,
            tip: 'trc_poteka',
            resnost: 'opozorilo',
            naslov: `TRC poteka kmalu: ${fullName}`,
            opis: doc.datum_poteka
              ? `Dovoljenje za prebivanje poteka dne ${formatDate(doc.datum_poteka)}. Pričnite s podaljšanjem pravočasno.`
              : 'Dovoljenje za prebivanje poteka kmalu. Pričnite s podaljšanjem pravočasno.',
            povezava: ROUTES.DELAVEC_DETAIL(delavec.id),
          });
        }

        if (doc.tip === 'varilski_certifikat' && doc.status_veljavnosti === 'potekel') {
          result.push({
            id: `cert-exp-${delavec.id}-${doc.id}`,
            tip: 'certifikat_potekel',
            resnost: 'kriticno',
            naslov: `Varilski certifikat potekel: ${fullName}`,
            opis: doc.datum_poteka
              ? `Certifikat "${doc.naziv}" je potekel dne ${formatDate(doc.datum_poteka)}. Delavec ne sme opravljati varilskih del.`
              : `Certifikat "${doc.naziv}" je potekel. Delavec ne sme opravljati varilskih del.`,
            povezava: ROUTES.DELAVEC_DETAIL(delavec.id),
          });
        }

        if (doc.tip === 'varilski_certifikat' && doc.status_veljavnosti === 'poteka_kmalu') {
          result.push({
            id: `cert-warn-${delavec.id}-${doc.id}`,
            tip: 'certifikat_poteka',
            resnost: 'opozorilo',
            naslov: `Varilski certifikat poteka kmalu: ${fullName}`,
            opis: doc.datum_poteka
              ? `Certifikat "${doc.naziv}" poteka dne ${formatDate(doc.datum_poteka)}. Načrtujte podaljšanje ali ponovno certificiranje.`
              : `Certifikat "${doc.naziv}" poteka kmalu. Načrtujte podaljšanje ali ponovno certificiranje.`,
            povezava: ROUTES.DELAVEC_DETAIL(delavec.id),
          });
        }
      }

      // Missing critical documents
      const missingDocs: string[] = [];
      if (!hasTrc) {
        missingDocs.push(getDocTypeLabel('trc'));
      }
      if (!hasCert) {
        missingDocs.push(getDocTypeLabel('varilski_certifikat'));
      }

      if (missingDocs.length > 0) {
        result.push({
          id: `missing-docs-${delavec.id}`,
          tip: 'manjkajoci_dokumenti',
          resnost: 'informacija',
          naslov: `Manjkajoči dokumenti: ${fullName}`,
          opis: `Manjkajo naslednji ključni dokumenti: ${missingDocs.join(', ')}. Prosimo, dopolnite dokumentacijo.`,
          povezava: ROUTES.DELAVEC_DETAIL(delavec.id),
        });
      }
    }

    // Budget alerts for active projects
    const aktivniProjekti = projekti.filter((p) => p.faza !== 'zakljucen');
    for (const projekt of aktivniProjekti) {
      const budget = sumBudget(projekt.proracun);
      const actual = sumBudget(projekt.dejanski_stroski);
      if (budget <= 0) continue;

      const ratio = actual / budget;

      if (ratio > ALERT_THRESHOLDS.BUDGET_DANGER_PCT) {
        result.push({
          id: `budget-danger-${projekt.id}`,
          tip: 'proracun_prekoracen',
          resnost: 'kriticno',
          naslov: `Proračun kritičen: ${projekt.naziv}`,
          opis: `Dejanski stroški ${formatEur(actual)} presegajo ${Math.round(ratio * 100)}% planiranega proračuna ${formatEur(budget)}. Potrebna je takojšnja obravnava.`,
          povezava: ROUTES.PROJEKT_DETAIL(projekt.id),
        });
      } else if (ratio > ALERT_THRESHOLDS.BUDGET_WARNING_PCT) {
        result.push({
          id: `budget-warn-${projekt.id}`,
          tip: 'proracun_opozorilo',
          resnost: 'opozorilo',
          naslov: `Proračun pod opozorilom: ${projekt.naziv}`,
          opis: `Dejanski stroški ${formatEur(actual)} dosegajo ${Math.round(ratio * 100)}% planiranega proračuna ${formatEur(budget)}. Spremljajte porabo.`,
          povezava: ROUTES.PROJEKT_DETAIL(projekt.id),
        });
      }
    }

    // Sort: critical first, then warnings, then info
    const severityOrder: Record<Alert['resnost'], number> = {
      kriticno: 0,
      opozorilo: 1,
      informacija: 2,
    };
    result.sort((a, b) => severityOrder[a.resnost] - severityOrder[b.resnost]);

    return result;
  }, [delavci, projekti]);

  const criticalCount = alerts.filter((a) => a.resnost === 'kriticno').length;
  const warningCount = alerts.filter((a) => a.resnost === 'opozorilo').length;
  const infoCount = alerts.filter((a) => a.resnost === 'informacija').length;

  const filteredAlerts = useMemo((): Alert[] => {
    if (activeFilter === 'vsa') return alerts;
    return alerts.filter((a) => a.resnost === activeFilter);
  }, [alerts, activeFilter]);

  const filterTabs: { key: SeverityFilter; label: string; count: number }[] = [
    { key: 'vsa', label: 'Vsa', count: alerts.length },
    { key: 'kriticno', label: 'Kritična', count: criticalCount },
    { key: 'opozorilo', label: 'Opozorila', count: warningCount },
    { key: 'informacija', label: 'Informativna', count: infoCount },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Opozorila</h1>
        <p className="text-muted-foreground mt-1">
          Dokumenti ki potekajo in opomniki
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-red-200 bg-red-50/30">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-red-100 p-2">
                <AlertCircle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-red-700">{criticalCount}</p>
                <p className="text-sm text-red-600">Kritična opozorila</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-amber-200 bg-amber-50/30">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-amber-100 p-2">
                <AlertTriangle className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-amber-700">{warningCount}</p>
                <p className="text-sm text-amber-600">Opozorila</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-blue-200 bg-blue-50/30">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-blue-100 p-2">
                <Info className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-blue-700">{infoCount}</p>
                <p className="text-sm text-blue-600">Informativna</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter tabs */}
      <div className="flex flex-wrap gap-2">
        {filterTabs.map((tab) => (
          <Button
            key={tab.key}
            variant={activeFilter === tab.key ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveFilter(tab.key)}
            className="gap-1.5"
          >
            {tab.label}
            <Badge
              variant={activeFilter === tab.key ? 'secondary' : 'outline'}
              className="ml-1 h-5 min-w-5 justify-center"
            >
              {tab.count}
            </Badge>
          </Button>
        ))}
      </div>

      {/* Alerts list */}
      {filteredAlerts.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="flex flex-col items-center gap-3 text-center">
              <CheckCircle2 className="h-12 w-12 text-emerald-500" />
              <div>
                <p className="text-lg font-semibold">Ni opozoril</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {activeFilter === 'vsa'
                    ? 'Trenutno ni nobenih opozoril. Vsi dokumenti so veljavni in proračuni v mejah.'
                    : 'Za izbrani filter ni nobenih opozoril.'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredAlerts.map((alert) => (
            <Card key={alert.id} className={getSeverityBorderClass(alert.resnost)}>
              <CardContent className="py-4">
                <div className="flex items-start gap-4">
                  <div className="mt-0.5">
                    {getSeverityIcon(alert.resnost)}
                  </div>

                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-sm">{alert.naslov}</span>
                      {getSeverityBadge(alert.resnost)}
                    </div>

                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      {getAlertIcon(alert.tip)}
                      <span>{alert.opis}</span>
                    </div>
                  </div>

                  {alert.povezava && (
                    <Link to={alert.povezava} className="shrink-0">
                      <Button variant="outline" size="sm" className="gap-1">
                        Podrobnosti
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    </Link>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
