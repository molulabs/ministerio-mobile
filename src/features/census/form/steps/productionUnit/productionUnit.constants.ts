/** The land tenure options, the web's values (API's ProductionUnitRequest.landTenure). */
export const LAND_TENURE_OPTIONS = [
  { label: 'Propietario', value: 'propietario' },
  { label: 'Sucesión indivisa', value: 'sucesion_indivisa' },
  { label: 'Arrendatario', value: 'arrendatario' },
  { label: 'Aparcería', value: 'aparceria' },
  { label: 'Comunidad', value: 'comunidad' },
  { label: 'Otros', value: 'otros' },
];

/** The option that asks for a detail. */
export const OTHER_LAND_TENURE = 'otros';

/** The API's limits (ProductionUnitRequest), as the web's inputs. */
export const MAX_LENGTH = { street: 100, number: 20, paraje: 50 };

/** The step's texts, the web's. */
export const PRODUCTION_UNIT_TEXTS = {
  address: 'Dirección de la finca',
  livesOnFarm: 'El productor vive en la finca: está en el domicilio cargado con sus datos.',
  street: 'Calle - Ruta (unidad productiva)',
  number: 'Número - Km',
  paraje: 'Paraje',
  surface: 'Superficie',
  totalHectares: 'Hectáreas totales',
  producedHectares: 'Hectáreas producidas',
  hectaresWarning: 'Las hectáreas producidas superan las totales',
  landTenure: 'Tenencia de la tierra',
  landTenureOtherDetail: 'Detalle de "otros" (tenencia)',
  services: 'Servicios',
  drinkingWater: 'Agua potable para consumo humano',
  irrigationWater: 'Agua para riego',
  electricGrid: 'Red eléctrica u otra fuente de energía',
  gas: 'Gas',
  telephone: 'Telefonía',
  internet: 'Internet',
};
