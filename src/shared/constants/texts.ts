/** User-facing texts. The app is only in Spanish, so there is no i18n layer. */
export const texts = {
  login: {
    title: 'Censo de productores',
    subtitle: 'Secretaría de Coordinación de Agencias de Desarrollo',
    logo: 'Jujuy, con la gente',
    copyright: '© 2026 Gobierno de la Provincia de Jujuy',
    email: 'Email',
    password: 'Contraseña',
    submit: 'Ingresar',
    submitting: 'Ingresando…',
    failed: 'No se pudo iniciar sesión',
    emailInvalid: 'Ingresá un email válido',
    emailRequired: 'El email es obligatorio',
    passwordRequired: 'La contraseña es obligatoria',
    notices: {
      expired: 'Tu sesión expiró. Iniciá sesión de nuevo.',
      offline_expired:
        'Pasaron más de 7 días sin conexión con el servidor. Conectate para iniciar sesión.',
    },
    errors: {
      invalid_credentials: 'Email o contraseña incorrectos.',
      cannot_take_censuses: 'Este usuario no puede cargar censos. Usá una cuenta de censista.',
      server: 'El servidor tuvo un problema. Intentá de nuevo en unos minutos.',
      offline_no_credential:
        'Sin conexión, y este usuario nunca inició sesión en este teléfono. Conectate para entrar por primera vez.',
      offline_expired:
        'Pasaron más de 7 días sin conexión con el servidor. Conectate para iniciar sesión.',
      offline_locked: 'Demasiados intentos fallidos sin conexión. Conectate para iniciar sesión.',
      offline_clock:
        'La fecha del teléfono parece incorrecta. Corregila o conectate para iniciar sesión.',
    },
    offlineWrongPassword: (remainingAttempts: number) =>
      `Email o contraseña incorrectos. Sin conexión te ${
        remainingAttempts === 1 ? 'queda 1 intento' : `quedan ${remainingAttempts} intentos`
      }.`,
  },
  startup: {
    failedTitle: 'La app no pudo arrancar',
    failedText:
      'No se pudo abrir la base de datos del teléfono. Los datos guardados no se borraron. Avisale a soporte.',
  },
  tabs: {
    home: 'Inicio',
    census: 'Censos',
    map: 'Mapa',
    profile: 'Perfil',
  },
  home: {
    welcome: (firstname: string) => `¡Hola, ${firstname}!`,
    empty: 'Elegí una pestaña para empezar.',
    offlineDataMissingTitle: 'Faltan los datos para trabajar sin conexión',
    offlineDataMissing: 'Conectate a internet antes de salir para descargarlos.',
  },
  census: {
    emptyTitle: 'Todavía no hay censos',
    empty: 'Acá vas a ver tus censos: borradores, pendientes de envío, enviados y a corregir.',
  },
  map: {
    notDownloaded:
      'El mapa de Jujuy todavía no se descargó. Se descarga solo, con WiFi y la sesión iniciada con conexión.',
    downloading: (percent: number) => `Descargando el mapa de Jujuy… ${percent}%`,
    unreadable: 'No se pudo abrir el mapa descargado.',
    zoomIn: 'Acercar',
    zoomOut: 'Alejar',
    showJujuy: 'Ver toda la provincia',
    myLocation: 'Mi ubicación',
    myPosition: 'Tu ubicación',
    pickedPoint: 'Punto marcado',
    latitude: 'Latitud',
    longitude: 'Longitud',
    accuracy: 'Precisión',
    copy: 'Copiar coordenadas',
    copied: 'Copiado',
    closeCoordinates: 'Cerrar coordenadas',
    searchingLocation: 'Buscando tu ubicación…',
    outsideMap: 'Tu ubicación está fuera del mapa de Jujuy.',
    noLocation: 'Todavía no hay señal de GPS. Probá de nuevo en un momento, al aire libre.',
    locationDenied:
      'Sin permiso de ubicación no se puede mostrar dónde estás. Podés darlo en los ajustes del teléfono.',
  },
  profile: {
    greeting: (firstname: string) => `Hola, ${firstname}`,
    signOut: 'Cerrar sesión',
    signingOut: 'Cerrando sesión…',
    offlineTitle: 'Sin conexión',
    offlineMode: 'Entraste con los datos guardados en este teléfono.',
    name: 'Nombre',
    email: 'Email',
    lastSync: 'Última sincronización',
    lastSyncValue: (time: number | null) =>
      time === null ? 'Nunca' : new Date(time).toLocaleString('es-AR'),
  },
} as const;
