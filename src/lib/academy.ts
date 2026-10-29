export type AcademyTrackKey = 'fundamentos' | 'ceo' | 'cto' | 'cmo';

export interface AcademyTrack {
  key: AcademyTrackKey;
  label: string;
  short: string;
  tagline: string;
  accent: string;
  soft: string;
}

export interface AcademyBlock {
  title: string;
  body: string;
}

export interface AcademyQuizQuestion {
  question: string;
  options: string[];
  answer: number;
  explanation: string;
}

export interface AcademyLesson {
  id: string;
  track: AcademyTrackKey;
  level: 0 | 1 | 2;
  title: string;
  subtitle: string;
  minutes: number;
  xp: number;
  tag: string;
  mentorLine: string;
  blocks: AcademyBlock[];
  keyIdea: string;
  example: string;
  mistake: string;
  action: string;
  quiz: AcademyQuizQuestion[];
}

export const ACADEMY_TRACKS: AcademyTrack[] = [
  {
    key: 'fundamentos',
    label: 'Fundamentos SaaS',
    short: 'SaaS',
    tagline: 'Entiende el negocio antes de operarlo.',
    accent: 'var(--hq-gold)',
    soft: '#F7F0E3',
  },
  {
    key: 'ceo',
    label: 'CEO',
    short: 'CEO',
    tagline: 'Caja, clientes y decisiones.',
    accent: 'var(--hq-ceo)',
    soft: 'var(--hq-ceo-soft)',
  },
  {
    key: 'cto',
    label: 'CTO',
    short: 'CTO',
    tagline: 'Producto estable y deploy seguro.',
    accent: 'var(--hq-cto)',
    soft: 'var(--hq-cto-soft)',
  },
  {
    key: 'cmo',
    label: 'CMO',
    short: 'CMO',
    tagline: 'Oferta, contenido y leads.',
    accent: 'var(--hq-cmo)',
    soft: 'var(--hq-cmo-soft)',
  },
];

export const BADGE_LABELS: Record<string, { label: string; description: string }> = {
  'first-lesson': {
    label: 'Primer paso',
    description: 'Completaste tu primera cápsula.',
  },
  'perfect-quiz': {
    label: 'Mente clara',
    description: 'Respondiste todo bien en un quiz.',
  },
  'five-lessons': {
    label: 'Aprendiz constante',
    description: 'Completaste 5 cápsulas.',
  },
  'track-fundamentos': {
    label: 'Lenguaje SaaS',
    description: 'Terminaste Fundamentos SaaS.',
  },
  'track-ceo': {
    label: 'Silla del CEO',
    description: 'Terminaste la ruta CEO.',
  },
  'track-cto': {
    label: 'Guardia de producción',
    description: 'Terminaste la ruta CTO.',
  },
  'track-cmo': {
    label: 'Voz de la marca',
    description: 'Terminaste la ruta CMO.',
  },
};

