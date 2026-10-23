# Ñawi

Tu compa de lectura IA. Cuentos cortos en español, narración con la voz del navegador y preguntas de comprensión para niños de 6 a 8 años.

Ñawi acompaña la lectura. No es una evaluación clínica ni reemplaza a un docente.

Para ver cómo acompaña a un niño, sin términos técnicos: [Una tarde con Ñawi](docs/una-tarde-con-nawi.md).

## Requisitos

- Node.js 22
- npm

## Arranque

```bash
npm install
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000).

Sin variables de entorno, Ñawi entra en **demostración local**. El progreso queda en `.data/nawi-demo.json` de este servidor y en una cookie del navegador. No está guardado en Supabase. Si el servidor se apaga o se borra esa carpeta, las lecturas pueden perderse.

## Variables

Copia `.env.example` a `.env.local`.

| Variable | Uso |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Proyecto Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Clave pública, solo para la sesión del lector |
| `SUPABASE_SERVICE_ROLE_KEY` | Solo servidor. Escribe sesiones y respuestas después de comprobar la identidad |
| `GEMINI_API_KEY` | Solo servidor. Evalúa respuestas abiertas |
| `GEMINI_MODEL` | Modelo habilitado en tu cuenta. Ejemplo a confirmar: `gemini-2.5-flash` |

La aplicación arranca aunque falten. Las preguntas de selección se corrigen igual. Las abiertas explican que Gemini no está configurado y no inventan una evaluación.

## Supabase

1. Crea un proyecto en Supabase.
2. En Authentication → Providers, activa **Anonymous**.
3. Ejecuta en el editor SQL, en este orden, `supabase/migrations/20261022120000_nawi_mvp.sql` y `supabase/migrations/20261022153000_nawi_service_role_grants.sql`. Si el primer archivo ya se aplicó, ejecuta solo el segundo: sin ese `GRANT`, guardar una lectura responde 42501.
4. Completa las tres variables de Supabase y reinicia el servidor.

La identidad no pide correo. Vive en las cookies de este navegador. Borrarlas abre un espacio nuevo.

RLS está activo. Un lector solo puede leer su perfil, sus sesiones y sus respuestas. No puede insertar ni editar puntajes con la clave anónima: esas escrituras pasan por la service role en los Route Handlers, después de validar la sesión y la pregunta.

## Comandos

```bash
npm test
npm run lint
npm run build
npm start
```

## Despliegue

El proyecto está preparado para Vercel. Configura allí las mismas variables de entorno. En Vercel la demostración local no es durable: para un uso real hace falta Supabase.

No agregues la service role ni la clave de Gemini a variables `NEXT_PUBLIC_`.

## Antes de un piloto con niños

Hace falta el consentimiento de madres, padres o tutores, una política de privacidad y definir cuánto tiempo se conservan las respuestas. Esta versión no pide nombre, edad, colegio ni dirección. Más detalle en `/acerca`.

## Limitaciones

- Tres cuentos locales, no un panel para cargar textos.
- La narración usa `speechSynthesis`. No todos los navegadores tienen una voz en español.
- El reconocimiento de voz no forma parte del flujo: se responde con botones o texto.
- Gemini no se ha ejecutado en este repositorio si no hay una clave configurada.
- La integración con Supabase no se ha ejecutado aquí si no hay un proyecto configurado.
