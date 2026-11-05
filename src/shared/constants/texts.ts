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
    sessionExpired: 'Tu sesión expiró. Iniciá sesión de nuevo.',
    errors: {
      invalid_credentials: 'Email o contraseña incorrectos.',
      cannot_take_censuses: 'Este usuario no puede cargar censos. Usá una cuenta de censista.',
      network: 'No se pudo conectar con el servidor. Revisá la conexión e intentá de nuevo.',
      server: 'El servidor tuvo un problema. Intentá de nuevo en unos minutos.',
    },
  },
  profile: {
    greeting: (firstname: string) => `Hola, ${firstname}`,
    signOut: 'Salir',
    signingOut: 'Saliendo…',
  },
} as const;
