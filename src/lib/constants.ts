export const APP_NAME = 'ArgoWeld';

export const WELDING_TYPES = ['TIG', 'MIG', 'Stick', 'Flux-Cored', 'SAW', 'Drugo'] as const;

export const WORKER_STATUSES = [
  { value: 'zaposlen', label: 'Zaposlen' },
  { value: 'v_procesu', label: 'V procesu' },
  { value: 'v_dogovoru', label: 'V dogovoru' },
] as const;

export const PROJECT_PHASES = [
  { value: 'mobilizacija', label: 'Mobilizacija', color: 'bg-blue-400' },
  { value: 'aktiven', label: 'Aktiven', color: 'bg-emerald-500' },
  { value: 'zakljucevanje', label: 'Zaključevanje', color: 'bg-amber-400' },
  { value: 'zakljucen', label: 'Zaključen', color: 'bg-gray-400' },
] as const;

export const EXPENSE_CATEGORIES = [
  { value: 'transport', label: 'Transport', color: '#3b82f6' },
  { value: 'gorivo', label: 'Gorivo', color: '#8b5cf6' },
  { value: 'nastanitev', label: 'Nastanitev', color: '#10b981' },
  { value: 'dnevnice', label: 'Dnevnice', color: '#f59e0b' },
  { value: 'orodje', label: 'Orodje/Oprema', color: '#ef4444' },
  { value: 'dovoljenja', label: 'Dovoljenja/Takse', color: '#6366f1' },
  { value: 'drugo', label: 'Drugo', color: '#6b7280' },
] as const;

export const PIPELINE_STAGES = [
  { value: 'zainteresiran', label: 'Zainteresiran', color: 'bg-gray-400' },
  { value: 'test_nacrtrovan', label: 'Test načrtovan', color: 'bg-blue-400' },
  { value: 'test_opravljen', label: 'Test opravljen', color: 'bg-cyan-400' },
  { value: 'zbiranje_dokumentov', label: 'Zbiranje dokumentov', color: 'bg-amber-400' },
  { value: 'vizum_vlozen', label: 'Vizum vložen', color: 'bg-orange-400' },
  { value: 'vizum_odobren', label: 'Vizum odobren', color: 'bg-emerald-400' },
  { value: 'prispel', label: 'Prispel', color: 'bg-green-500' },
] as const;

export const DOC_TYPES = [
  { value: 'trc', label: 'TRC (Dovoljenje za prebivanje)' },
  { value: 'delovno_dovoljenje', label: 'Delovno dovoljenje' },
  { value: 'varilski_certifikat', label: 'Varilski certifikat' },
  { value: 'potni_list', label: 'Potni list' },
  { value: 'pogodba', label: 'Pogodba o zaposlitvi' },
  { value: 'zdravnisko', label: 'Zdravniško spričevalo' },
  { value: 'varstvo_pri_delu', label: 'Varstvo pri delu' },
  { value: 'a1_obrazec', label: 'Obrazec A1' },
] as const;

export const NATIONALITIES = ['Indijec', 'Filipinec', 'Nepalec', 'Šrilankovčan', 'Bosanec', 'Slovenec', 'Drugo'] as const;

export const COUNTRIES = ['Slovenija', 'Avstrija', 'Italija', 'Nemčija', 'Hrvaška'] as const;

export const ALERT_THRESHOLDS = {
  TRC_CRITICAL_DAYS: 30,
  TRC_WARNING_DAYS: 90,
  CERT_WARNING_DAYS: 60,
  BUDGET_WARNING_PCT: 0.7,
  BUDGET_DANGER_PCT: 0.9,
} as const;
