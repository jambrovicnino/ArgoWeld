import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import {
  Euro,
  Filter,
  Fuel,
  Home,
  Wrench,
  Car,
  FileText,
  Plus,
  CalendarDays,
  TrendingUp,
  Truck,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useExpensesStore } from '@/stores/expensesStore';
import { EXPENSE_CATEGORIES } from '@/lib/constants';
import { formatCurrency, formatDate } from '@/lib/utils';
import { ROUTES } from '@/router/routes';
import type { ExpenseCategory } from '@/types';

const CATEGORY_ICONS: Record<ExpenseCategory, React.ReactNode> = {
  transport: <Truck className="h-4 w-4" />,
  gorivo: <Fuel className="h-4 w-4" />,
  nastanitev: <Home className="h-4 w-4" />,
  dnevnice: <Euro className="h-4 w-4" />,
  orodje: <Wrench className="h-4 w-4" />,
  dovoljenja: <FileText className="h-4 w-4" />,
  drugo: <Filter className="h-4 w-4" />,
};

function getCategoryMeta(kategorija: ExpenseCategory): { label: string; color: string } {
  const found = EXPENSE_CATEGORIES.find((c) => c.value === kategorija);
  return found ?? { label: kategorija, color: '#6b7280' };
}

function getMonthKey(datum: string): string {
  const d = new Date(datum);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export function StroskiListPage(): React.JSX.Element {
  const { stroski } = useExpensesStore();
  const [iskanje, setIskanje] = useState('');
  const [izbranaKategorija, setIzbranaKategorija] = useState<ExpenseCategory | null>(null);

  const now = new Date();
  const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  // Summary calculations
  const { skupniStroski, taMesec, povprecnoMesecno } = useMemo(() => {
    const total = stroski.reduce((sum, s) => sum + s.znesek, 0);
    const thisMonth = stroski
      .filter((s) => getMonthKey(s.datum) === currentMonthKey)
      .reduce((sum, s) => sum + s.znesek, 0);

    const months = new Set(stroski.map((s) => getMonthKey(s.datum)));
    const monthCount = Math.max(months.size, 1);
    const avgMonthly = total / monthCount;

    return { skupniStroski: total, taMesec: thisMonth, povprecnoMesecno: avgMonthly };
  }, [stroski, currentMonthKey]);

  // Pie chart data
  const pieData = useMemo(() => {
    const byCategory = new Map<ExpenseCategory, number>();
    for (const s of stroski) {
      byCategory.set(s.kategorija, (byCategory.get(s.kategorija) ?? 0) + s.znesek);
    }
    return EXPENSE_CATEGORIES.filter((c) => byCategory.has(c.value as ExpenseCategory)).map(
      (c) => ({
        name: c.label,
        value: byCategory.get(c.value as ExpenseCategory) ?? 0,
        color: c.color,
      })
    );
  }, [stroski]);

  // Filtered and sorted expenses
  const filteredStroski = useMemo(() => {
    const searchLower = iskanje.toLowerCase();
    return stroski
      .filter((s) => {
        if (izbranaKategorija && s.kategorija !== izbranaKategorija) return false;
        if (
          iskanje &&
          !s.opis.toLowerCase().includes(searchLower) &&
          !(s.projekt_naziv ?? '').toLowerCase().includes(searchLower) &&
          !(s.vozilo ?? '').toLowerCase().includes(searchLower)
        ) {
          return false;
        }
        return true;
      })
      .sort((a, b) => new Date(b.datum).getTime() - new Date(a.datum).getTime());
  }, [stroski, iskanje, izbranaKategorija]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Stroški</h1>
          <p className="text-muted-foreground mt-1">Pregled vseh stroškov</p>
        </div>
        <Link to={ROUTES.STROSEK_NOV}>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Nov strošek
          </Button>
        </Link>
      </div>

      {/* Summary cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Skupni stroški</CardTitle>
            <Euro className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(skupniStroski)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {stroski.length} {stroski.length === 1 ? 'strošek' : 'stroškov'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ta mesec</CardTitle>
            <CalendarDays className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(taMesec)}</div>
            <p className="text-xs text-muted-foreground mt-1">Tekoči mesec</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Povprečno mesečno</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(povprecnoMesecno)}</div>
            <p className="text-xs text-muted-foreground mt-1">Povprečje vseh mesecev</p>
          </CardContent>
        </Card>
      </div>

      {/* Pie chart + filters row */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Pie chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Porazdelitev po kategorijah</CardTitle>
          </CardHeader>
          <CardContent>
            {pieData.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                Ni podatkov za prikaz
              </p>
            ) : (
              <div className="flex items-center gap-4">
                <div className="h-[200px] w-[200px] flex-shrink-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {pieData.map((entry) => (
                          <Cell key={entry.name} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value: number) => formatCurrency(value)}
                        contentStyle={{ borderRadius: '8px', fontSize: '13px' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-2">
                  {pieData.map((entry) => (
                    <div key={entry.name} className="flex items-center gap-2 text-sm">
                      <div
                        className="h-3 w-3 rounded-full flex-shrink-0"
                        style={{ backgroundColor: entry.color }}
                      />
                      <span className="text-muted-foreground">{entry.name}</span>
                      <span className="font-medium ml-auto">{formatCurrency(entry.value)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Filtri</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              placeholder="Iskanje po opisu, projektu, vozilu..."
              value={iskanje}
              onChange={(e) => setIskanje(e.target.value)}
            />
            <div>
              <p className="text-sm text-muted-foreground mb-2">Kategorija</p>
              <div className="flex flex-wrap gap-2">
                <Badge
                  className="cursor-pointer select-none"
                  variant={izbranaKategorija === null ? 'default' : 'outline'}
                  onClick={() => setIzbranaKategorija(null)}
                >
                  Vse
                </Badge>
                {EXPENSE_CATEGORIES.map((cat) => {
                  const isActive = izbranaKategorija === cat.value;
                  return (
                    <Badge
                      key={cat.value}
                      className="cursor-pointer select-none"
                      style={
                        isActive
                          ? { backgroundColor: cat.color, color: '#fff', borderColor: cat.color }
                          : undefined
                      }
                      variant={isActive ? 'default' : 'outline'}
                      onClick={() =>
                        setIzbranaKategorija(isActive ? null : (cat.value as ExpenseCategory))
                      }
                    >
                      {cat.label}
                    </Badge>
                  );
                })}
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              Prikazanih: {filteredStroski.length} od {stroski.length} stroškov
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Expenses list */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Seznam stroškov</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredStroski.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              Ni stroškov za prikaz
            </p>
          ) : (
            <div className="space-y-3">
              {filteredStroski.map((strosek) => {
                const meta = getCategoryMeta(strosek.kategorija);
                return (
                  <div
                    key={strosek.id}
                    className="flex items-center gap-4 rounded-lg border p-4 hover:bg-muted/50 transition-colors"
                  >
                    {/* Category icon */}
                    <div
                      className="flex h-10 w-10 items-center justify-center rounded-lg text-white flex-shrink-0"
                      style={{ backgroundColor: meta.color }}
                    >
                      {CATEGORY_ICONS[strosek.kategorija]}
                    </div>

                    {/* Description + project */}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{strosek.opis}</p>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <span className="text-xs text-muted-foreground">
                          {formatDate(strosek.datum)}
                        </span>
                        {strosek.projekt_naziv && (
                          <span className="text-xs text-muted-foreground">
                            · {strosek.projekt_naziv}
                          </span>
                        )}
                        {strosek.vozilo && (
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            · <Car className="h-3 w-3" /> {strosek.vozilo}
                            {strosek.kilometri != null && ` (${strosek.kilometri} km)`}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Category badge */}
                    <Badge
                      className="flex-shrink-0"
                      style={{ backgroundColor: meta.color, color: '#fff', borderColor: meta.color }}
                    >
                      {meta.label}
                    </Badge>

                    {/* Amount */}
                    <div className="text-right flex-shrink-0 min-w-[100px]">
                      <p className="font-semibold">{formatCurrency(strosek.znesek)}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
