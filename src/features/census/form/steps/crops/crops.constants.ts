/** The crops of the census (the API's CropCode), in the web's order. */
export const CROP_CODES = [
  'cereal_oats',
  'cereal_barley',
  'cereal_corn',
  'cereal_sorghum',
  'cereal_wheat',
  'cereal_chickpea',
  'cereal_soybean',
  'cereal_sunflower',
  'cereal_black_beans',
  'cereal_kidney_beans',
  'cereal_other',

  'industrial_sugar_cane',
  'industrial_tobacco',
  'industrial_other',

  'fruit_tree_lemon',
  'fruit_tree_mandarin',
  'fruit_tree_navel_orange',
  'fruit_tree_valencia_orange',
  'fruit_tree_grapefruit',
  'fruit_tree_citrus_other',
  'fruit_tree_apple',
  'fruit_tree_pear',
  'fruit_tree_plum',
  'fruit_tree_apricot',
  'fruit_tree_peach',
  'fruit_tree_avocado',
  'fruit_tree_stone_fruit_other',

  'aromatic_other',

  'flower_carnation',
  'flower_chrysanthemum',
  'flower_rose',
  'flower_yervera',
  'flower_other',

  'vegetable_chard',
  'vegetable_chicory',
  'vegetable_chili_pepper',
  'vegetable_garlic',
  'vegetable_celery',
  'vegetable_sweet_potato',
  'vegetable_eggplant',
  'vegetable_broccoli',
  'vegetable_squash',
  'vegetable_anquito_squash',
  'vegetable_onion',
  'vegetable_green_onion',
  'vegetable_green_bean',
  'vegetable_sweet_corn',
  'vegetable_cauliflower',
  'vegetable_spinach',
  'vegetable_fava_bean',
  'vegetable_lettuce',
  'vegetable_potato',
  'vegetable_cucumber',
  'vegetable_parsley',
  'vegetable_bell_pepper',
  'vegetable_beet',
  'vegetable_cabbage',
  'vegetable_roma_tomato',
  'vegetable_round_tomato',
  'vegetable_carrot',
  'vegetable_baby_squash',
  'vegetable_angolita_zucchini',
  'vegetable_pumpkin',
  'vegetable_strawberry',
  'vegetable_melon',
  'vegetable_watermelon',
  'vegetable_passion_fruit',
  'vegetable_berries',
  'vegetable_other1',
  'vegetable_other2',

  'andean_potato',
  'andean_green_potato',
  'andean_oca',
  'andean_corn',
  'andean_quinoa',
  'andean_yacon',
] as const;

export type CropCode = (typeof CROP_CODES)[number];

export const AROMATIC_CODE: CropCode = 'aromatic_other';

/** A crop asked in hectares and rows ("rayas"), some with a detail (the web's CropRowConfig). */
export type CropRow = { code: CropCode; label: string; detailLabel?: string };

/** A group of crops asked only in hectares, with the detail of its "otros" (the web's NumericFieldGrid). */
export type CropGroup = {
  fields: { code: CropCode; label: string }[];
  detail?: { code: CropCode; label: string };
};

export const VEGETABLE_ROWS: CropRow[] = [
  { code: 'vegetable_chard', label: 'Acelga' },
  { code: 'vegetable_chicory', label: 'Achicoria' },
  { code: 'vegetable_chili_pepper', label: 'Ají' },
  { code: 'vegetable_garlic', label: 'Ajo' },
  { code: 'vegetable_celery', label: 'Apio' },
  { code: 'vegetable_sweet_potato', label: 'Batata' },
  { code: 'vegetable_eggplant', label: 'Berenjena' },
  { code: 'vegetable_broccoli', label: 'Brócoli' },
  { code: 'vegetable_squash', label: 'Calabaza' },
  { code: 'vegetable_anquito_squash', label: 'Calabacín anquito' },
  { code: 'vegetable_onion', label: 'Cebolla' },
  { code: 'vegetable_green_onion', label: 'Cebolla de verdeo' },
  { code: 'vegetable_green_bean', label: 'Chaucha' },
  { code: 'vegetable_sweet_corn', label: 'Choclo' },
  { code: 'vegetable_cauliflower', label: 'Coliflor' },
  { code: 'vegetable_spinach', label: 'Espinaca' },
  { code: 'vegetable_fava_bean', label: 'Haba' },
  { code: 'vegetable_lettuce', label: 'Lechuga' },
  { code: 'vegetable_potato', label: 'Papa' },
  { code: 'vegetable_cucumber', label: 'Pepino' },
  { code: 'vegetable_parsley', label: 'Perejil' },
  { code: 'vegetable_bell_pepper', label: 'Pimiento' },
  { code: 'vegetable_beet', label: 'Remolacha' },
  { code: 'vegetable_cabbage', label: 'Repollo' },
  { code: 'vegetable_roma_tomato', label: 'Tomate perita' },
  { code: 'vegetable_round_tomato', label: 'Tomate redondo' },
  { code: 'vegetable_carrot', label: 'Zanahoria' },
  { code: 'vegetable_baby_squash', label: 'Zapallito' },
  { code: 'vegetable_angolita_zucchini', label: 'Zuquini angolita' },
  { code: 'vegetable_pumpkin', label: 'Zapallo' },
  { code: 'vegetable_strawberry', label: 'Frutilla' },
  { code: 'vegetable_melon', label: 'Melón' },
  { code: 'vegetable_watermelon', label: 'Sandía' },
  { code: 'vegetable_passion_fruit', label: 'Maracuyá' },
  { code: 'vegetable_berries', label: 'Frutos rojos' },
  { code: 'vegetable_other1', label: 'Otros 1', detailLabel: 'Detalle (otros 1)' },
  { code: 'vegetable_other2', label: 'Otros 2', detailLabel: 'Detalle (otros 2)' },
];