export const ACADEMY_LESSONS: AcademyLesson[] = [
  // ───────────────────────── FUNDAMENTOS SaaS ─────────────────────────
  {
    id: 'saas-que-es',
    track: 'fundamentos',
    level: 0,
    title: '¿Qué es un SaaS?',
    subtitle: 'Software que se sirve, no se instala.',
    minutes: 3,
    xp: 50,
    tag: 'Base',
    mentorLine: 'No estás vendiendo una app. Estás vendiendo acceso continuo a un resultado.',
    blocks: [
      {
        title: 'Se usa por internet',
        body: 'El cliente entra desde el navegador y paga una suscripción. No instalas nada en su computadora.',
      },
      {
        title: 'Un producto, muchos clientes',
        body: 'El mismo software atiende a todos. Cada cliente nuevo cuesta poco extra y suma ingreso recurrente.',
      },
      {
        title: 'Nilah ya lo es',
        body: 'Un salón paga mes a mes por agenda, clientes y seguimiento. Si se queda, tu ingreso se repite.',
      },
    ],
    keyIdea: 'Un SaaS es un activo: se construye una vez y se sirve a muchos.',
    example: 'Nilah hoy tiene 2 salones. El mismo código puede servir a 200 sin duplicar el producto.',
    mistake: 'Confundir SaaS con “una app bonita”. El negocio no es el software: es la suscripción que resuelve un dolor.',
    action: 'Escribe en una línea qué acceso mensual vendes y a quién se lo vendes.',
    quiz: [
      {
        question: '¿Qué hace que un SaaS sea distinto de vender horas?',
        options: [
          'Que el cliente paga una vez y listo',
          'Que el ingreso se repite mientras el cliente usa el servicio',
          'Que siempre es más barato que contratar a alguien',
          'Que no necesita soporte',
        ],
        answer: 1,
        explanation: 'La suscripción convierte el ingreso en algo recurrente, no en un pago único por trabajo.',
      },
      {
        question: '¿Cuál es el activo real de Nilah?',
        options: [
          'El logo y los colores',
          'El número de seguidores en TikTok',
          'El software que resuelve un dolor y se puede servir a muchos',
          'La computadora donde programas',
        ],
        answer: 2,
        explanation: 'El activo es el producto que resuelve un problema y puede repetirse sin empezar de cero.',
      },
    ],
  },
  {
    id: 'saas-libertad',
    track: 'fundamentos',
    level: 0,
    title: 'Por qué un SaaS puede darte libertad',
    subtitle: 'Ingresos que no dependen de empezar de cero cada mes.',
    minutes: 3,
    xp: 50,
    tag: 'Motivación',
    mentorLine: 'La libertad no llega de un golpe de suerte. Se construye con ingresos que se repiten.',
    blocks: [
      {
        title: 'No vuelves a cero',
        body: 'Cada mes que un cliente se queda, tu ingreso base crece o se mantiene. Tu esfuerzo se acumula.',
      },
      {
        title: 'Margen y tiempo',
        body: 'Servir a un cliente más cuesta poco. Ganas tiempo para mejorar el producto en vez de perseguir cada peso.',
      },
      {
        title: 'Interés compuesto',
        body: 'Retención + meses + referidos = crecimiento que se siente lento al inicio y enorme después.',
      },
    ],
    keyIdea: 'La estabilidad financiera aparece cuando dejas de vender tiempo y empiezas a construir ingresos recurrentes.',
    example: 'Dos clientes que se quedan 12 meses ya son una base. El objetivo no es “solo 2”, es demostrar que se quedan.',
    mistake: 'Perseguir clientes nuevos antes de retener a los dos que ya confían en ti.',
    action: 'Calcula cuánto entra si conservas a tus 2 clientes durante 12 meses.',
    quiz: [
      {
        question: '¿Qué significa que el ingreso sea recurrente?',
        options: [
          'Que cobras más caro cada mes',
          'Que el cliente vuelve a pagar sin que tengas que venderle desde cero',
          'Que todo se cobra por adelantado',
          'Que no necesitas clientes nuevos nunca',
        ],
        answer: 1,
        explanation: 'Recurrente significa que el pago se repite mientras el cliente sigue usando el servicio.',
      },
      {
        question: 'Con 2 clientes, ¿cuál es la pregunta más útil?',
        options: [
          '¿Cómo consigo 100 seguidores más?',
          '¿Por qué se quedan y cómo repito eso?',
          '¿Cómo bajo el precio?',
          '¿Cómo cambio el producto otra vez?',
        ],
        answer: 1,
        explanation: 'Al inicio, entender la retención vale más que perseguir volumen.',
      },
    ],
  },
  {
    id: 'saas-motor',
    track: 'fundamentos',
    level: 0,
    title: 'El motor de un SaaS',
    subtitle: 'Adquisición, activación, retención e ingresos.',
    minutes: 3,
    xp: 50,
    tag: 'Sistema',
    mentorLine: 'Si no sabes en qué parte del motor estás, todo se siente urgente al mismo tiempo.',
    blocks: [
      {
        title: 'Adquisición',
        body: 'Cómo te conocen: contenido, referidos, WhatsApp, tu landing.',
      },
      {
        title: 'Activación',
        body: 'El cliente llega a su primer resultado. Si no lo logra rápido, se va.',
      },
      {
        title: 'Retención e ingresos',
        body: 'Se queda, paga y recomienda. Aquí se construye el negocio de verdad.',
      },
    ],
    keyIdea: 'Al inicio, retención > adquisición. Un cliente que se queda vale más que diez leads que nunca activan.',
    example: 'Un salón que agenda su primera semana en Nilah es más valioso que 50 vistas en TikTok.',
    mistake: 'Medir solo vistas y seguidores, sin mirar si el cliente llegó a su primer resultado.',
    action: 'Dibuja tu motor con 4 flechas y marca en cuál estás hoy.',
    quiz: [
      {
        question: '¿Qué pasa en la activación?',
        options: [
          'El cliente paga la factura',
          'El cliente llega a su primer resultado real con el producto',
          'El cliente te sigue en redes',
          'El cliente firma un contrato de 12 meses',
        ],
        answer: 1,
        explanation: 'Activación es el primer momento en que el cliente siente que el producto le sirve.',
      },
      {
        question: 'Al inicio, ¿qué métrica debería pesar más?',
        options: [
          'Vistas en TikTok',
          'Cantidad de seguidores',
          'Retención de los clientes que ya pagan',
          'Número de ideas nuevas',
        ],
        answer: 2,
        explanation: 'Retener valida que el producto resuelve algo real y sostiene el ingreso.',
      },
    ],
  },
  {
    id: 'saas-de-2-a-20',
    track: 'fundamentos',
    level: 1,
    title: 'De 2 a 20 clientes',
    subtitle: 'No estás estancado: estás validando.',
    minutes: 3,
    xp: 60,
    tag: 'Crecimiento',
    mentorLine: 'Dos clientes no son el techo. Son la prueba de que alguien paga por lo que construiste.',
    blocks: [
      {
        title: 'Qué no cambia',
        body: 'El dolor del cliente y tu promesa. No reinventes el producto cada semana.',
      },
      {
        title: 'Qué sí cambia',
        body: 'Onboarding, soporte y precio se vuelven procesos. Tu tiempo deja de ser infinito.',
      },
      {
        title: 'Tu ventaja',
        body: 'Conoces a la clienta por nombre. Eso te permite mejorar más rápido que un competidor grande.',
      },
    ],
    keyIdea: 'La fase de 2 clientes sirve para probar retención, no para demostrar velocidad de crecimiento.',
    example: 'Si los 2 salones renuevan 3 meses, tienes una señal más fuerte que 20 registros que se van en la semana 1.',
    mistake: 'Cambiar de producto o de nicho antes de saber por qué los 2 actuales se quedan.',
    action: 'Define la métrica que te dirá que estás listo para buscar el cliente 3.',
    quiz: [
      {
        question: '¿Qué valida mejor la fase de 2 clientes?',
        options: [
          'Que el producto tenga muchas funciones',
          'Que los clientes renueven y usen el servicio',
          'Que el logo se vea profesional',
          'Que tengas más seguidores',
        ],
        answer: 1,
        explanation: 'La renovación y el uso demuestran que el valor es real.',
      },
      {
        question: '¿Qué debería volverse un proceso al crecer?',
        options: [
          'Tu horario de sueño',
          'El onboarding y el soporte',
          'La cantidad de ideas',
          'El nombre del producto',
        ],
        answer: 1,
        explanation: 'Onboarding y soporte repetibles te permiten atender más clientes sin romperte.',
      },
    ],
  },
  {
    id: 'saas-vegano',
    track: 'fundamentos',
    level: 1,
    title: 'Construir para el sector vegano',
    subtitle: 'Propósito y negocio no están peleados.',
    minutes: 3,
    xp: 60,
    tag: 'Propósito',
    mentorLine: 'Vegi/Suna no es solo un SaaS. Es una forma de ayudar a un sector que te importa.',
    blocks: [
      {
        title: 'Nicho = confianza',
        body: 'Un restaurante vegano confía más en alguien que entiende su comunidad y sus dolores.',
      },
      {
        title: 'Empieza con un aliado',
        body: 'Un restaurante que te deje probar y medir es suficiente para validar. No necesitas 50.',
      },
      {
        title: 'Crece por comunidad',
        body: 'En nichos pequeños, el boca a boca pesa más que la publicidad. Cada cliente feliz abre la puerta a otro.',
      },
    ],
    keyIdea: 'Un negocio con propósito escala cuando el impacto y el ingreso apuntan en la misma dirección.',
    example: 'Si tu aliado vegano reduce el tiempo de pedidos, ese caso se convierte en tu mejor presentación.',
    mistake: 'Querer hablarle a “todos los restaurantes” y terminar sin hablarle a nadie.',
    action: 'Escribe el dolor #1 de tu restaurante aliado en una sola frase.',
    quiz: [
      {
        question: '¿Por qué empezar con un solo restaurante aliado?',
        options: [
          'Porque no hay más restaurantes',
          'Porque permite validar el dolor y medir resultados reales',
          'Porque así no necesitas vender',
          'Porque es más fácil hacer publicidad',
        ],
        answer: 1,
        explanation: 'Un aliado te da evidencia concreta antes de escalar.',
      },
      {
        question: '¿Qué hace fuerte a un nicho?',
        options: [
          'Que es enorme y genérico',
          'Que la comunidad se reconoce y recomienda',
          'Que no tiene competencia',
          'Que no necesita soporte',
        ],
        answer: 1,
        explanation: 'La confianza y el boca a boca dentro de una comunidad son una ventaja real.',
      },
    ],
  },

  // ───────────────────────── CEO ─────────────────────────
  {
    id: 'ceo-una-persona',
    track: 'ceo',
    level: 0,
    title: 'El CEO de una persona',
    subtitle: 'No haces todo: decides, mides y cobras.',
    minutes: 3,
    xp: 50,
    tag: 'Rol',
    mentorLine: 'Si el CEO intenta hacer todo, el negocio se queda sin dirección.',
    blocks: [
      {
        title: 'Decidir',
        body: 'Elegir qué no se hace esta semana es parte del trabajo. El foco es una decisión, no un sentimiento.',
      },
      {
        title: 'Medir',
        body: 'Caja, MRR, clientes activos y pipeline. Cuatro números bastan para empezar.',
      },
      {
        title: 'Cobrar y cuidar',
        body: 'Precio claro, factura a tiempo y una conversación humana con la clienta activa.',
      },
    ],
    keyIdea: 'El CEO protege el rumbo y la caja. No compite con el CTO ni con el CMO.',
    example: 'Nilah con 2 clientes: tu trabajo CEO es que renueven y que el precio sea sostenible.',
    mistake: 'Pasar el bloque CEO programando o editando video. Eso es CTO o CMO.',
    action: 'Escribe las 3 decisiones que solo tú puedes tomar esta semana.',
    quiz: [
      {
        question: '¿Cuál es una tarea típica del CEO?',
        options: [
          'Corregir un bug de producción',
          'Editar el video diario',
          'Decidir prioridades y cuidar la caja',
          'Responder todos los DMs',
        ],
        answer: 2,
        explanation: 'El CEO decide rumbo, prioridades y salud financiera.',
      },
      {
        question: '¿Qué significa “elegir qué no se hace”?',
        options: [
          'Dejar todo para mañana',
          'Proteger el foco del negocio',
          'Evitar hablar con clientes',
          'No medir resultados',
        ],
        answer: 1,
        explanation: 'Decir que no a lo secundario protege lo importante.',
      },
    ],
  },
  {
    id: 'ceo-caja-mrr',
    track: 'ceo',
    level: 0,
    title: 'Caja, MRR y churn sin jerga',
    subtitle: 'Los tres números que te dicen si el negocio respira.',
    minutes: 3,
    xp: 60,
    tag: 'Números',
    mentorLine: 'No necesitas un dashboard enorme. Necesitas saber si entra, cuánto se repite y quién se va.',
    blocks: [
      {
        title: 'Caja',
        body: 'El dinero que tienes disponible hoy. Si baja sin plan, el negocio se ahoga aunque tenga clientes.',
      },
      {
        title: 'MRR',
        body: 'Ingreso recurrente mensual: suma de suscripciones activas. Es tu base, no una promesa.',
      },
      {
        title: 'Churn',
        body: 'Clientes que se van. Al inicio, cada salida es una lección más valiosa que una venta nueva.',
      },
    ],
    keyIdea: 'MRR te dice cuánto se repite; churn te dice cuánto se escapa. La caja te dice si puedes esperar.',
    example: '2 clientes a $50 = $100 MRR. Si uno se va, tu MRR cae 50%: por eso retener pesa tanto.',
    mistake: 'Mirar solo ventas nuevas y no cuántos clientes siguen pagando.',
    action: 'Calcula hoy: caja, MRR y cuántos clientes tienes activos.',
    quiz: [
      {
        question: '¿Qué es el MRR?',
        options: [
          'El dinero total que has ganado en tu vida',
          'La suma de ingresos recurrentes mensuales activos',
          'Lo que cobras por un trabajo puntual',
          'El costo de tus herramientas',
        ],
        answer: 1,
        explanation: 'MRR es la base recurrente mensual, no el acumulado histórico.',
      },
      {
        question: 'Si pierdes 1 de 2 clientes, ¿qué pasa?',
        options: [
          'Nada, sigues igual',
          'Tu MRR cae aproximadamente 50%',
          'Sube tu churn a cero',
          'La caja se duplica',
        ],
        answer: 1,
        explanation: 'Con una base pequeña, cada cliente representa una porción enorme del ingreso.',
      },
    ],
  },
  {
    id: 'ceo-hablar-clienta',
    track: 'ceo',
    level: 1,
    title: 'Hablar con una clienta sin vender',
    subtitle: 'La conversación que retiene más que un descuento.',
    minutes: 3,
    xp: 60,
    tag: 'Clientes',
    mentorLine: 'Escuchar bien es una habilidad de negocio, no un gesto de simpatía.',
    blocks: [
      {
        title: 'Pregunta por el resultado',
        body: '“¿Qué cambió en tu semana desde que usas Nilah?” Vale más que “¿te gusta la app?”.',
      },
      {
        title: 'Busca el bloqueo',
        body: 'Pregunta qué parte le cuesta más. Ahí está tu próxima mejora de producto o de onboarding.',
      },
      {
        title: 'Cierra con un compromiso',
        body: 'Una acción concreta para esta semana. No una promesa vaga.',
      },
    ],
    keyIdea: 'La retención se construye en conversaciones pequeñas y constantes, no en una gran campaña.',
    example: 'Una clienta que agenda su primera semana en Nilah tiene menos riesgo de irse.',
    mistake: 'Hablar solo cuando hay un problema o cuando toca cobrar.',
    action: 'Agenda una llamada de 10 minutos con una clienta y usa las 3 preguntas.',
    quiz: [
      {
        question: '¿Cuál pregunta te da más información útil?',
        options: [
          '¿Te gusta la app?',
          '¿Qué cambió en tu semana desde que la usas?',
          '¿Cuánto pagarías?',
          '¿Conoces a alguien que la necesite?',
        ],
        answer: 1,
        explanation: 'El resultado real importa más que una opinión general.',
      },
      {
        question: '¿Cómo cierras una buena conversación de retención?',
        options: [
          'Con un descuento inmediato',
          'Con una acción concreta para esta semana',
          'Con una promesa de mejorar todo',
          'Sin compromiso, para no presionar',
        ],
        answer: 1,
        explanation: 'Un compromiso pequeño y claro mueve la relación.',
      },
    ],
  },

  // ───────────────────────── CTO ─────────────────────────
  {
    id: 'cto-produccion',
    track: 'cto',
    level: 0,
    title: 'Qué significa “esto está en producción”',
    subtitle: 'Alguien real lo usa y depende de que no se rompa.',
    minutes: 3,
    xp: 50,
    tag: 'Base',
    mentorLine: 'Producción no es tu laptop. Es el lugar donde un error tiene consecuencias reales.',
    blocks: [
      {
        title: 'Hay usuarios reales',
        body: 'Un bug en producción afecta a una clienta que paga. La prioridad cambia.',
      },
      {
        title: 'Todo cambio deja rastro',
        body: 'Sin logs y sin backups, un error se vuelve adivinanza.',
      },
      {
        title: 'Estabilidad primero',
        body: 'Una función nueva vale menos que un servicio que no se cae.',
      },
    ],
    keyIdea: 'En producción, prevenir y observar vale más que la velocidad de publicar.',
    example: 'Si Nilah deja de cargar la agenda de un salón, ese negocio se detiene ese día.',
    mistake: 'Probar solo en local y asumir que el entorno real se comporta igual.',
    action: 'Haz una lista de las 3 cosas que no pueden fallar en Nilah.',
    quiz: [
      {
        question: '¿Qué diferencia a producción de tu entorno local?',
        options: [
          'Que usa otro color',
          'Que hay usuarios reales que dependen del servicio',
          'Que es más rápida',
          'Que no necesita pruebas',
        ],
        answer: 1,
        explanation: 'El impacto real sobre clientes es lo que define producción.',
      },
      {
        question: '¿Qué es más importante al inicio?',
        options: [
          'Publicar muchas funciones rápido',
          'Mantener estable lo que ya usan los clientes',
          'Cambiar el diseño cada semana',
          'Agregar integraciones que nadie pidió',
        ],
        answer: 1,
        explanation: 'La estabilidad sostiene la confianza y el ingreso recurrente.',
      },
    ],
  },
  {
    id: 'cto-deploy',
    track: 'cto',
    level: 0,
    title: 'Deploy seguro en 10 minutos',
    subtitle: 'Una checklist que evita sustos.',
    minutes: 3,
    xp: 60,
    tag: 'Operación',
    mentorLine: 'Un deploy seguro no es lento. Es ordenado.',
    blocks: [
      {
        title: 'Antes',
        body: 'Prueba el flujo principal, revisa variables de entorno y ten un plan para volver atrás.',
      },
      {
        title: 'Durante',
        body: 'Publica un cambio pequeño a la vez. Si algo falla, sabes exactamente qué lo causó.',
      },
      {
        title: 'Después',
        body: 'Revisa logs y el flujo del cliente. Un deploy no termina cuando compila: termina cuando funciona.',
      },
    ],
    keyIdea: 'Cambios pequeños + verificación después = menos incidentes y más confianza.',
    example: 'Sube el fix de agenda de Nilah solo, verifica, y recién después toca otra cosa.',
    mistake: 'Desplegar cinco cambios juntos y no saber cuál rompió todo.',
    action: 'Escribe tu checklist de deploy en 5 pasos y guárdala.',
    quiz: [
      {
        question: '¿Por qué desplegar cambios pequeños?',
        options: [
          'Porque se ven mejor',
          'Porque si algo falla es más fácil identificar la causa',
          'Porque así no necesitas probar',
          'Porque tarda más',
        ],
        answer: 1,
        explanation: 'Aislar cambios reduce el riesgo y acelera el diagnóstico.',
      },
      {
        question: '¿Cuándo termina un deploy?',
        options: [
          'Cuando el build compila',
          'Cuando lo subes a GitHub',
          'Cuando verificas logs y el flujo real del cliente',
          'Cuando avisas por WhatsApp',
        ],
        answer: 2,
        explanation: 'La verificación post-deploy es parte del trabajo, no un extra.',
      },
    ],
  },
  {
    id: 'cto-logs-ia',
    track: 'cto',
    level: 1,
    title: 'Leer un error y pedir ayuda a la IA',
    subtitle: 'Contexto primero, código después.',
    minutes: 3,
    xp: 60,
    tag: 'Diagnóstico',
    mentorLine: 'La IA no adivina. Si le das contexto, te ahorra horas.',
    blocks: [
      {
        title: 'Captura el error',
        body: 'Mensaje exacto, pantalla o endpoint, y qué estabas haciendo cuando ocurrió.',
      },
      {
        title: 'Da contexto',
        body: 'Stack, archivos involucrados, último cambio y qué ya intentaste.',
      },
      {
        title: 'Pide un plan',
        body: '“Dame 3 hipótesis ordenadas por probabilidad y cómo verificar cada una”.',
      },
    ],
    keyIdea: 'Un buen prompt de diagnóstico incluye síntoma, contexto y una pregunta concreta.',
    example: '“La agenda de Nilah no carga solo para un salón. Error X en la consola. Último cambio: RLS. Dame 3 hipótesis.”',
    mistake: 'Pegar 500 líneas de código sin decir qué falla ni qué esperabas.',
    action: 'Toma el último error que viste y escribe un prompt con síntoma, contexto y pregunta.',
    quiz: [
      {
        question: '¿Qué debe incluir un buen prompt de diagnóstico?',
        options: [
          'Solo el código completo',
          'Síntoma, contexto y una pregunta concreta',
          'Una disculpa por molestar',
          'Todas las ideas del proyecto',
        ],
        answer: 1,
        explanation: 'El contexto guía la respuesta y evita soluciones genéricas.',
      },
      {
        question: '¿Qué conviene pedirle a la IA después del diagnóstico?',
        options: [
          'Que reescriba todo el proyecto',
          'Un plan con hipótesis y cómo verificarlas',
          'Que decida por ti sin explicar',
          'Que ignore los logs',
        ],
        answer: 1,
        explanation: 'Un plan verificable te ayuda a aprender y a no romper más cosas.',
      },
    ],
  },

  // ───────────────────────── CMO ─────────────────────────
  {
    id: 'cmo-oferta',
    track: 'cmo',
    level: 0,
    title: 'Oferta y a quién le hablas',
    subtitle: 'Sin claridad, el contenido no vende.',
    minutes: 3,
    xp: 50,
    tag: 'Base',
    mentorLine: 'No le hablas a “todo el mundo”. Le hablas a una dueña de salón con un dolor concreto.',
    blocks: [
      {
        title: 'El dolor',
        body: 'Qué le quita el sueño: agenda desordenada, clientas que no vuelven, WhatsApp saturado.',
      },
      {
        title: 'La promesa',
        body: 'El resultado en una frase: “recupera tu agenda y tus clientas sin caos”',
      },
      {
        title: 'La prueba',
        body: 'Un caso, un antes/después o una captura real. Sin prueba, la promesa suena a promesa.',
      },
    ],
    keyIdea: 'Oferta clara = dolor específico + resultado concreto + prueba real.',
    example: 'Nilah no vende “software de gestión”. Vende “tu salón ordenado y tus clientas volviendo”.',
    mistake: 'Hablar de funciones (“tiene calendario”) en vez de resultados (“recuperas 2 horas por semana”).',
    action: 'Escribe tu oferta en una frase: para quién, qué resultado y con qué prueba.',
    quiz: [
      {
        question: '¿Qué hace clara una oferta?',
        options: [
          'Muchas funciones',
          'Dolor específico, resultado concreto y prueba real',
          'Un logo bonito',
          'Un precio bajo',
        ],
        answer: 1,
        explanation: 'La claridad viene del problema y del resultado, no de la lista de funciones.',
      },
      {
        question: '¿Qué es una prueba en una oferta?',
        options: [
          'Una opinión tuya',
          'Un caso real o antes/después',
          'Una promesa grande',
          'Un descuento',
        ],
        answer: 1,
        explanation: 'La evidencia real reduce el riesgo percibido.',
      },
    ],
  },
  {
    id: 'cmo-video-30s',
    track: 'cmo',
    level: 0,
    title: 'El video de 30 segundos',
    subtitle: 'Hook, dolor, prueba y llamada a la acción.',
    minutes: 3,
    xp: 60,
    tag: 'Contenido',
    mentorLine: 'Los primeros 2 segundos deciden si te ven. El resto decide si te creen.',
    blocks: [
      {
        title: 'Hook',
        body: 'Una frase que rompe el scroll: “Si tu salón vive en WhatsApp, esto es para ti”',
      },
      {
        title: 'Dolor + prueba',
        body: 'Muestra el caos y luego el resultado real. Sin prueba, es solo opinión.',
      },
      {
        title: 'CTA',
        body: 'Una sola acción: “Comenta AGENDA y te muestro cómo”. No pidas tres cosas.',
      },
    ],
    keyIdea: 'Un video no vende el producto: vende el siguiente paso.',
    example: 'Video de Nilah: hook con agenda saturada, antes/después de una semana ordenada, CTA a WhatsApp.',
    mistake: 'Empezar con “Hola, soy…” y explicar funciones durante 20 segundos.',
    action: 'Escribe un guion de 30s con las 4 partes y grábalo hoy.',
    quiz: [
      {
        question: '¿Cuál es la función del hook?',
        options: [
          'Presentarte formalmente',
          'Detener el scroll con una frase relevante',
          'Explicar todas las funciones',
          'Pedir el follow',
        ],
        answer: 1,
        explanation: 'El hook gana los primeros segundos; sin eso, el resto no se ve.',
      },
      {
        question: '¿Cuántas llamadas a la acción debe tener un video corto?',
        options: [
          'Tres o más',
          'Una sola y clara',
          'Ninguna',
          'Todas las que se te ocurran',
        ],
        answer: 1,
        explanation: 'Una acción clara convierte mejor que varias opciones.',
      },
    ],
  },
  {
    id: 'cmo-responder-lead',
    track: 'cmo',
    level: 1,
    title: 'Responder un lead en 5 minutos',
    subtitle: 'La velocidad y la claridad ganan.',
    minutes: 3,
    xp: 60,
    tag: 'Ventas',
    mentorLine: 'Un lead no quiere un discurso. Quiere saber si lo entiendes.',
    blocks: [
      {
        title: 'Reconoce',
        body: 'Usa su nombre y menciona lo que dijo. Demuestra que leíste, no que copiaste.',
      },
      {
        title: 'Haz una pregunta',
        body: 'Una sola pregunta que te ayude a calificar: “¿cuántas clientas atiendes por semana?”',
      },
      {
        title: 'Propón el siguiente paso',
        body: 'Una llamada de 10 minutos o un video corto. No dejes la conversación abierta.',
      },
    ],
    keyIdea: 'Responder rápido no es perseguir: es respetar el interés de la otra persona.',
    example: '“Hola María, vi que tu salón trabaja con agenda manual. ¿Cuántas clientas atiendes por semana? Te muestro en 10 min cómo lo ordenamos.”',
    mistake: 'Responder con un PDF enorme o con “¿en qué te ayudo?” sin contexto.',
    action: 'Escribe tu plantilla de respuesta en 3 líneas y guárdala.',
    quiz: [
      {
        question: '¿Qué debe incluir una buena primera respuesta?',
        options: [
          'Un discurso de ventas largo',
          'Reconocimiento, una pregunta y un siguiente paso',
          'Un descuento inmediato',
          'Solo el precio',
        ],
        answer: 1,
        explanation: 'Reconocer + calificar + proponer mantiene la conversación viva.',
      },
      {
        question: '¿Por qué importa responder rápido?',
        options: [
          'Porque el lead se enfría y pierde interés',
          'Porque TikTok lo exige',
          'Porque así cobras más',
          'Porque evita hacer contenido',
        ],
        answer: 0,
        explanation: 'La ventana de interés es corta; la velocidad demuestra que te importa.',
      },
    ],
  },
];

