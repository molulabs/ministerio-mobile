/** The web's options (API's FamilyFinancesRequest). */
export const TECHNICAL_ADVISORY_OPTIONS = [
  { label: 'Nacional', value: 'nacional' },
  { label: 'Provincial', value: 'provincial' },
  { label: 'Municipal', value: 'municipal' },
  { label: 'Otro', value: 'otro' },
];

export const ASSOCIATIVISM_OPTIONS = [
  { label: 'Cooperativa', value: 'cooperativa' },
  { label: 'Asociación', value: 'asociacion' },
  { label: 'Comunidad', value: 'comunidad' },
  { label: 'Otro', value: 'otro' },
];

/** The option of both lists that asks for a detail. */
export const OTHER_OPTION = 'otro';

export const CHILDREN = [
  { key: 'adultChildren', label: 'Hijos mayores' },
  { key: 'minorChildren', label: 'Hijos menores' },
] as const;

export const WORKERS = [
  { key: 'familyWorkers', label: 'Familiares' },
  { key: 'contractedWorkers', label: 'Contratados' },
  { key: 'permanentWorkers', label: 'Permanentes' },
  { key: 'seasonalWorkers', label: 'Estacionales' },
  { key: 'dayWorkers', label: 'Jornaleros' },
] as const;

export const FINANCES = [
  { key: 'isBanked', label: 'Bancarizado' },
  { key: 'hasInsurance', label: 'Contrata seguro' },
  { key: 'receivesSocialSubsidy', label: 'Subsidio social' },
] as const;

export const FAMILY_FINANCES_TEXTS = {
  family: 'Familia',
  hasSpouse: 'Cónyuge',
  spouseWorksOnFarm: 'El cónyuge trabaja en la finca',
  childrenInSchool: 'Hijos que estudian',
  childrenInSchoolWarning: 'Hay más hijos estudiando que hijos declarados',
  totalChildren: (total: number) => `Total de hijos (calculado): ${total}`,
  advisory: 'Asesoramiento',
  technicalAdvisory: 'Asesoramiento técnico',
  technicalAdvisoryOtherDetail: 'Detalle de "otro" (asesoramiento)',
  associativism: 'Asociativismo',
  associativismOtherDetail: 'Detalle de "otro" (asociativismo)',
  finances: 'Situación financiera',
  workers: 'Mano de obra',
  totalWorkers: (total: number) => `Total de mano de obra (calculado): ${total}`,
};