export const ANDEAN_ROWS: CropRow[] = [
  { code: 'andean_potato', label: 'Papa' },
  { code: 'andean_green_potato', label: 'Papa verde' },
  { code: 'andean_oca', label: 'Oca' },
  { code: 'andean_corn', label: 'Maíz' },
  { code: 'andean_quinoa', label: 'Quinua' },
  { code: 'andean_yacon', label: 'Yacón' },
];

export const CEREALS: CropGroup = {
  fields: [
    { code: 'cereal_oats', label: 'Avena (ha)' },
    { code: 'cereal_barley', label: 'Cebada (ha)' },
    { code: 'cereal_corn', label: 'Maíz (ha)' },
    { code: 'cereal_sorghum', label: 'Sorgo (ha)' },
    { code: 'cereal_wheat', label: 'Trigo (ha)' },
    { code: 'cereal_chickpea', label: 'Garbanzo (ha)' },
    { code: 'cereal_soybean', label: 'Soja (ha)' },
    { code: 'cereal_sunflower', label: 'Girasol (ha)' },
    { code: 'cereal_black_beans', label: 'Poroto negro (ha)' },
    { code: 'cereal_kidney_beans', label: 'Poroto alubia (ha)' },
    { code: 'cereal_other', label: 'Otros (ha)' },
  ],
  detail: { code: 'cereal_other', label: 'Detalle de "otros" (cereales)' },
};

export const INDUSTRIAL: CropGroup = {
  fields: [
    { code: 'industrial_sugar_cane', label: 'Caña de azúcar (ha)' },
    { code: 'industrial_tobacco', label: 'Tabaco (ha)' },
    { code: 'industrial_other', label: 'Otros (ha)' },
  ],
  detail: { code: 'industrial_other', label: 'Detalle de "otros" (industriales)' },
};

export const CITRUS: CropGroup = {
  fields: [
    { code: 'fruit_tree_lemon', label: 'Limonero (ha)' },
    { code: 'fruit_tree_mandarin', label: 'Mandarino (ha)' },
    { code: 'fruit_tree_navel_orange', label: 'Naranjo con ombligo (ha)' },
    { code: 'fruit_tree_valencia_orange', label: 'Naranjo sin ombligo (ha)' },
    { code: 'fruit_tree_grapefruit', label: 'Pomelo (ha)' },
    { code: 'fruit_tree_citrus_other', label: 'Otros cítricos (ha)' },
  ],
  detail: { code: 'fruit_tree_citrus_other', label: 'Detalle de "otros" (cítricos)' },
};

export const POME_FRUIT: CropGroup = {
  fields: [
    { code: 'fruit_tree_apple', label: 'Manzana (ha)' },
    { code: 'fruit_tree_pear', label: 'Peral (ha)' },
    { code: 'fruit_tree_plum', label: 'Ciruelo (ha)' },
  ],
};

export const STONE_FRUIT: CropGroup = {
  fields: [
    { code: 'fruit_tree_apricot', label: 'Damasco (ha)' },
    { code: 'fruit_tree_peach', label: 'Durazno (ha)' },
    { code: 'fruit_tree_avocado', label: 'Palta (ha)' },
    { code: 'fruit_tree_stone_fruit_other', label: 'Otros de carozo (ha)' },
  ],
  detail: { code: 'fruit_tree_stone_fruit_other', label: 'Detalle de "otros" (carozo)' },
};

export const FLOWERS: CropGroup = {
  fields: [
    { code: 'flower_carnation', label: 'Clavel (ha)' },
    { code: 'flower_chrysanthemum', label: 'Crisantemos (ha)' },
    { code: 'flower_rose', label: 'Rosas (ha)' },
    { code: 'flower_yervera', label: 'Yerveras (ha)' },
    { code: 'flower_other', label: 'Otros (ha)' },
  ],
  detail: { code: 'flower_other', label: 'Detalle de "otros" (flores)' },
};

export const CROPS_TEXTS = {
  hasActivity: '¿Registra actividad agrícola?',
  hectares: 'Hectáreas',
  rows: 'Rayas',
  detail: 'Detalle',
  quantity: 'Cantidad',
  vegetables: 'Hortalizas',
  hasVegetables: '¿Posee hortalizas?',
  andean: 'Cultivos andinos',
  hasAndean: '¿Posee cultivos andinos?',
  cereals: 'Cereales y oleaginosas',
  hasCereals: '¿Posee cereales u oleaginosas?',
  industrial: 'Cultivos industriales',
  hasIndustrial: '¿Posee cultivos industriales?',
  fruitTrees: 'Frutales',
  hasFruitTrees: '¿Posee frutales?',
  citrus: 'Cítricos',
  pomeFruit: 'Frutales de pepita',
  stoneFruit: 'Frutales de carozo',
  flowers: 'Flores de corte',
  hasFlowers: '¿Posee flores de corte?',
  aromatics: 'Hierbas aromáticas',
  hasAromatics: '¿Posee hierbas aromáticas?',
  nurseries: 'Viveros',
  hasNurseries: '¿Posee viveros?',
};
