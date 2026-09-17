import { WorldItem, StoryItem, ReaderSettings } from './types';

export const initialWorlds: WorldItem[] = [
  {
    id: 'world-umbralis',
    name: 'Umbralis: El Archivo de las Sombras',
    genre: 'Fantasía Oscura & Arcanopunk',
    description: 'En la metrópolis amurallada de Umbralis, el sol se extinguió hace tres siglos. La ciudad sobrevive gracias a la combustión del "Éter Negro", un mineral viscoso que concede visiones del pasado y alimenta la tecnología de vapor arcano.',
    worldRules: `1. El Éter Negro concede visiones del pasado y potencia la magia arcana a cambio de fragmentos de la cordura de quien lo inhala.
2. Los Espejos de Medianoche reflejan el alma y los secretos de las personas en lugar de su aspecto físico.
3. El tiempo en los distritos bajos corre más lento que en las altas torres del Cónclave.`,
    forbiddenThings: `1. Prohibido encender fuego o emitir luz natural no autorizada en los distritos bajos bajo pena de ceguera forzada o destierro.
2. Prohibido poseer o comerciar cronómetros de éter sin el sello oficial del Cónclave de Cristal.
3. Prohibido copiar, leer o recitar fragmentos del Gran Códice Solar extinto.`,
    characters: [
      {
        id: 'char-kaelen',
        name: 'Kaelen Voss',
        gender: 'Masculino',
        role: 'protagonista',
        archetype: 'Archivero de memorias prohibidas',
        history: 'Creció como copista menor en la Gran Biblioteca Hundida de Umbralis. Durante una excavación clandestina en los túneles inundados de éter, encontró un cronómetro antiguo incrustado en un altar de basalto que se sincronizó con los latidos de su corazón. Desde entonces, escucha los ecos de personas que murieron antes de que el sol se apagara.',
        description: 'Hombre de mirada pálida y dedos manchados de tinta luminiscente. Porta un abrigo largo con compartimentos estancos para pergaminos y viales.',
        traits: 'Analítico, cauto, de silencios largos y leal a la búsqueda de la verdad.',
        secretsOrGoals: 'Busca reconstruir la última página del Códice Solar para averiguar si la extinción del sol fue un cataclismo natural o un sacrificio deliberado.',
        relations: [
          {
            id: 'rel-1',
            targetCharacterId: 'char-lyra',
            relationshipType: 'amor secreto',
            notes: 'Siente una profunda fascinación y amor reprimido por Lyra, aunque teme que su cronómetro maldito ponga en riesgo su vida.'
          },
          {
            id: 'rel-2',
            targetCharacterId: 'char-vane',
            relationshipType: 'odio',
            notes: 'El Inquisidor ejecutó a su mentor en la plaza de zinc; Kaelen le guarda un odio frío y contenido.'
          }
        ]
      },
      {
        id: 'char-lyra',
        name: 'Lyra Chen',
        gender: 'Femenino',
        role: 'secundario',
        archetype: 'Ingeniera de autómatas y rebelde',
        history: 'Hija de obreros del distrito del carbón líquido, perdió el brazo izquierdo en una explosión de calderas de vapor arcano a los dieciséis años. En lugar de someterse a la caridad del Cónclave, diseñó y construyó su propia prótesis de latón y engranajes neumáticos. Ahora lidera un taller encubierto para los marginados.',
        description: 'Joven de reflejos felinos, cabello corto desordenado y gabardina impermeable salpicada de grasa de engranaje y hollín.',
        traits: 'Audaz, de humor sarcástico, apasionada por la mecánica y protectora de los indefensos.',
        secretsOrGoals: 'Ensambla en secreto un generador de luz solar artificial en los acueductos olvidados.',
        relations: [
          {
            id: 'rel-3',
            targetCharacterId: 'char-kaelen',
            relationshipType: 'amistad',
            notes: 'Confía ciegamente en la honestidad de Kaelen y lo considera su aliado más íntimo en la ciudad.'
          },
          {
            id: 'rel-4',
            targetCharacterId: 'char-vane',
            relationshipType: 'rivalidad',
            notes: 'Ha burlado las redadas de la Guardia de Ceniza de Vane en tres ocasiones y se deleita en desafiar su autoridad.'
          }
        ]
      },
      {
        id: 'char-vane',
        name: 'El Inquisidor Vane',
        gender: 'Masculino',
        role: 'antagonista',
        archetype: 'Comandante de la Guardia de Ceniza',
        history: 'Veterano de las purgas del Éter Negro. Su rostro quedó desfigurado en el levantamiento de las fundiciones, por lo que porta una máscara de plata con runas de contención mental. Cree fervientemente que la única forma de evitar que Umbralis colapse es la sumisión absoluta y la erradicación del libre pensamiento.',
        description: 'Figura imponente de casi dos metros envuelta en paño negro reforzado con placas de zinc. Su voz resuena metálica y sepulcral tras la máscara.',
        traits: 'Implacable, incorruptible, calculador y desprovisto de piedad ordinaria.',
        secretsOrGoals: 'Sabe que la reserva de Éter Negro de Umbralis se agotará en dos años y planea un sacrificio a gran escala para prolongarla.',
        relations: [
          {
            id: 'rel-5',
            targetCharacterId: 'char-kaelen',
            relationshipType: 'odio',
            notes: 'Lo considera una anomalía peligrosa que debe ser purgada o diseccionada por portar el cronómetro.'
          },
          {
            id: 'rel-6',
            targetCharacterId: 'char-lyra',
            relationshipType: 'desconfianza',
            notes: 'Vigila de cerca los suministros de piezas de latón que desaparecen en el distrito bajo.'
          }
        ]
      }
    ],
    createdAt: new Date().toISOString()
  },
  {
    id: 'world-aethelgard',
    name: 'Aethelgard: El Reino de las Agujas de Cristal',
    genre: 'Alta Fantasía & Magia Antigua',
    description: 'Un archipiélago de continentes flotantes suspendidos sobre el Mar de Nubes, donde las Agujas de Cristal cantan al viento protegiendo a los reinos de las Bestias de Niebla.',
    worldRules: `1. Los armónicos de las Agujas de Cristal son los que mantienen la gravedad y la flotabilidad de las islas.
2. La magia se manifiesta trenzando filamentos de luz solar y viento estelar.
3. Todo objeto o ser vivo que cae bajo la capa de nubes regresa consumido por la niebla abisal.`,
    forbiddenThings: `1. Prohibido tocar o golpear una Aguja con metales impuros que desafinen el armónico sagrado.
2. Prohibido navegar naves con velas de seda negra cerca de los templos de los tejedores.
3. Prohibido descender deliberadamente bajo el mar de niebla sin autorización del Sumo Consejo.`,
    characters: [
      {
        id: 'char-seraphina',
        name: 'Seraphina Vale',
        gender: 'Femenino',
        role: 'protagonista',
        archetype: 'Tejedora de armónicos',
        history: 'Criada en el templo más alto de la Aguja Primordial, descubrió desde niña que podía percibir las microfracturas del cristal antes de que ocurrieran.',
        description: 'Túnica de lino blanco con bordados de hilo de plata y un diapasón de cuarzo en el cinto.',
        traits: 'Serena, intuitiva, devota a la armonía.',
        secretsOrGoals: 'Descubrió que la Aguja Primordial está perdiendo su frecuencia fundamental.',
        relations: []
      }
    ],
    createdAt: new Date().toISOString()
  },
  {
    id: 'world-neosideria',
    name: 'Neo-Sideria 2149',
    genre: 'Ciencia Ficción Cyberpunk & Noir',
    description: 'Una megaciudad orbital autosuficiente donde los recuerdos humanos se compran, venden y modifican como divisas digitales a través de implantes neuronales.',
    worldRules: `1. Los recuerdos no respaldados en la nube corporativa pueden ser embargados por deudas financieras.
2. Los androides sintéticos de clase 5 no sueñan, pero sufren de ecos mnemónicos de sus antiguos dueños.
3. La red sub-cuántica está patrullada por inteligencias artificiales cazadoras llamadas Centinelas.`,
    forbiddenThings: `1. Prohibido hackear o clonar chips cerebrales de identidad de nivel ciudadano alfa.
2. Prohibido poseer transmisores analógicos de onda corta en el Nivel Cero.
3. Prohibido borrar deliberadamente recuerdos clasificados por la Corporación NeuroKorp.`,
    characters: [
      {
        id: 'char-maya',
        name: 'Maya Takahashi',
        gender: 'Femenino',
        role: 'protagonista',
        archetype: 'Detective de memorias alteradas',
        history: 'Ex-investigadora de NeuroKorp expulsada por negarse a falsificar los recuerdos de un disidente político.',
        description: 'Abrigo impermeable con filamentos de fibra óptica apagados y un ojo cibernético con lente anamórfica.',
        traits: 'Perspicaz, desconfiada, de reflejos impecables.',
        secretsOrGoals: 'Tiene en su propio implante una memoria encriptada de un crimen que aún no ocurre.',
        relations: []
      }
    ],
    createdAt: new Date().toISOString()
  }
];

