export type StoryVisual = {
  coverAlt: string;
  sceneAlts: readonly string[];
};

export const STORY_VISUALS: Record<string, StoryVisual> = {
  "luna-jardin-estrellas": {
    coverAlt: "Luna contempla un jardín andino iluminado por estrellas y flores mágicas",
    sceneAlts: [
      "Luna recibe entre sus manos una pequeña estrella que cayó entre las flores",
      "Luna y su abuela observan a la estrella triste dentro de un frasco",
      "Luna planta la estrella junto a una margarita y la riega con cuidado",
    ],
  },
  "nina-mate-caido": {
    coverAlt: "Nina, su abuela y Mishi comparten un momento cálido alrededor del mate",
    sceneAlts: [
      "Mishi salta a la mesa y el mate rueda mientras Nina intenta alcanzarlo",
      "La abuela muestra a Nina que el mate está sucio pero no se rompió",
      "Nina lava y seca el mate con cuidado en la cocina",
    ],
  },
  "lucho-cometa-parque": {
    coverAlt: "Lucho y Solín miran su cometa roja sobre un parque de los Andes",
    sceneAlts: [
      "La cometa roja de Lucho queda enredada en las ramas de un árbol",
      "Solín llega con una rama larga para ayudar a Lucho sin romper la cometa",
      "La cometa liberada baja a las manos de Lucho mientras Solín sonríe con la rama",
    ],
  },
  "tomi-rio-cancion": {
    coverAlt: "Tomi escucha el agua brillante de un río andino entre piedras redondas",
    sceneAlts: [
      "Tomi escucha tranquilo la canción del río al final de la tarde",
      "El río está callado porque bolsas, vasos y una rama bloquean el agua",
      "La señora Rosa explica el problema a Tomi, Nico y Pia junto al río",
      "Los tres niños recogen la basura y trabajan para soltar la rama pesada",
      "El agua vuelve a correr y Tomi siente en sus dedos la canción recuperada",
      "Tomi, Nico y Pia colocan junto al puente una señal para cuidar el río",
    ],
  },
  "maya-luciernagas-maizal": {
    coverAlt: "Maya observa un maizal andino lleno de luciérnagas bajo la galaxia",
    sceneAlts: [
      "Maya cuenta las luciérnagas que conversan con luces entre el maíz",
      "Maya busca preocupada en el maizal que quedó completamente oscuro",
      "Maya y su tío descubren una lámpara muy brillante junto al campo",
      "El tío explica que la luz de la lámpara no deja ver a las luciérnagas",
      "Maya y su tío llevan la lámpara de regreso a la casa",
      "Las luciérnagas vuelven a iluminar el maizal y Maya sonríe",
    ],
  },
  "sami-horno-callado": {
    coverAlt: "Sami llega a un horno de barro encendido y lleno de panes dorados",
    sceneAlts: [
      "Sami saluda a doña Pilar mientras el horno crepita y cuece el pan",
      "El horno queda callado porque la leña mojada bloquea la entrada de aire",
      "Doña Pilar explica a Sami que el fuego necesita respirar",
      "Sami y doña Pilar apartan las ramas mojadas y liberan el respiradero",
      "El fuego vuelve a crecer y los panes se doran frente a los vecinos",
      "Doña Pilar entrega a Sami un pancito tibio junto al horno recuperado",
    ],
  },
  "killa-montana-colores": {
    coverAlt: "Killa, una vizcacha andina, contempla la gran montaña gris al amanecer",
    sceneAlts: [
      "Killa sale de su cueva y observa una enorme montaña gris",
      "Killa imagina la montaña llena de los colores del atardecer",
      "Killa decide salir a pedir ayuda para cumplir un sueño demasiado grande",
      "Un cóndor entrega a Killa una pluma azul luminosa",
      "Un cactus regala a Killa una hoja verde junto al agua de sus raíces",
      "La laguna comparte con Killa una gota dorada del atardecer",
      "Killa reúne los tres regalos e invita a sus vecinos a colaborar",
      "Vizcachas y niños llenan juntos la montaña de azul, verde y dorado",
      "Killa y sus vecinos recuerdan bajo la luna lo que lograron unidos",
    ],
  },
  "amaru-tambor-pueblo": {
    coverAlt: "Amaru acaricia el tambor antiguo de su familia en una casa andina",
    sceneAlts: [
      "Amaru toca a solas el antiguo tambor de su familia",
      "Amaru cierra la puerta para guardar la música solo para él",
      "La abuela Yana explica a Amaru que un tambor necesita acompañar a otros",
      "Amaru abraza el tambor mientras duda junto a la puerta cerrada",
      "Amaru lleva el tambor a la plaza donde el pueblo lo espera",
      "Amaru marca el ritmo mientras vecinos y familiares bailan y cantan",
      "La música compartida se expande como luz por todo el pueblo",
      "Amaru continúa tocando feliz para sostener la fiesta de la plaza",
      "Amaru devuelve el tambor a su lugar y deja la puerta abierta al pueblo",
    ],
  },
  "inti-historia-abuelo": {
    coverAlt: "Inti escucha a su abuelo junto a un telar de muchos colores",
    sceneAlts: [
      "Inti lee su tarea escolar frente al telar de su abuelo y piensa cómo empezar",
      "Inti intenta escribir solo y cierra el cuaderno frustrado",
      "La maestra Lila muestra a Inti que en el relato faltan otras voces",
      "Inti camina pensando que su historia está incompleta",
      "La tía Norma y el primo Leo recuerdan con Inti los colores del telar",
      "Leo canta el ritmo del tejido mientras Inti escucha antes de escribir",
      "Inti reescribe la historia y varias memorias se tejen sobre la página",
      "Inti lee en clase el relato completo de su familia",
      "El cuaderno de Inti descansa junto al tejido y conserva todos los recuerdos",
    ],
  },
};
