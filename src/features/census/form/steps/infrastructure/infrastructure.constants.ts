import type { InfrastructureCountKey, InfrastructureTextKey } from './infrastructure.helper';

/** A count of the step, and the detail of an "otros". */
export type CountRow = {
  key: InfrastructureCountKey;
  label: string;
  detail?: { key: InfrastructureTextKey; label: string };
};

export const MACHINERY: CountRow[] = [
  { key: 'tractors', label: 'Tractores' },
  { key: 'harrows', label: 'Rastra' },
  { key: 'seeders', label: 'Sembradora' },
  { key: 'chiselPlows', label: 'Cincel - arado' },
  { key: 'sprayers', label: 'Fumigadora' },
  {
    key: 'otherMachinery1',
    label: 'Otros (1)',
    detail: { key: 'otherMachinery1Detail', label: 'Detalle de "otros (1)"' },
  },
  {
    key: 'otherMachinery2',
    label: 'Otros (2)',
    detail: { key: 'otherMachinery2Detail', label: 'Detalle de "otros (2)"' },
  },
];

export const VEHICLES: CountRow[] = [
  { key: 'pickUps', label: 'Pick up' },
  { key: 'trucks', label: 'Camiones' },
  { key: 'trailers', label: 'Acoplados' },
  {
    key: 'otherVehicles',
    label: 'Otros',
    detail: { key: 'otherVehiclesDetail', label: 'Detalle de "otros" (vehículos)' },
  },
];

export const FACILITIES: CountRow[] = [
  { key: 'sheds', label: 'Galpones' },
  { key: 'openSheds', label: 'Tinglados' },
  { key: 'corrals', label: 'Corrales' },
  { key: 'australianTanks', label: 'Tanque australiano' },
  { key: 'wateringPoints', label: 'Aguadas' },
  { key: 'dams', label: 'Represa' },
];

/** The web's values (API's InfrastructureRequest.commercializationChannels). */
export const COMMERCIALIZATION_CHANNEL_OPTIONS = [
  { label: 'Directa', value: 'directa' },
  { label: 'Indirecta', value: 'indirecta' },
  { label: 'A intermediarios', value: 'a_intermediarios' },
  { label: 'Ferias', value: 'ferias' },
];

export const INFRASTRUCTURE_TEXTS = {
  machinery: 'Maquinaria',
  vehicles: 'Vehículos',
  facilities: 'Instalaciones',
  commercialization: 'Comercialización',
  channels: 'Canales de comercialización',
};
