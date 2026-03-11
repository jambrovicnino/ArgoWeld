export type VehicleType = 'lastno' | 'najem';

export interface Vehicle {
  id: number;
  naziv: string;
  registrska: string;
  tip: VehicleType;
  najemodajalec?: string;
  datum_najema_od?: string;
  datum_najema_do?: string;
  opombe?: string;
}

export interface VehicleTrip {
  id: number;
  vozilo_id: number;
  vozilo_naziv: string;
  vozilo_registrska: string;
  voznik_id: number;
  voznik_ime: string;
  od_lokacija: string;
  do_lokacija: string;
  datum: string;
  kilometri: number;
  namen: string;
  projekt_id?: number;
  projekt_naziv?: string;
}
