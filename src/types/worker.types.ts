export type WorkerStatus = 'zaposlen' | 'v_procesu' | 'v_dogovoru';
export type WeldingType = 'TIG' | 'MIG' | 'Stick' | 'Flux-Cored' | 'SAW' | 'Drugo';
export type DocType = 'trc' | 'delovno_dovoljenje' | 'varilski_certifikat' | 'potni_list' | 'pogodba' | 'zdravnisko' | 'varstvo_pri_delu' | 'a1_obrazec';
export type ValidityStatus = 'veljaven' | 'poteka_kmalu' | 'potekel' | 'manjka';

export interface WorkerDocument {
  id: number;
  delavec_id: number;
  tip: DocType;
  naziv: string;
  datum_izdaje?: string;
  datum_poteka?: string;
  datum_opomnika?: string;
  status_veljavnosti: ValidityStatus;
  opombe?: string;
}

export interface Worker {
  id: number;
  ime: string;
  priimek: string;
  narodnost: string;
  telefon: string;
  email: string;
  urna_postavka: number;
  tipi_varjenja: WeldingType[];
  trenutni_projekt_id: number | null;
  status: WorkerStatus;
  datum_zaposlitve: string;
  opombe: string;
  dokumenti: WorkerDocument[];
}
