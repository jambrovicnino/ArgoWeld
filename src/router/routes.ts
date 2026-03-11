export const ROUTES = {
  DASHBOARD: '/',
  DELAVCI: '/delavci',
  DELAVEC_DETAIL: (id: string | number) => `/delavci/${id}`,
  PROJEKTI: '/projekti',
  PROJEKT_NOV: '/projekti/nov',
  PROJEKT_DETAIL: (id: string | number) => `/projekti/${id}`,
  STROSKI: '/stroski',
  STROSEK_NOV: '/stroski/nov',
  PIPELINE: '/pipeline',
  OPOZORILA: '/opozorila',
  NASTAVITVE: '/nastavitve',
} as const;
