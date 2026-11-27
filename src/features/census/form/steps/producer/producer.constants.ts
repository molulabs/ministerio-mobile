/** The API's DocumentType enum, with the web's labels. Most producers have a DNI. */
export const DOCUMENT_TYPE_OPTIONS = [
  { value: 'DNI', label: 'DNI' },
  { value: 'CUIL', label: 'CUIL' },
  { value: 'CUIT', label: 'CUIT' },
  { value: 'PASAPORTE', label: 'Pasaporte' },
];

/**
 * A producer whose DNI and CUIL were lost when a census sheet was transcribed: only the office's
 * census import gives it, with a number "SD-<import>-<line>" (the API's DocumentType::PROVISIONAL),
 * so it is never offered to choose. A phone can census them as any registered producer.
 */
export const PROVISIONAL_DOCUMENT = {
  type: 'SIN_DOCUMENTO',
  label: 'Sin documento',
  prefix: 'SD-',
};

/** A CUIL has 11 digits: a search with 11 digits starts a producer with a CUIL. */
export const CUIL_DIGITS = 11;

/** The search starts with this many characters, as in the web. */
export const MIN_SEARCH_CHARS = 3;

/** The API's limits (ProducerRequest, FarmDataRequest), as the web's inputs. */
export const MAX_LENGTH = {
  fullName: 100,
  nationality: 50,
  cuil: 20,
  phone: 20,
  email: 100,
  street: 100,
  number: 20,
  postalCode: 20,
  paraje: 50,
  community: 50,
  apartment: 20,
  brandAndSignals: 100,
  renspa: 50,
};

/** The step's texts, the web's where it has them. */
export const PRODUCER_TEXTS = {
  searchHint:
    'Buscá por DNI o CUIL para completar sus datos y evitar duplicados. Si no está registrado, elegí «Crear productor».',
  searchLabel: 'DNI o CUIL',
  searchPlaceholder: 'Ej. 28451902',
  searchEmpty: 'Ningún productor registrado tiene ese documento',
  create: (text: string) => `Crear productor «${text}»`,
  registered: 'Productor registrado: sus datos ya los tiene la oficina.',
  newProducer: 'Productor nuevo: se registra al enviar el censo.',
  data: 'Datos del productor',
  fullName: 'Apellido y nombre',
  birthDate: 'Fecha de nacimiento',
  nationality: 'Nacionalidad',
  nationalityPlaceholder: 'Buscar país...',
  documentType: 'Tipo de documento',
  documentTypePlaceholder: 'Seleccioná un tipo',
  documentNumber: 'Número de documento',
  document: 'Documento',
  cuil: 'CUIL',
  contact: 'Contacto',
  phone: 'Teléfono',
  email: 'Email',
  address: 'Dirección',
  street: 'Calle - Ruta',
  number: 'N° / Km',
  postalCode: 'Código postal',
  paraje: 'Paraje',
  community: 'Comunidad',
  apartment: 'Departamento/piso (domicilio urbano)',
  brandAndSignals: 'Marca y señales',
  farm: 'Finca',
  newFarm: 'Es otra finca del productor',
  newFarmHint: 'Marcala si el productor ya tiene una finca censada y esta es otra.',
  anotherFarm: 'Otra finca',
  anotherFarmHint: 'Una finca del productor que todavía no está registrada.',
  renspa: 'RENSPA N°',
  livesOnFarm: 'El productor vive en la finca',
};
