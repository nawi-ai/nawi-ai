# Implementación de Ñawi

## Decisiones

- Next.js 16.4 con App Router, Cache Components y Partial Prefetching, tal como vino el proyecto. Las páginas que leen cookies o `params` dinámicos esperan esos datos dentro de `Suspense`.
- Los cuentos, preguntas y criterios viven solo en `data/stories.ts`. No hay una tabla `stories` para no mantener dos catálogos distintos. `reading_sessions.story_id` guarda el identificador de ese archivo.
- La evaluación de opciones es determinista en el servidor. Gemini solo se usa en respuestas abiertas, con salida JSON validada por Zod. Si la clave o el modelo no están, esa pregunta muestra el faltante y no se simula una corrección.
- El puntaje es `aciertos / preguntas evaluadas * 100`, redondeado. Una respuesta ambigua con confianza menor a 0.6 queda en revisión y no se cuenta como error. Una pregunta sin cerrar impide terminar la sesión.
- El nivel preferido solo cambia cuando el niño lo elige. Una respuesta incorrecta no lo modifica.
- Supabase guarda perfiles, sesiones y respuestas cuando existen la URL, la clave anónima y la service role. La service role solo corre en el servidor y es necesaria para escribir resultados: el rol `authenticated` puede leer sus filas, no insertar puntajes. La identidad es anónima, sin correo.
- Sin esas variables, o si el acceso anónimo falla, la aplicación ofrece una demostración local en `.data/nawi-demo.json`, atada a una cookie httpOnly. Ese modo no es un guardado en la nube y puede perderse al apagar el servidor.
- No se usa React Hook Form: cada formulario tiene un solo campo o un grupo de opciones.

## Qué quedó verificable sin credenciales

- Reglas de puntaje, reintentos, revisión y recomendaciones.
- Rechazo de `is_correct`, `score` o `readerId` enviados por el cliente.
- El catálogo público no incluye criterios ni la opción correcta.
- La demostración local evita sesiones duplicadas, conserva un cierre repetido y no entrega la sesión a otro lector.

## Qué depende de credenciales

- Crear usuarios anónimos en Supabase y aplicar `supabase/migrations/20261022120000_nawi_mvp.sql` y `supabase/migrations/20261022153000_nawi_service_role_grants.sql`.
- Confirmar que `GEMINI_MODEL` existe en la cuenta. El ejemplo documentado es `gemini-2.5-flash`, pero el código no lo elige solo.
- Probar en un navegador con voz española la narración real. La síntesis depende del sistema.
