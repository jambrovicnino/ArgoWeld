import { useState, useCallback } from 'react';
import {
  Upload,
  FileText,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Sparkles,
  Calendar,
  Globe,
  User,
  Shield,
  Eye,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PageHeader } from '@/components/common/PageHeader';
import { EmptyState } from '@/components/common/EmptyState';
import { formatDate } from '@/lib/utils';

interface ExtractedField {
  label: string;
  value: string;
  confidence: 'visoka' | 'srednja' | 'nizka';
  icon: React.ElementType;
}

interface ProcessedDoc {
  id: number;
  fileName: string;
  uploadDate: string;
  status: 'processing' | 'done' | 'error';
  fields: ExtractedField[];
  rawText: string;
}

// Simulates extracting structured data from document text
function simulateExtraction(fileName: string): ExtractedField[] {
  const lower = fileName.toLowerCase();
  const fields: ExtractedField[] = [];

  if (lower.includes('trc') || lower.includes('dovoljenje') || lower.includes('viza')) {
    fields.push(
      { label: 'Tip dokumenta', value: 'TRC (Dovoljenje za prebivanje)', confidence: 'visoka', icon: Shield },
      { label: 'Ime in priimek', value: 'Nikola Milošević', confidence: 'visoka', icon: User },
      { label: 'Država izdaje', value: 'Slovenija', confidence: 'visoka', icon: Globe },
      { label: 'Veljavno od', value: '2025-03-01', confidence: 'srednja', icon: Calendar },
      { label: 'Veljavno do', value: '2028-03-01', confidence: 'srednja', icon: Calendar },
      { label: 'Narodnost', value: 'Srbija', confidence: 'visoka', icon: Globe },
    );
  } else if (lower.includes('certifikat') || lower.includes('iso') || lower.includes('varilski')) {
    fields.push(
      { label: 'Tip dokumenta', value: 'Varilski certifikat', confidence: 'visoka', icon: Shield },
      { label: 'Standard', value: 'EN ISO 9606-1', confidence: 'visoka', icon: FileText },
      { label: 'Ime in priimek', value: 'Nikola Milošević', confidence: 'srednja', icon: User },
      { label: 'Tip varjenja', value: 'TIG, MIG', confidence: 'visoka', icon: FileText },
      { label: 'Datum izdaje', value: '2024-12-15', confidence: 'srednja', icon: Calendar },
      { label: 'Datum poteka', value: '2026-12-15', confidence: 'srednja', icon: Calendar },
    );
  } else if (lower.includes('zdravnisk') || lower.includes('medical') || lower.includes('pregled')) {
    fields.push(
      { label: 'Tip dokumenta', value: 'Zdravniško spričevalo', confidence: 'visoka', icon: Shield },
      { label: 'Ime in priimek', value: 'Nikola Milošević', confidence: 'srednja', icon: User },
      { label: 'Rezultat', value: 'Sposoben', confidence: 'visoka', icon: CheckCircle2 },
      { label: 'Datum pregleda', value: '2025-02-20', confidence: 'srednja', icon: Calendar },
      { label: 'Naslednji pregled', value: '2026-02-20', confidence: 'nizka', icon: Calendar },
      { label: 'Ustanova', value: 'ZD Ljubljana', confidence: 'nizka', icon: Globe },
    );
  } else if (lower.includes('pogodba') || lower.includes('contract') || lower.includes('zaposlitv')) {
    fields.push(
      { label: 'Tip dokumenta', value: 'Pogodba o zaposlitvi', confidence: 'visoka', icon: Shield },
      { label: 'Ime in priimek', value: 'Nikola Milošević', confidence: 'visoka', icon: User },
      { label: 'Delodajalec', value: 'ArgoWeld d.o.o.', confidence: 'visoka', icon: Globe },
      { label: 'Datum začetka', value: '2025-04-01', confidence: 'srednja', icon: Calendar },
      { label: 'Urna postavka', value: '17 EUR/uro', confidence: 'srednja', icon: FileText },
    );
  } else {
    fields.push(
      { label: 'Tip dokumenta', value: 'Neznano', confidence: 'nizka', icon: Shield },
      { label: 'Opomba', value: 'Dokument ni bil prepoznan. Ročno preglejte vsebino.', confidence: 'nizka', icon: AlertCircle },
    );
  }

  return fields;
}

function getConfidenceBadge(confidence: ExtractedField['confidence']): React.JSX.Element {
  switch (confidence) {
    case 'visoka':
      return <Badge variant="success" className="text-[10px]">Visoka</Badge>;
    case 'srednja':
      return <Badge variant="warning" className="text-[10px]">Srednja</Badge>;
    case 'nizka':
      return <Badge variant="destructive" className="text-[10px]">Nizka</Badge>;
  }
}

