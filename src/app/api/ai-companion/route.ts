import { NextResponse } from 'next/server';

const SILVER_DEFAULT_RESPONSES = [
  '¿Ese es todo tu código? ¡Ni siquiera compilaría en un Game Boy sin memoria!',
  '¡Buen intento, novato! Pero en la Arena de Jefes vas a necesitar más que suerte.',
  'Veo que dominas el frontend... A ver si puedes proteger tu base de datos con RLS.',
  '¡El tiempo corre! Cada segundo que dudas es un ciclo de CPU que pierdes.',
  '¡Ja! Si resuelves esta trivia, tal vez admita que tienes la chispa de un entrenador.',
  '¿Atascado? Revisa la consola de errores antes de que el reloj te desconecte.',
  'Un verdadero maestro de Cyber-Johto no copia código: entiende el flujo de datos.',
];

const SOCRATIC_DEFAULT_RESPONSES = [
  'Observa qué tipo de dato devuelve esa función antes de pasarla al siguiente componente.',
  'Recuerda la política RLS: ¿estás enviando el token de autenticación del usuario actual?',
  'Revisa el orden del circuito: un evento debe capturarse antes de guardarse en la base de datos.',
  '¿Qué código de error HTTP estás recibiendo en la pestaña Network de tu navegador?',
  'Las variables de entorno del cliente requieren el prefijo NEXT_PUBLIC_ para ser visibles.',
];

export async function POST(req: Request) {
  try {
    const { prompt, context, persona = 'silver' } = await req.json();
    const apiKey = process.env.GEMINI_API_KEY;

    const isSocratic = persona === 'pokegear' || persona === 'socratic';

    if (apiKey) {
      try {
        const systemPrompt = isSocratic
          ? `Eres el "Pokégear Socrático", el tutor de inteligencia artificial de la Academia Cyber-Johto (estilo Profesor Oak/Guía de Johto).
REGLAS OBLIGATORIAS:
1. Responde con un MÁXIMO ESTRICTO de 2 líneas cortas (menos de 130 caracteres en total).
2. Tono pedagógico, motivador pero socrático: NUNCA des el código resuelto.
3. Da una pista conceptual o una pregunta guía para que el alumno descubra su error.
Contexto: ${context || 'Tutoría de código'}
Pregunta del alumno: ${prompt || 'Ayuda'}`
          : `Eres "Código Silver", el rival cibernético arrogante de la Academia Cyber-Johto (Pokémon Oro/Plata).
REGLAS OBLIGATORIAS:
1. Responde con un MÁXIMO ESTRICTO de 2 líneas cortas (menos de 130 caracteres en total).
2. Tono desafiante, mordaz y estilo RPG de Nintendo.
3. Da pistas socráticas sin regalar la solución del ejercicio.
Contexto: ${context || 'Batalla de código'}
Pregunta del alumno: ${prompt || 'Hola'}`;

        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent?key=${apiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: systemPrompt }] }],
            }),
          }
        );
        const data = await response.json();
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) {
          const lines = text.trim().split('\n').filter(Boolean).slice(0, 2).join(' ');
          return NextResponse.json({ message: lines, persona });
        }
      } catch (geminiError) {
        console.warn('Gemini fallback to scripted response:', geminiError);
      }
    }

    // Fallbacks locales
    const pool = isSocratic ? SOCRATIC_DEFAULT_RESPONSES : SILVER_DEFAULT_RESPONSES;
    const randomMsg = pool[Math.floor(Math.random() * pool.length)];
    return NextResponse.json({ message: randomMsg, persona });
  } catch {
    return NextResponse.json(
      { message: '¡Falla en el bus de datos! Vuelve a intentar tu consulta.' },
      { status: 500 }
    );
  }
}
