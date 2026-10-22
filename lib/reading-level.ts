export const READING_LEVELS = [1, 2, 3] as const;

export type ReadingLevel = (typeof READING_LEVELS)[number];

export type QuestionType = "literal" | "inferential" | "causal";

export type QuestionRole = "core" | "support" | "challenge";

export const SKILL_IDS = [
  "personajes",
  "lugares",
  "hechos",
  "causa",
  "emociones",
  "consecuencias",
  "pistas",
  "intenciones",
  "opiniones",
  "conexiones",
] as const;

export type SkillId = (typeof SKILL_IDS)[number];

export const SKILL_STRENGTH: Record<SkillId, string> = {
  personajes: "Reconoces a los personajes",
  lugares: "Ubicas los lugares",
  hechos: "Encuentras los hechos del cuento",
  causa: "Explicas por qué ocurren las cosas",
  emociones: "Notas cómo se sienten los personajes",
  consecuencias: "Ves qué pasa después",
  pistas: "Encuentras pistas en el relato",
  intenciones: "Interpretas lo que un personaje busca",
  opiniones: "Justificas lo que piensas del cuento",
  conexiones: "Conectas las ideas del cuento",
};

export const SKILL_PRACTICE: Record<SkillId, string> = {
  personajes: "reconocer a los personajes",
  lugares: "ubicar los lugares",
  hechos: "encontrar los hechos del cuento",
  causa: "explicar por qué un personaje tomó una decisión",
  emociones: "notar las emociones",
  consecuencias: "ver las consecuencias",
  pistas: "encontrar pistas en el relato",
  intenciones: "interpretar intenciones",
  opiniones: "justificar una opinión",
  conexiones: "conectar las ideas del cuento",
};

export type NextAction = "continue" | "retry" | "clarify";

export function isReadingLevel(value: unknown): value is ReadingLevel {
  return value === 1 || value === 2 || value === 3;
}

export const QUESTION_TYPE_LABEL: Record<QuestionType, string> = {
  literal: "Buscar en el cuento",
  inferential: "Leer entre líneas",
  causal: "Entender por qué",
};

export const LEVELS: Array<{
  id: ReadingLevel;
  name: string;
  difficulty: string;
  description: string;
  details: string[];
}> = [
  {
    id: 1,
    name: "Primeros pasos",
    difficulty: "Comprensión literal",
    description: "Reconocer personajes, lugares y hechos que el cuento dice con claridad.",
    details: [
      "Cuentos de tres páginas, con párrafos breves",
      "Preguntas para buscar lo que está escrito",
      "Una respuesta abierta, también con la voz",
      "Pistas y una pregunta de apoyo si hace falta",
    ],
  },
  {
    id: 2,
    name: "Exploradores",
    difficulty: "Inferencia y relaciones",
    description: "Inferir emociones, causas y consecuencias, y encontrar pistas en el relato.",
    details: [
      "Cuentos de seis páginas, con párrafos más largos",
      "Preguntas para unir hechos y sentir a los personajes",
      "Respuestas abiertas dichas con la propia voz",
      "Un reto solo cuando las anteriores salen con claridad",
    ],
  },
  {
    id: 3,
    name: "Grandes lectores",
    difficulty: "Interpretación y reflexión",
    description: "Interpretar intenciones, justificar opiniones y conectar ideas del cuento.",
    details: [
      "Cuentos de nueve páginas, con párrafos para pensar",
      "Preguntas sobre decisiones y opiniones",
      "Respuestas abiertas, breves o dichas en voz alta",
      "La misma historia cambia de pregunta según el niño",
    ],
  },
];
