/** User-facing texts. The app is only in Spanish, so there is no i18n layer. */
export const texts = {
  login: {
    title: 'Iniciar sesión',
    email: 'Email',
    password: 'Contraseña',
    submit: 'Entrar',
    submitting: 'Entrando…',
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
    census: 'Censos',
    map: 'Mapa',
    profile: 'Perfil',
  },
  census: {
    empty: 'Acá vas a ver tus censos: borradores, pendientes de envío, enviados y a corregir.',
  },
  map: {
    empty: 'Acá va a estar el mapa de Jujuy, disponible sin conexión.',
  },
  profile: {
    greeting: (firstname: string) => `Hola, ${firstname}`,
    signOut: 'Salir',
    signingOut: 'Saliendo…',
    offlineMode: 'Sin conexión: entraste con los datos guardados en este teléfono.',
    lastSync: (time: number | null) =>
      time === null
        ? 'Última sincronización: nunca'
        : `Última sincronización: ${new Date(time).toLocaleString('es-AR')}`,
  },
} as const;