export function DokumentiPage(): React.JSX.Element {
  const [processedDocs, setProcessedDocs] = useState<ProcessedDoc[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  const processFile = useCallback((file: File) => {
    const newDoc: ProcessedDoc = {
      id: Date.now(),
      fileName: file.name,
      uploadDate: new Date().toISOString(),
      status: 'processing',
      fields: [],
      rawText: '',
    };

    setProcessedDocs((prev) => [newDoc, ...prev]);

    // Simulate processing delay
    setTimeout(() => {
      setProcessedDocs((prev) =>
        prev.map((d) =>
          d.id === newDoc.id
            ? {
                ...d,
                status: 'done' as const,
                fields: simulateExtraction(file.name),
                rawText: `[Simuliran izvlečeni tekst iz: ${file.name}]\n\nDokument vsebuje podatke o delavcu...\nVeljavnost: od ... do ...\nDržava: ...\n\nOpomba: V produkcijski verziji bi tukaj bil dejanski izvlečeni tekst iz PDF datoteke z uporabo PDF.js ali Claude API za inteligentno obdelavo dokumentov.`,
              }
            : d
        )
      );
    }, 2000 + Math.random() * 1500);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const files = Array.from(e.dataTransfer.files);
      for (const file of files) {
        processFile(file);
      }
    },
    [processFile]
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || []);
      for (const file of files) {
        processFile(file);
      }
      e.target.value = '';
    },
    [processFile]
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Obdelava dokumentov"
        description="Naložite dokumente za samodejno prepoznavanje in izvlečenje podatkov"
      />

      {/* Upload area */}
      <Card
        className={`border-2 border-dashed transition-colors ${
          isDragging ? 'border-primary bg-primary/5' : 'border-muted-foreground/20 hover:border-muted-foreground/40'
        }`}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
      >
        <CardContent className="py-12">
          <div className="flex flex-col items-center gap-4 text-center">
            <div className="rounded-full bg-primary/10 p-4">
              <Upload className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">Povlecite dokumente sem</h3>
              <p className="text-sm text-muted-foreground mt-1">
                ali kliknite za izbiro datoteke (PDF, slike)
              </p>
            </div>
            <Label htmlFor="file-upload" className="cursor-pointer">
              <Button asChild variant="outline">
                <span>
                  <FileText className="h-4 w-4 mr-2" />
                  Izberite datoteko
                </span>
              </Button>
              <Input
                id="file-upload"
                type="file"
                multiple
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={handleFileInput}
                className="hidden"
              />
            </Label>
          </div>
        </CardContent>
      </Card>

      {/* How it works */}
      <Card className="bg-muted/30">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <Sparkles className="h-5 w-5 text-primary mt-0.5 shrink-0" />
            <div className="space-y-2">
              <h3 className="font-semibold text-sm">Kako deluje obdelava dokumentov?</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-muted-foreground">
                <div className="flex items-start gap-2">
                  <span className="bg-primary text-white rounded-full h-5 w-5 flex items-center justify-center text-[10px] font-bold shrink-0">1</span>
                  <span>Naložite PDF ali sliko dokumenta (viza, certifikat, pogodba, zdravniško spričevalo)</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="bg-primary text-white rounded-full h-5 w-5 flex items-center justify-center text-[10px] font-bold shrink-0">2</span>
                  <span>Sistem samodejno prepozna tip dokumenta in izvleče ključne podatke (datume, imena, države)</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="bg-primary text-white rounded-full h-5 w-5 flex items-center justify-center text-[10px] font-bold shrink-0">3</span>
                  <span>Preglejte izvlečene podatke in jih potrdite za vnos v sistem</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Processed documents */}
      {processedDocs.length === 0 ? (
        <EmptyState
          title="Ni obdelanih dokumentov"
          description="Naložite prvi dokument za začetek samodejne obdelave."
          icon={FileText}
        />
      ) : (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Obdelani dokumenti ({processedDocs.length})</h2>
          {processedDocs.map((doc) => (
            <Card key={doc.id}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <FileText className="h-5 w-5 text-muted-foreground shrink-0" />
                    <div className="min-w-0">
                      <CardTitle className="text-base truncate">{doc.fileName}</CardTitle>
                      <p className="text-xs text-muted-foreground">Naloženo: {formatDate(doc.uploadDate)}</p>
                    </div>
                  </div>
                  {doc.status === 'processing' && (
                    <Badge variant="secondary" className="gap-1 shrink-0">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      Obdelava...
                    </Badge>
                  )}
                  {doc.status === 'done' && (
                    <Badge variant="success" className="gap-1 shrink-0">
                      <CheckCircle2 className="h-3 w-3" />
                      Obdelano
                    </Badge>
                  )}
                  {doc.status === 'error' && (
                    <Badge variant="destructive" className="gap-1 shrink-0">
                      <AlertCircle className="h-3 w-3" />
                      Napaka
                    </Badge>
                  )}
                </div>
              </CardHeader>
              {doc.status === 'done' && (
                <>
                  <CardContent>
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium text-muted-foreground">Izvlečeni podatki:</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {doc.fields.map((field, idx) => {
                          const Icon = field.icon;
                          return (
                            <div key={idx} className="flex items-center justify-between bg-muted/30 rounded-lg px-3 py-2">
                              <div className="flex items-center gap-2 min-w-0">
                                <Icon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                                <div className="min-w-0">
                                  <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{field.label}</p>
                                  <p className="text-sm font-medium truncate">{field.value}</p>
                                </div>
                              </div>
                              {getConfidenceBadge(field.confidence)}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="gap-2">
                    <Button size="sm" className="gap-1.5">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Potrdi in shrani
                    </Button>
                    <Button size="sm" variant="outline" className="gap-1.5">
                      <Eye className="h-3.5 w-3.5" />
                      Preglej surovi tekst
                    </Button>
                  </CardFooter>
                </>
              )}
              {doc.status === 'processing' && (
                <CardContent>
                  <div className="flex items-center justify-center py-8 text-muted-foreground gap-2">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span className="text-sm">Obdelava dokumenta...</span>
                  </div>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
