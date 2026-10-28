import type { RoleKey } from './hqRoles';

export interface RoleTeachCard {
  key: RoleKey;
  hat: string;
  question: string;
  decides: string;
  never: string;
  metric: string;
  example: string;
}

export const DIA_CERO_CARDS: RoleTeachCard[] = [
  {
    key: 'ceo',
    hat: 'El sombrero del dinero y las relaciones',
    question: '¿Esto trae dinero o clientes?',
    decides: 'Qué sí y qué no. Precios, prioridades, clientes en riesgo.',
    never: 'No escribe código ni graba contenido.',
    metric: 'Caja y MRR',
    example: 'Cambiar el precio de Nilah.',
  },
  {
    key: 'cto',
    hat: 'El sombrero del producto',
    question: '¿Esto funciona mañana sin mí?',
    decides: 'Cómo se construye. Código, bugs, deploys, automatización.',
    never: 'No decide precios ni promete fechas.',
    metric: 'Errores y uptime',
    example: 'El onboarding pierde usuarios en el paso 2.',
  },
  {
    key: 'cmo',
    hat: 'El sombrero de la audiencia',
    question: '¿Esto hace que alguien nuevo nos escriba?',
    decides: 'Quién se entera. Contenido, marca, leads, respuestas.',
    never: 'No promete features que no existen.',
    metric: 'Leads y alcance',
    example: 'Grabar 3 TikToks de Nilah.',
  },
];

export interface QuizItem {
  id: string;
  text: string;
  answer: RoleKey;
  why: string;
}

export const DIA_CERO_QUIZ: QuizItem[] = [
  {
    id: 'q1',
    text: 'Cambiar el precio de Nilah',
    answer: 'ceo',
    why: 'Aunque toques el código, la decisión es de negocio.',
  },
  {
    id: 'q2',
    text: 'El onboarding pierde usuarios en el paso 2',
    answer: 'cto',
    why: 'El resultado es producto: funciona o no funciona.',
  },
  {
    id: 'q3',
    text: 'Grabar 3 TikToks',
    answer: 'cmo',
    why: 'El resultado es alcance: más gente nos conoce.',
  },
  {
    id: 'q4',
    text: 'Responder a la clienta que quiere cancelar',
    answer: 'ceo',
    why: 'El resultado es retención: una relación en riesgo.',
  },
  {
    id: 'q5',
    text: 'Publicar el deploy de Vegi',
    answer: 'cto',
    why: 'El resultado es estabilidad y producto vivo.',
  },
  {
    id: 'q6',
    text: 'Escribir el copy del lanzamiento',
    answer: 'cmo',
    why: 'El resultado es que la oferta se entienda y se comparta.',
  },
];

export const DIA_CERO_RULES = [
  'Un rol a la vez. Sin multitasking.',
  'Toda tarea tiene rol, proyecto y minutos.',
  'Al cerrar un bloque, dejas el relevo: qué quedó y qué debe existir.',
];

export const DIA_CERO_STEPS = [
  'Los tres sombreros',
  'Tu jerarquía',
  'Descarga mental',
  'Clasificación',
  'Tu primer día',
] as const;
