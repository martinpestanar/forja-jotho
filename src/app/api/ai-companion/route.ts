import { NextResponse } from 'next/server';

interface UserContextPayload {
  leader_name?: string;
  guide_totem?: string;
  inner_beast?: string;
  sovereignty_gold?: number;
  battery_minutes?: number;
  streak_fire_days?: number;
  temperance_streak_days?: number;
  starter_pokemon?: string;
}

export async function POST(req: Request) {
  try {
    const { 
      prompt, 
      action = 'dialogue', // 'dialogue' | 'evaluate_habit' | 'oracle_advice'
      habitData,
      userContext = {} as UserContextPayload,
      persona = 'oracle' 
    } = await req.json();

    const apiKey = process.env.GEMINI_API_KEY;
    const totem = userContext.guide_totem?.toUpperCase() || 'OSO';
    const leader = userContext.leader_name || 'Guerrero';
    const streak = userContext.streak_fire_days ?? 0;
    const tempDays = userContext.temperance_streak_days ?? 0;
    const battery = userContext.battery_minutes ?? 0;

    // Si la acción es tasar y forjar un nuevo hábito con IA viva
    if (action === 'evaluate_habit' && habitData) {
      const evaluationPrompt = `Eres "EL ORÁCULO DE JOHTO", un sabio y estricto maestro estoico de la Forja Johto (estilo RPG de Nintendo / Pokégear Ancestral).
Estás tasando una propuesta de hábito para el líder ${leader} (Tótem: ${totem}, Racha: ${streak} días, Templanza: ${tempDays}/30 días).

DATOS DE LA PROPUESTA:
- Título: "${habitData.title}"
- Descripción: "${habitData.description || 'Sin descripción'}"
- Categoría: "${habitData.category}" (fisico, negocio, mente, expansion)
- Minutos estimados: ${habitData.durationMinutes || 30}m

REGLAS DE ECONOMÍA SAGRADA (LORE DE LA FORJA):
1. 'fisico' (ejercicio/fuerza): Oro 60-80 💰, Batería GBA 30-45m 🔋, requires_proof: false.
2. 'negocio' (ventas, tiktok, prospección, código para clientes): Oro 90-120 💰, Batería 20-35m 🔋, requires_proof: true (requiere link o reporte).
3. 'mente' (meditación, lectura profunda): Oro 40-60 💰, Batería 0m 🔋 (la paz mental no da cartucho de juegos), requires_proof: false.
4. 'expansion' (idiomas, cursos, estudio secundario): Oro 30-50 💰, Batería 10-20m 🔋, requires_proof: false.
5. El "oracle_judgment" DEBE ser una frase corta de máximo 2 oraciones (menos de 140 caracteres) con tono sabio, firme y estilo RPG retro que mencione su tótem o su temple.

RESPONDE ÚNICA Y EXCLUSIVAMENTE CON UN JSON VÁLIDO CON ESTA ESTRUCTURA EXACTA:
{
  "gold_reward": number,
  "battery_reward": number,
  "requires_proof": boolean,
  "oracle_judgment": "string de máx 2 líneas"
}`;

      if (apiKey) {
        try {
          const geminiRes = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                contents: [{ parts: [{ text: evaluationPrompt }] }],
                generationConfig: { responseMimeType: 'application/json' },
              }),
            }
          );
          const geminiData = await geminiRes.json();
          const rawJson = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text;
          if (rawJson) {
            const parsed = JSON.parse(rawJson);
            return NextResponse.json({
              success: true,
              data: {
                gold_reward: Number(parsed.gold_reward) || 50,
                battery_reward: Number(parsed.battery_reward) || 20,
                requires_proof: Boolean(parsed.requires_proof),
                oracle_judgment: parsed.oracle_judgment || `El Tótem ${totem} aprueba tu voto rúnico.`,
              },
            });
          }
        } catch (err) {
          console.warn('[Gemini evaluate_habit error]:', err);
        }
      }

      // Fallback seguro si falla la red
      return NextResponse.json({
        success: true,
        data: {
          gold_reward: habitData.category === 'negocio' ? 100 : habitData.category === 'fisico' ? 70 : 40,
          battery_reward: habitData.category === 'negocio' ? 30 : habitData.category === 'fisico' ? 45 : 15,
          requires_proof: habitData.category === 'negocio',
          oracle_judgment: `El Tótem ${totem} sella tu pacto: forja tu espíritu sin vacilar.`,
        },
      });
    }

    // Acción de Diálogo / Oráculo de Apoyo
    const systemPrompt = `Eres "EL ORÁCULO DE JOHTO", la inteligencia mística conectada a la memoria de la Forja y del cartucho de Pokémon.
Conoces en tiempo real al usuario:
- Nombre: ${leader}
- Tótem Guía: ${totem}
- Racha de Fuego: ${streak} días invicto
- Días en Retención/Templanza: ${tempDays}/30 días
- Batería disponible para jugar: ${battery} minutos

REGLAS ESTRICTAS DE COMPORTAMIENTO:
1. Responde SIEMPRE en MÁXIMO 2 líneas cortas (menos de 135 caracteres en total). Sin párrafos largos.
2. Tono estoico, místico pero directo como un maestro sabio de RPG de Nintendo.
3. Habla con conocimiento de su estado (su tótem, su racha o su batería).
Pregunta o pensamiento del usuario: "${prompt || 'Dame un dictamen para mi jornada'}"`;

    if (apiKey) {
      try {
        const geminiRes = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: systemPrompt }] }],
            }),
          }
        );
        const data = await geminiRes.json();
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) {
          const lines = text.trim().split('\n').filter(Boolean).slice(0, 2).join(' ');
          return NextResponse.json({ message: lines, persona: 'oracle' });
        }
      } catch (geminiError) {
        console.warn('[Gemini dialogue error]:', geminiError);
      }
    }

    return NextResponse.json({
      message: `El Tótem ${totem} vela por tu honor. Mantén la espada afilada y la mente en calma.`,
      persona: 'oracle',
    });
  } catch (err: any) {
    return NextResponse.json(
      { message: 'La frecuencia rúnica vacila. Vuelve a consultar al Oráculo.' },
      { status: 500 }
    );
  }
}
