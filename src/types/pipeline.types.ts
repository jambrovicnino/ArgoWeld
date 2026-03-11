export type PipelineStage = 'zainteresiran' | 'test_nacrtrovan' | 'test_opravljen' | 'zbiranje_dokumentov' | 'vizum_vlozen' | 'vizum_odobren' | 'prispel';

export interface PipelineDocument {
  tip: string;
  naziv: string;
  prejeto: boolean;
}

export interface PipelineCandidate {
  id: number;
  ime: string;
  priimek: string;
  narodnost: string;
  tipi_varjenja: string[];
  faza: PipelineStage;
  pricakovani_prihod: string;
  opombe: string;
  dokumenti: PipelineDocument[];
}
