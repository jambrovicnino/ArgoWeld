export type ProjectPhase = 'mobilizacija' | 'aktiven' | 'zakljucevanje' | 'zakljucen';

export interface BudgetBreakdown {
  delo: number;
  transport: number;
  nastanitev: number;
  orodje: number;
  dnevnice: number;
  drugo: number;
}

export interface ProjectPartner {
  id: number;
  naziv: string;
  kontakt: string;
  status: 'aktiven' | 'v_dogovoru';
  opombe?: string;
}

export interface WorkerAssignment {
  id: number;
  delavec_id: number;
  delavec_ime: string;
  od: string;
  do?: string;
  vloga?: string;
}

export interface Project {
  id: number;
  naziv: string;
  lokacija: string;
  drzava: string;
  narocnik: string;
  faza: ProjectPhase;
  zacetek: string;
  konec: string;
  napredek: number;
  proracun: BudgetBreakdown;
  dejanski_stroski: BudgetBreakdown;
  delavci_ids: number[];
  razporeditve: WorkerAssignment[];
  partnerji: ProjectPartner[];
  opombe: string;
}
