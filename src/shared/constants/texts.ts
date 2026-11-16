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
  connection: {
    noSignal: 'Sin conexión',
    offlineSession: 'Sesión sin conexión',
  },
  tabs: {
    census: 'Censos',
    map: 'Mapa',
    profile: 'Perfil',
  },
  census: {
    offlineDataMissingTitle: 'Faltan los datos para trabajar sin conexión',
    offlineDataMissing: 'Conectate a internet antes de salir para descargarlos.',
    emptyTitle: 'Todavía no hay censos',
    list: {
      sections: {
        toCheck: 'Para revisar',
        drafts: 'Borradores',
        pending: 'Pendientes de envío',
        sent: 'Enviados',
      },
      status: {
        draft: 'Borrador',
        ready: 'Pendiente',
        sent: 'Enviado',
        in_review: 'En revisión',
        needs_fix: 'A corregir',
        anomaly: 'No registrado',
      },
      noProducer: 'Productor sin nombre',
      close: 'Cerrar',
      needsFixTitle: 'Datos para corregir',
      needsFix:
        'El servidor no aceptó el censo por estos datos. Corregilos en el teléfono y se vuelve a enviar.',
      fix: 'Corregir',
      anomalyTitle: 'No se pudo registrar',
      anomaly:
        'El servidor no aceptó este censo y no se vuelve a enviar. Avisá a la oficina para que lo revisen.',
      inReviewTitle: 'Enviado, en revisión',
      inReview: 'El censo llegó y la oficina tiene que revisarlo.',
    },
    newCensus: 'Nuevo censo',
    form: {
      title: 'Censo',
      date: 'Fecha',
      formNumber: 'N° de formulario',
      observations: 'Observaciones',
      finish: 'Terminar censo',
      missingTitle: 'Falta completar',
      missing: {
        date: 'La fecha del censo.',
        producer: 'El nombre y el documento del productor.',
        farm: 'Qué finca del productor se censa.',
        forestation: 'La especie y el tipo de cada fila de forestación (Insumos).',
      },
      toFixTitle: 'El servidor no aceptó estos datos',
      finished: 'Censo listo para enviar',
      saved: (time: string) => `Guardado ${time}`,
      gone: 'Este censo ya no es un borrador.',
      discard: 'Descartar',
      discardTitle: '¿Descartar este censo?',
      discardText: 'Se borra del teléfono y no se puede recuperar.',
      discardCancel: 'Volver',
    },
    test: {
      button: 'Crear censo de prueba',
      created: 'Censo de prueba listo para enviar',
    },
    send: {
      button: 'Enviar censos',
      sending: 'Enviando…',
      offlineSessionTitle: 'No se puede enviar',
      offlineSession: 'Entraste sin conexión. Iniciá sesión con internet para enviar los censos.',
      failedTitle: 'No se pudo enviar',
      failed: 'Intentá de nuevo.',
      nothing: 'No hay censos para enviar',
      sent: (count: number) => (count === 1 ? 'Se envió 1 censo' : `Se enviaron ${count} censos`),
      toCheckTitle: 'Hay censos para revisar',
      needsFix: (count: number) =>
        count === 1
          ? '1 censo tiene datos para corregir.'
          : `${count} censos tienen datos para corregir.`,
      anomalies: (count: number) =>
        count === 1
          ? '1 censo no se pudo registrar. Avisá a la oficina.'
          : `${count} censos no se pudieron registrar. Avisá a la oficina.`,
      waiting: (count: number) =>
        count === 1
          ? 'Quedó 1 censo sin enviar. Se vuelve a intentar cuando haya señal.'
          : `Quedaron ${count} censos sin enviar. Se vuelve a intentar cuando haya señal.`,
    },
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
    pickTitle: 'Elegí la ubicación',
    pickHint: 'Mové el mapa hasta que el punto rojo quede sobre el lugar.',
    pickConfirm: 'Confirmar ubicación',
    pickCancel: 'Cancelar',
  },
  profile: {
    greeting: (firstname: string) => `Hola, ${firstname}`,
    signOut: 'Cerrar sesión',
    signingOut: 'Cerrando sesión…',
    unsentTitle: 'Tenés censos sin enviar',
    unsent: (count: number) =>
      count === 1
        ? 'Queda 1 censo sin enviar en este teléfono. No se borra, pero solo se envía cuando vuelvas a iniciar sesión con tu usuario.'
        : `Quedan ${count} censos sin enviar en este teléfono. No se borran, pero solo se envían cuando vuelvas a iniciar sesión con tu usuario.`,
    unsentConfirm: 'Cerrar sesión igual',
    unsentCancel: 'Volver',
    offlineTitle: 'Sin conexión',
    offlineMode: 'Entraste con los datos guardados en este teléfono.',
    name: 'Nombre',
    email: 'Email',
    // The last time the catalogs were checked with the API: sending censuses does not move it.
    lastSync: 'Datos actualizados',
    lastSyncValue: (time: number | null) =>
      time === null ? 'Nunca' : new Date(time).toLocaleString('es-AR'),
  },
} as const;
