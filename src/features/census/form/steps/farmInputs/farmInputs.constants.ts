/** The options of the farm inputs step, the web's values (API's FarmInputsRequest). */
export const FERTILIZER_OPTIONS = [
  { label: 'Urea', value: 'urea' },
  { label: 'Triple 15', value: 'triple_15' },
  { label: 'Huano', value: 'huano' },
  { label: 'Otros', value: 'otros' },
];

/** The fertilizer that asks for a detail. */
export const OTHER_FERTILIZER = 'otros';

export const WATER_SOURCE_OPTIONS = [
  { label: 'Canales', value: 'canales' },
  { label: 'Acequia', value: 'acequia' },
  { label: 'Pozo', value: 'pozo' },
];

/** The API's ForestType. */
export const FOREST_TYPE_OPTIONS = [
  { label: 'Nativa', value: 'NATIVE' },
  { label: 'Implantada', value: 'PLANTED' },
];

export type ForestType = 'NATIVE' | 'PLANTED';

/** Each agrochemical: whether it is used, and its active ingredient. */
export const AGROCHEMICALS = [
  {
    label: 'Insecticidas',
    usesKey: 'usesInsecticides',
    ingredientKey: 'insecticidesActiveIngredient',
  },
  { label: 'Fungicidas', usesKey: 'usesFungicides', ingredientKey: 'fungicidesActiveIngredient' },
  { label: 'Herbicidas', usesKey: 'usesHerbicides', ingredientKey: 'herbicidesActiveIngredient' },
  {
    label: 'Otros agroquímicos',
    usesKey: 'usesOtherAgrochemicals',
    ingredientKey: 'otherAgrochemicalsActiveIngredient',
  },
] as const;

export const FARM_INPUTS_TEXTS = {
  fertilizersTitle: 'Fertilizantes',
  fertilizers: 'Fertilizantes utilizados',
  fertilizersOtherDetail: 'Detalle de "otros" (fertilizantes)',
  agrochemicals: 'Agroquímicos',
  activeIngredient: 'Principio activo',
  waterTitle: 'Agua',
  waterSources: 'Fuentes de agua',
  forestation: 'Forestación',
  forestRow: (index: number) => `Especie ${index + 1}`,
  species: 'Especie',
  speciesPlaceholder: 'Buscar especie…',
  speciesEmpty: 'Sin coincidencias',
  createSpecies: (name: string) => `Agregar especie «${name}»`,
  newSpecies: 'Las especies nuevas se agregan al enviar el censo.',
  type: 'Tipo',
  quantity: 'Cantidad',
  hectares: 'Hectáreas',
  addSpecies: 'Agregar especie',
  removeSpecies: 'Quitar especie',
  incomplete: 'Elegí la especie y el tipo, o quitá la fila.',
};
