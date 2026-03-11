export interface DashboardSummary {
  aktivniDelavci: number;
  skupajDelavcev: number;
  aktivniProjekti: number;
  skupajProjektov: number;
  mesecniStroski: number;
  kandidatiVPipeliniu: number;
  trcPoteka: number;
  proracunOpozorila: number;
}

export interface Alert {
  id: string;
  tip: 'trc_potekel' | 'trc_poteka' | 'certifikat_potekel' | 'certifikat_poteka' | 'proracun_prekoracen' | 'proracun_opozorilo' | 'manjkajoci_dokumenti';
  resnost: 'kriticno' | 'opozorilo' | 'informacija';
  naslov: string;
  opis: string;
  povezava?: string;
}
