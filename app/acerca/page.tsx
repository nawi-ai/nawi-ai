export const metadata = { title: "Acerca de Ñawi" };

export default function AboutPage() {
  return (
    <article className="mx-auto max-w-3xl space-y-5 text-lg leading-8">
      <h1 className="text-3xl font-extrabold md:text-4xl">Sobre esta experiencia</h1>
      <p>
        Ñawi es un compañero de lectura para niños de 6 a 8 años. Acompaña cuentos cortos, narración
        con la voz del navegador y preguntas de comprensión. No es un examen ni una evaluación clínica.
      </p>
      <p>
        Los niveles son orientativos para adaptar los textos. No equivalen a un diagnóstico
        psicopedagógico y no reemplazan a docentes o especialistas.
      </p>
      <h2 className="text-2xl font-extrabold">Privacidad antes de un piloto real</h2>
      <p>
        Esta versión evita pedir correo, edad, colegio o dirección. Antes de usarla con menores en un
        piloto hace falta el consentimiento de madres, padres o tutores, una política de privacidad
        visible y un acuerdo sobre qué datos se guardan y por cuánto tiempo.
      </p>
      <p>
        Si Supabase está configurado, la sesión anónima vive en este navegador. Borrar las cookies
        abre un espacio nuevo. Si falta esa configuración, la demostración local guarda las lecturas
        en el servidor donde corre la aplicación y no debe presentarse como un guardado en la nube.
      </p>
      <p>
        Las respuestas abiertas se envían a Gemini solo desde el servidor, junto con el cuento y la
        pregunta, para evaluar comprensión. No se entrena un modelo propio ni se guarda la
        deliberación interna del modelo.
      </p>
    </article>
  );
}
