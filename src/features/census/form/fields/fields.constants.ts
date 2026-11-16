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

/** The texts of the fields more than one step asks. */
export const FIELD_TEXTS = {
  department: 'Departamento',
  departmentPlaceholder: 'Seleccioná un departamento',
  locality: 'Localidad',
  localityPlaceholder: 'Buscar localidad...',
  localityNeedsDepartment: 'Elegí primero el departamento.',
  localityEmpty: 'No hay localidades con ese nombre',
  createLocality: (text: string) => `Agregar localidad «${text}»`,
  newLocality: 'Localidad nueva: se agrega al enviar el censo.',
  latitude: 'Latitud',
  longitude: 'Longitud',
  useLocation: 'Usar mi ubicación',
  pickOnMap: 'Elegir en el mapa',
  locating: 'Buscando ubicación...',
  locationDenied: 'Sin permiso de ubicación. Habilitalo en los ajustes del teléfono.',
  noLocation: 'No se pudo obtener la ubicación. Probá al aire libre.',
};