export function lessonsForTrack(track: AcademyTrackKey): AcademyLesson[] {
  return ACADEMY_LESSONS.filter((lesson) => lesson.track === track);
}

export function trackMeta(track: AcademyTrackKey): AcademyTrack {
  return ACADEMY_TRACKS.find((item) => item.key === track) ?? ACADEMY_TRACKS[0];
}

export function levelFromXp(xp: number): { level: number; nextAt: number; progress: number } {
  const thresholds = [0, 100, 250, 450, 700, 1000, 1400, 1900];
  let level = 1;
  for (let index = 0; index < thresholds.length; index += 1) {
    if (xp >= thresholds[index]) level = index + 1;
  }
  const current = thresholds[Math.min(level - 1, thresholds.length - 1)];
  const next = thresholds[Math.min(level, thresholds.length - 1)];
  const progress =
    next > current ? Math.min(100, Math.round(((xp - current) / (next - current)) * 100)) : 100;
  return { level, nextAt: next, progress };
}

export function isLessonUnlocked(
  lesson: AcademyLesson,
  completed: Record<string, unknown>
): boolean {
  const trackLessons = lessonsForTrack(lesson.track);
  const index = trackLessons.findIndex((item) => item.id === lesson.id);
  if (index <= 0) return true;
  return Boolean(completed[trackLessons[index - 1].id]);
}

export function nextAcademyLesson(
  completed: Record<string, unknown>
): AcademyLesson | null {
  for (const track of ACADEMY_TRACKS) {
    for (const lesson of lessonsForTrack(track.key)) {
      if (!completed[lesson.id] && isLessonUnlocked(lesson, completed)) {
        return lesson;
      }
    }
  }
  return null;
}