export const initialStories: StoryItem[] = [
  {
    id: 'story-umbralis-1',
    worldId: 'world-umbralis',
    title: 'El Archivo de las Sombras',
    description: 'Kaelen Voss y Lyra Chen desentrañan el misterio del cronómetro de éter mientras el Inquisidor Vane estrecha el cerco en los callejones de Umbralis.',
    involvedCharacterIds: ['char-kaelen', 'char-lyra', 'char-vane'],
    currentChapterIndex: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    chapters: [
      {
        id: 'chap-1',
        number: 1,
        title: 'Capítulo 1: El Eco en la Medianoche',
        content: `La lluvia sobre Umbralis nunca olía a hierba ni a tierra mojada; olía a cobre viejo y a hollín de éter. Desde la cornisa de la Gran Biblioteca Hundida, Kaelen Voss contemplaba cómo los faroles de gas titilaban con esa extraña flama verdosa que anunciaba el toque de queda. Bajo las sombras de los arcos apuntados, las patrullas de la Guardia de Ceniza avanzaban con pasos acompasados, sus pesadas botas de plomo resonando sobre los adoquines húmedos.

Kaelen deslizó una mano temblorosa bajo los pliegues de su raída levita de lana. Allí, contra el esternón, descansaba el cronómetro.

No era un mecanismo corriente. Carecía de manecillas y de esfera de cristal. En su lugar, un cilindro de cuarzo ahumado contenía una gota suspendida de éter negro que no respondía a la gravedad, sino al pulso de sus propias arterias. Cada vez que el reloj vibraba, un retazo de recuerdo ajeno se proyectaba tras sus párpados: el olor a pan caliente en una plaza iluminada por un astro abrasador, risas infantiles bajo un cielo de un azul inconcebible... memorias de una era antes de que el sol muriera.

—Si sigues mirando hacia abajo con esa cara de espectro, los centinelas van a pensar que eres una gárgola y te dispararán con un dardo de mercurio —susurró una voz a su espalda.

Kaelen no necesitó girarse para saber que se trataba de Lyra. El siseo neumático de su brazo mecánico era un sonido tan familiar para él como la lluvia. La muchacha se deslizó sobre la cornisa con la agilidad de quien ha pasado la mitad de su vida huyendo por los tejados de los distritos industriales. Su gabardina impermeable goteaba agua sucia, pero sus ojos oscuros brillaban con una lucidez feroz.

—Tienes noticias del taller —dijo Kaelen en voz baja, ajustándose el cuello del abrigo para protegerse de la bruma cáustica.

—Mejor que eso —respondió Lyra, sentándose junto a él y dejando colgar las piernas sobre el abismo de trescientos metros que separaba la cornisa del suelo—. Conseguí descifrar la bobina de inducción del tercer generador. Si conectamos el condensador de éter a la matriz de espejos antes del cambio de guardia, podremos sostener un rayo de calor constante durante al menos cinco minutos.

—¿Cinco minutos? —Kaelen enarcó una ceja pálida—. El Cónclave detectará la fuga de energía en menos de sesenta segundos. Vane tiene sabuesos de vapor apostados en cada conducto de ventilación desde el incendio de los muelles.

—Que vengan —murmuró Lyra, apretando el puño de latón pulido de su prótesis, cuyos pistones gimieron con un chirrido contenido—. Estoy cansada de vivir a oscuras mientras los aristócratas del Cónclave respiran oxígeno filtrado y queman resina pura en sus invernaderos de cristal. Necesitamos ver qué hay más allá del muro exterior, Kaelen. Si el códice decía la verdad...

—El códice le costó la vida al maestro Aldous —la interrumpió él, con un matiz de dolor que no pudo disimular—. No voy a permitir que Vane te arrastre a las celdas de sal de la fortaleza.

Lyra lo miró fijamente a los ojos. En el fondo de la penumbra de la cornisa, por una fracción de segundo, la tensión entre ambos dejó de ser la de dos conspiradores para convertirse en algo más íntimo, suspendido en el aire como la gota de éter en el pecho del archivero. Ella entreabrió los labios para decir algo, pero el tañido broncíneo de la campana mayor de la catedral de San Judas quebró el silencio.

Doce campanadas. La medianoche exacta.

Y entonces, el cronómetro en el pecho de Kaelen no solo vibró: emitió un destello violáceo que iluminó sus dedos y proyectó en el muro de ladrillo la sombra nítida de una figura que no estaba allí.`,
        createdAt: new Date().toISOString(),
        wordCount: 574
      }
    ]
  }
];

export const defaultReaderSettings: ReaderSettings = {
  fontSize: 18,
  fontFamily: 'serif',
  theme: 'onyx',
  lineHeight: 'relaxed',
  maxWidth: 'normal',
  autoTimeTheme: false
};
