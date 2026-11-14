/** The API's DocumentType enum, with the web's labels. Most producers have a DNI. */
export const DOCUMENT_TYPE_OPTIONS = [
  { value: 'DNI', label: 'DNI' },
  { value: 'CUIL', label: 'CUIL' },
  { value: 'CUIT', label: 'CUIT' },
  { value: 'PASAPORTE', label: 'Pasaporte' },
];

/** The departments of Jujuy: the API's Department enum, with the web's labels. */
export const DEPARTMENT_OPTIONS = [
  { value: 'COCHINOCA', label: 'Cochinoca' },
  { value: 'DOCTOR_MANUEL_BELGRANO', label: 'Doctor Manuel Belgrano' },
  { value: 'EL_CARMEN', label: 'El Carmen' },
  { value: 'HUMAHUACA', label: 'Humahuaca' },
  { value: 'LEDESMA', label: 'Ledesma' },
  { value: 'PALPALA', label: 'Palpalá' },
  { value: 'RINCONADA', label: 'Rinconada' },
  { value: 'SAN_ANTONIO', label: 'San Antonio' },
  { value: 'SAN_PEDRO', label: 'San Pedro' },
  { value: 'SANTA_BARBARA', label: 'Santa Bárbara' },
  { value: 'SANTA_CATALINA', label: 'Santa Catalina' },
  { value: 'SUSQUES', label: 'Susques' },
  { value: 'TILCARA', label: 'Tilcara' },
  { value: 'TUMBAYA', label: 'Tumbaya' },
  { value: 'VALLE_GRANDE', label: 'Valle Grande' },
  { value: 'YAVI', label: 'Yavi' },
];

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
  registered:
    'Productor registrado. Lo que completes reemplaza sus datos; lo que dejes vacío no borra nada.',
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
  department: 'Departamento',
  departmentPlaceholder: 'Seleccioná un departamento',
  locality: 'Localidad',
  localityPlaceholder: 'Buscar localidad...',
  localityNeedsDepartment: 'Elegí primero el departamento.',
  localityEmpty: 'No hay localidades con ese nombre',
  createLocality: (text: string) => `Agregar localidad «${text}»`,
  newLocality: 'Localidad nueva: se agrega al enviar el censo.',
  postalCode: 'Código postal',
  paraje: 'Paraje',
  community: 'Comunidad',
  apartment: 'Departamento/piso (domicilio urbano)',
  brandAndSignals: 'Marca y señales',
  latitude: 'Latitud',
  longitude: 'Longitud',
  useLocation: 'Usar mi ubicación',
  locating: 'Buscando ubicación...',
  locationDenied: 'Sin permiso de ubicación. Habilitalo en los ajustes del teléfono.',
  noLocation: 'No se pudo obtener la ubicación. Probá al aire libre.',
  farm: 'Finca',
  newFarm: 'Es otra finca del productor',
  newFarmHint: 'Marcala si el productor ya tiene una finca censada y esta es otra.',
  renspa: 'RENSPA N°',
  livesOnFarm: 'El productor vive en la finca',
  yes: 'Sí',
  no: 'No',
};
