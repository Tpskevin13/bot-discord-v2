const { Client, Intents, MessageEmbed } = require('discord.js');
const fetch     = require('node-fetch');
const keepAlive = require('./keep_alive');
const eco       = require('./economy');

const PREFIX     = '!';
const TOKEN      = process.env.TOKEN     || 'PEGA_TU_TOKEN_AQUI';
const SERVER_ID  = process.env.SERVER_ID || '1473797537398784081';
const ROLE_ID    = process.env.ROLE_ID   || '1473797735416332385';
const RAINBOW_MS = 500;

const client = new Client({
    intents: [
        Intents.FLAGS.GUILDS,
        Intents.FLAGS.GUILD_MESSAGES,
        Intents.FLAGS.GUILD_MESSAGE_REACTIONS,
        Intents.FLAGS.MESSAGE_CONTENT,
    ]
});

const xpCooldown = new Map();

// ══════════════════════════════════════════════════════════════════════════════
//  DATOS DE DIVERSIÓN
// ══════════════════════════════════════════════════════════════════════════════

const MEME_SUBS = ['memesenespanol','MemesEnEspanol','Memes_En_Espanol','argentina','latinoamerica','espanol','chile','mexico','programacion'];

const ANIMALES = {
    gato:      {emoji:'🐱',api:'cat',       hechos:['Los gatos pasan el 70% de su vida durmiendo.','Un gato adulto solo maúlla para comunicarse con humanos.','Los gatos tienen 32 músculos en cada oreja.','Los bigotes de un gato miden el ancho de su cuerpo.','Los gatos pueden saltar hasta 6 veces su propia altura.','Los gatos tienen un tercer párpado llamado membrana nictitante.']},
    perro:     {emoji:'🐶',api:'dog',       hechos:['Los perros tienen olfato 10.000 veces más potente que los humanos.','Los perros pueden reconocer hasta 250 palabras.','Los perros sudan por las patas.','Pueden detectar el estrés humano por el olor del cortisol.','El corazón de un perro late entre 60 y 140 veces por minuto.','Los perros tienen una visión del color limitada, parecida al daltonismo.']},
    zorro:     {emoji:'🦊',api:'fox',       hechos:['Los zorros usan el campo magnético de la Tierra para cazar.','Pueden hacer más de 40 sonidos distintos.','Son los únicos cánidos que retraen garras como los gatos.','Usan su cola como almohada para calentarse en el frío.','Los zorros son animales principalmente solitarios y nocturnos.','Pueden ver en la oscuridad casi tan bien como los gatos.']},
    panda:     {emoji:'🐼',api:'panda',     hechos:['Un panda come entre 12 y 38 kg de bambú al día.','Los pandas tienen una falsa sexta "dedo" que es un hueso de la muñeca.','Una cría de panda es 900 veces más pequeña que su madre al nacer.','El rugido de un panda suena más a balido de oveja.','Existen menos de 2.000 pandas gigantes en el mundo.','Los pandas pasan entre 10 y 16 horas al día comiendo.']},
    koala:     {emoji:'🐨',api:'koala',     hechos:['Los koalas duermen entre 18 y 22 horas al día.','Tienen huellas dactilares casi idénticas a las humanas.','Su cerebro solo ocupa el 61% de su cavidad craneal.','Obtienen casi toda su agua del eucalipto que comen.','Son uno de los pocos mamíferos que comen hojas de eucalipto venenosas.','Los koalas tienen dos pulgares en cada mano delantera.']},
    pajaro:    {emoji:'🐦',api:'bird',      hechos:['El colibrí es el único pájaro que puede volar hacia atrás.','Los búhos no pueden mover sus globos oculares, por eso giran la cabeza.','Los flamencos son rosados por los carotenoides del camarón que comen.','Los cuervos pueden recordar caras humanas durante años.','Los loros pueden imitar el habla porque tienen una siringe especial.','Algunos pájaros tienen sentido del olfato muy desarrollado.']},
    mapache:   {emoji:'🦝',api:'raccoon',   hechos:['Los mapaches pueden abrir cerrojos y frascos con tapa.','Tienen memoria para recordar soluciones a problemas 3 años después.','Mojan su comida para potenciar su sensibilidad táctil, no para lavarla.','Son excelentes nadadores y trepadores.','Su IQ es similar al de los gatos.','Los mapaches son principalmente nocturnos.']},
    canguro:   {emoji:'🦘',api:'kangaroo',  hechos:['Los canguros no pueden caminar hacia atrás.','Una cría de canguro mide apenas 2 cm al nacer.','Pueden saltar más de 9 metros en un solo salto.','Los machos se "boxean" para competir por las hembras.','Usan su cola como tercera pierna al caminar lentamente.','Los canguros pueden nadar y patear con las patas traseras en el agua.']},
    pandaRojo: {emoji:'🔴🐼',api:'red_panda',hechos:['El panda rojo fue descubierto 48 años antes que el panda gigante.','Está más emparentado con las comadrejas que con los osos.','Son principalmente nocturnos y crepusculares.','Pasan la mayor parte del tiempo en los árboles.','Usan su cola peluda como almohada en el frío.','Son los únicos representantes vivos de su familia: Ailuridae.']},
};

const TRIVIA = [
    {p:'¿Cuál es el planeta más grande del sistema solar?',       r:'júpiter'},
    {p:'¿Cuántos colores tiene el arcoíris?',                     r:'7'},
    {p:'¿Cuál es el océano más grande del mundo?',                r:'pacífico'},
    {p:'¿En qué año llegó el hombre a la Luna?',                  r:'1969'},
    {p:'¿Cuál es el animal terrestre más rápido?',                r:'guepardo'},
    {p:'¿Cuántos lados tiene un hexágono?',                       r:'6'},
    {p:'¿Cuál es el país más grande del mundo?',                  r:'rusia'},
    {p:'¿Cuántos huesos tiene el cuerpo humano adulto?',          r:'206'},
    {p:'¿En qué continente está Egipto?',                         r:'africa'},
    {p:'¿Cuántas patas tiene una araña?',                         r:'8'},
    {p:'¿Cuál es el río más largo del mundo?',                    r:'nilo'},
    {p:'¿Quién pintó la Mona Lisa?',                              r:'da vinci'},
    {p:'¿Cuántos jugadores tiene un equipo de fútbol?',           r:'11'},
    {p:'¿De qué país es la bandera celeste y blanca?',            r:'argentina'},
    {p:'¿Cuántos continentes hay en el mundo?',                   r:'7'},
    {p:'¿Cuál es la capital de Brasil?',                          r:'brasilia'},
    {p:'¿Cuántos días tiene un año bisiesto?',                    r:'366'},
    {p:'¿Qué planeta es el planeta rojo?',                        r:'marte'},
    {p:'¿Quién escribió el Quijote?',                             r:'cervantes'},
    {p:'¿En qué año fue la Revolución Francesa?',                 r:'1789'},
    {p:'¿Cuál es el elemento más abundante en el universo?',      r:'hidrógeno'},
    {p:'¿Cuántos lados tiene un octágono?',                       r:'8'},
    {p:'¿Cuál es la capital de Japón?',                           r:'tokio'},
    {p:'¿Cuántos planetas tiene el sistema solar?',               r:'8'},
    {p:'¿Cuál es el deporte más popular del mundo?',              r:'fútbol'},
    {p:'¿Cuántos segundos tiene una hora?',                       r:'3600'},
    {p:'¿Cuál es el metal más liviano del mundo?',                r:'litio'},
    {p:'¿Quién fue el primer presidente de Argentina?',           r:'rivadavia'},
    {p:'¿Cuántas cuerdas tiene una guitarra estándar?',           r:'6'},
    {p:'¿En qué año comenzó la Segunda Guerra Mundial?',          r:'1939'},
    {p:'¿Cuál es el país con más pirámides del mundo?',           r:'sudán'},
    {p:'¿Cuánto es la raíz cuadrada de 144?',                     r:'12'},
    {p:'¿Cuál es el órgano más grande del cuerpo humano?',        r:'piel'},
    {p:'¿De qué material está hecho el diamante?',                r:'carbono'},
    {p:'¿En qué año se inventó el teléfono?',                     r:'1876'},
];

const BOLAS = [
    '✅ Definitivamente sí.','✅ Sin duda alguna.','✅ Sí, claro.','✅ Todas las señales dicen que sí.',
    '✅ ¡Mirá que sí!','✅ Las estrellas lo confirman 🌟','✅ Todo indica que sí, aprovechá!',
    '🤔 Las señales no son claras, intentá de nuevo.','🤔 Preguntá de nuevo más tarde.',
    '🤔 Es mejor no decirte ahora.','🤔 Ni sí ni no, sino todo lo contrario.',
    '🤔 Consultá con una persona de confianza primero.',
    '❌ No creo.','❌ Definitivamente no.','❌ Mis fuentes dicen que no.',
    '❌ Las perspectivas no son buenas.','❌ Ni en pedo.','❌ La respuesta es un rotundo NO.',
];

const VERDADES = [
    '¿Cuál fue tu momento más vergonzoso?','¿Alguna vez mentiste a tu mejor amigo?',
    '¿A quién del servidor le tenés ganas? 👀','¿Cuál es tu mayor miedo?',
    '¿Qué es lo más raro que buscaste en Google?','¿Alguna vez lloraste con una película?',
    '¿Cuál es tu peor hábito?','¿Cuánto tiempo pasás en el baño?',
    '¿Alguna vez te hiciste el dormido para no hablar con alguien?',
    '¿Cuál es la mentira más grande que dijiste?','¿Alguna vez stalkeaste el perfil de alguien?',
    '¿Qué aplicación borrarías si te vieran el celular?','¿Alguna vez comiste algo del piso?',
    '¿Cuántos exes tenés?','¿Cuál es tu mayor secreto que nadie sabe?',
    '¿Alguna vez le gustaste a alguien de acá y no lo dijiste?',
    '¿Cuál fue la cosa más creativa que inventaste para no ir al colegio/trabajo?',
    '¿Alguna vez mandaste un mensaje al destinatario equivocado?',
    '¿Qué es lo más raro que te pasó en un sueño?',
    '¿Cuántos chats de WhatsApp tenés silenciados?',
];

const ATREVIDOS = [
    'Cambiá tu foto de perfil por una papa por 24hs 🥔',
    'Escribí un elogio a la última persona que mencionaste',
    'Cantá 30 segundos de una canción en el canal de voz 🎤',
    'Mandá un sticker random a alguien del servidor',
    'Escribí tu nombre completo al revés en el chat',
    'Hacé 10 flexiones y mandá foto de prueba 💪',
    'Cambiá tu estado a "Me gustan los pies" por 1 hora',
    'Nombrá 3 personas del servidor con las que saldrías',
    'Describí a la última persona que agregaste con un emoji',
    'Confesá tu mayor secreto en el servidor 🤫',
    'Imitá a alguien del servidor en el chat durante 5 minutos',
    'Mandá el último meme que guardaste en tu celular',
    'Escribí un poema de 4 versos sobre alguien del servidor',
    'Cambiá tu apodo del servidor por algo ridículo por 1 hora',
    'Contá un secreto que no hayas dicho nunca antes',
    'Mandá el último mensaje de WhatsApp que enviaste (censurado si es necesario)',
];

const ROASTS = [
    'Sos tan lento que Google Maps te sugiere ir a pie y aun así llegás tarde.',
    'Tu cara es la razón por la que las cámaras tienen modo retrato: para difuminarte.',
    'Sos tan inútil que hasta tu sombra te abandona cuando hay poca luz.',
    'Tus neuronas se conocieron pero no se cayeron bien.',
    'Sos tan aburrido que hasta el silencio te pide que te calles.',
    'Si la estupidez doliera, vivirías quejándote.',
    'Sos la razón por la que el shampoo tiene instrucciones.',
    'Tu cerebro tiene más bugs que el código de un Junior.',
    'Sos tan predecible que hasta el horóscopo se aburre de vos.',
    'Ponés la L de LOL en slow motion.',
    'Sos como el WiFi en el campo: todos saben que existís pero nadie te agarra bien.',
    'Tu nivel de utilidad es inversamente proporcional a tu nivel de confianza.',
    'Sos tan básico que Google te autocompleta como "genérico".',
    'Sos como un lunes: nadie te quiere pero ahí estás.',
    'Tu plan de contingencia es no tener plan.',
    'Sos tan olvidable que tu propia sombra a veces se va sin avisarte.',
];

const COMPLIMENTS = [
    '¡Sos una persona increíble y el mundo es mejor contigo! 🌟',
    'Tu energía positiva ilumina cualquier sala. ✨',
    'Sos más valioso/a de lo que creés. 💎',
    'Tu creatividad no tiene límites. 🎨',
    'Sos de las pocas personas que realmente marca la diferencia. 🏆',
    'Tienes una sonrisa que puede alegrar el día de cualquiera. 😊',
    'Tu dedicación es inspiradora. 💪',
    'Sos alguien con quien da gusto hablar. 🤝',
    'El universo tuvo suerte cuando te creó. 🌌',
    'Sos exactamente la persona que este servidor necesitaba. 🎯',
    'Tu presencia hace que este servidor valga la pena. 🏅',
    'Sos de las personas que hacen que todo parezca más fácil. 🌈',
    'Tu sentido del humor es de otro nivel. 😄',
    'Sos una persona con un corazón enorme. ❤️',
];

const CHISTES = [
    '¿Por qué los pájaros vuelan hacia el sur en invierno? Porque caminar llevaría demasiado.',
    '¿Qué hace una abeja en el gimnasio? ¡Zum-ba!',
    '¿Cómo se llama el campeón de buceo de Japón? Tokofondo.',
    '¿Por qué la escoba está feliz? Porque barrió el concurso.',
    '¿Qué le dice un semáforo a otro? No me mires que me estoy cambiando.',
    '¿Qué hace un pez cuando está aburrido? Nada.',
    '¿Por qué el libro de matemáticas estaba triste? Tenía demasiados problemas.',
    '¿Qué le dijo el 0 al 8? Lindo cinturón.',
    '¿Por qué los esqueletos no pelean entre sí? Porque no tienen agallas.',
    '¿Qué le dijo el mar a la playa? Nada, solo la saludó con la mano.',
    '¿Qué hace una vaca en el espacio? ¡Leche espacial!',
    '¿Cómo se despiden los químicos? Ácido un placer.',
    '¿Por qué el espantapájaros ganó un premio? Porque era destacado en su campo.',
    '¿Qué le dice una iguana a su hermana gemela? Somos iguanas.',
    '¿Por qué el sol no fue a la universidad? Porque ya tenía millones de grados.',
    '¿Qué le dijo el tornado al huracán? Nada, solo le dio vuelta la cara.',
];

const CONSEJOS = [
    'No dejes para mañana lo que podés hacer pasado mañana 😴',
    'Si la vida te da limones, vendelos y comprá lo que querés 🍋',
    'El dinero no da la felicidad pero la crisis sí que da tristeza 💸',
    'Antes de hablar, respirá. Antes de actuar, respirá más.',
    'Si algo no te mata, te fortalece. Excepto el veneno, ese te mata.',
    'El éxito es 1% inspiración y 99% no scrollear TikTok.',
    'Rodeate de gente que te sume. O al menos que no te reste demasiado.',
    'Dormí más, Netflix puede esperar. Bueno, no, mirá Netflix.',
    'Nunca subestimes el poder de una buena siesta.',
    'Si no te va bien hoy, recordá que mañana puede ir peor. O mejor, depende de vos.',
    'El secreto del éxito es empezar. El segundo secreto es no parar.',
    'Tomá agua. En serio, tomá agua.',
    'Sé la persona que tu perro cree que sos. 🐶',
];

const INSULTOS = [
    'Sos tan falso que hasta tu sombra te da la espalda.',
    'Tu personalidad tiene más huecos que el queso gruyere.',
    'Sos como el IKEA: complicado de armar y sin instrucciones claras.',
    'Si la ignorancia fuera un superpoder, serías el más poderoso.',
    'Sos tan lento que las tortugas te pasan la derecha.',
    'Sos la versión bootleg de una buena persona.',
    'Tu sentido común está en modo avión permanente.',
    'Sos tan vacío que hasta el eco se cansa de repetirte.',
    'Tenés la profundidad intelectual de un charco en el desierto.',
    'Sos como una alarma sin botón de snooze: molestás y no podés pararse.',
];

const MISTERIOS = [
    '¿Existe vida inteligente en otros planetas? 👽',
    '¿Qué hay dentro de los agujeros negros? 🕳️',
    '¿El universo es infinito o tiene un borde? 🌌',
    '¿Somos una simulación? 💻',
    '¿Qué pasó antes del Big Bang? 💥',
    '¿Existe el libre albedrío o todo está predeterminado? 🎲',
    '¿Hay otros universos paralelos? 🪞',
    '¿Por qué dormimos y soñamos? 💤',
    '¿Qué es la conciencia exactamente? 🧠',
    '¿Cuántas especies no hemos descubierto todavía? 🐙',
    '¿Hay algo más allá de la muerte? 👻',
    '¿El tiempo es lineal o existe una cuarta dimensión accesible? ⏳',
];

const WYR = [
    '¿Poder volar o ser invisible?','¿Vivir 200 años sin internet o 80 años con todo?',
    '¿Hablar todos los idiomas o tocar todos los instrumentos?',
    '¿Saber la fecha de tu muerte o cómo vas a morir?',
    '¿Tener dinero infinito o tiempo infinito?',
    '¿Ser famoso o ser extremadamente rico en secreto?',
    '¿Poder leer mentes o viajar en el tiempo?',
    '¿Nunca sentir calor o nunca sentir frío?',
    '¿Tener 10 amigos reales o 1 millón de seguidores?',
    '¿Poder pausar el tiempo o rebobinarlo?',
    '¿Siempre decir la verdad o poder mentir perfectamente?',
    '¿Vivir en el espacio o en el fondo del océano?',
    '¿Tener un dragón o ser un dragón?',
    '¿Poder hablar con animales o con objetos?',
    '¿Comer solo dulce el resto de tu vida o solo salado?',
    '¿Recordar todo perfectamente o poder olvidar lo que quieras?',
];

const HOROSCOPO = {
    aries:       '♈ **Aries** — Hoy tendrás energía imparable. Úsala para empezar ese proyecto que postergás.',
    tauro:       '♉ **Tauro** — Un día para disfrutar los placeres simples. Alguien cercano tiene buenas noticias.',
    geminis:     '♊ **Géminis** — Tu mente está en modo turbo. Aprovechá para comunicarte y hacer nuevos contactos.',
    cancer:      '♋ **Cáncer** — Las emociones están a flor de piel. Cuídate y no te olvides de los tuyos.',
    leo:         '♌ **Leo** — El centro de atención te espera. Brillás naturalmente hoy.',
    virgo:       '♍ **Virgo** — Organización y análisis son tu fuerte hoy. El trabajo da sus frutos.',
    libra:       '♎ **Libra** — La armonía y el equilibrio reinan. Una relación importante se fortalece.',
    escorpio:    '♏ **Escorpio** — Misterios por resolver. Tu intuición está afilada al máximo.',
    sagitario:   '♐ **Sagitario** — La aventura llama. Una nueva experiencia está en el horizonte.',
    capricornio: '♑ **Capricornio** — El esfuerzo sostenido da resultados hoy. Paciencia y constancia.',
    acuario:     '♒ **Acuario** — Innovación y creatividad al palo. El futuro se construye hoy.',
    piscis:      '♓ **Piscis** — La sensibilidad y empatía son tus superpoderes. Alguien necesita tu apoyo.',
};

const SLOTS_ITEMS = ['🍒','🍋','🍊','🍇','💎','⭐','🎰','🍀','🔔'];

const MUERTE = [
    'te comió un cocodrilo del Nilo 🐊','te derritió el sol de Mar del Plata ☀️',
    'te aplastó un piano cayendo del cielo 🎹','te confundieron con un NPC 🤖',
    'te atacó una bandada de palomas furiosas 🐦','muriste de cringe al ver tus fotos viejas 😬',
    'te engulló un agujero negro 🕳️','te venció el lag en un momento crítico 🖥️',
    'te cayó un meteorito de 2cm pero justo en la cabeza ☄️',
    'te derrotó un jefe final de Nivel 1 🎮',
];

const PODERES = [
    'Tu superpoder es **volar** — pero solo 10cm del suelo 🛸',
    'Tu superpoder es **leer mentes** — pero solo la de tu mascota 🐾',
    'Tu superpoder es **teletransportarte** — solo dentro de la misma habitación 🚪',
    'Tu superpoder es **ser invisible** — pero solo cuando nadie te mira igual 👻',
    'Tu superpoder es **hablar con plantas** — y ellas te ignoran 🌱',
    'Tu superpoder es **ver el futuro** — con 3 segundos de anticipación 🔮',
    'Tu superpoder es **congelar el tiempo** — solo cuando estornudás ⏸️',
    'Tu superpoder es **fuerza sobrehumana** — pero solo los martes 💪',
    'Tu superpoder es **respirar bajo el agua** — pero solo en la bañera 🛁',
    'Tu superpoder es **clonarte** — pero el clon te roba las papas 🍟',
];

const TRABAJOS_RAROS = [
    'Probador profesional de colchones 😴','Catador de helados industriales 🍦',
    'Especialista en desactivar alarmas de autos ajenos 🚗','Contador de granos de arena 🏖️',
    'Influencer de contenido gris y aburrido 📱','Detective de calcetines perdidos 🧦',
    'Entrenador de peces de colores 🐠','Crítico de memes de 2015 📸',
    'Consultor de nombres para bares vacíos 🍺','Choreógrafo de bailes de ascensor 🕺',
];

const FRASES_MOTIVADORAS = [
    '✨ "Creés que no podés, pero tampoco intentaste." — Anónimo sabio',
    '🔥 "El fracaso es el éxito que todavía no encontró el GPS." — Filosofía botuda',
    '💡 "Si tu plan A no funciona, quedan otras 25 letras." — Un optimista',
    '🌟 "Cada día es una nueva oportunidad de dormir más tarde." — Sabiduría moderna',
    '🚀 "Los sueños no tienen fecha de vencimiento. Pero vos sí." — Realismo motivacional',
    '💪 "El único mal entrenamiento es el que no hiciste. Los demás también son malos." — Gym bro',
    '🎯 "Apuntá a las estrellas. Si fallás, igual habrás hecho mucho esfuerzo." — Coach',
    '🌈 "No importa cuán lento vayas, mientras no te detengas. Pero si te detenés, dormí." — Buda revisitado',
];

// ══════════════════════════════════════════════════════════════════════════════
//  READY
// ══════════════════════════════════════════════════════════════════════════════
client.on('ready', async () => {
    console.log(`[ Bot ] ${client.user.tag} está online ✅`);
    const guild = client.guilds.cache.get(SERVER_ID);
    if (guild) {
        const role = guild.roles.cache.get(ROLE_ID);
        if (role) {
            setInterval(() => role.edit({ colors:'RANDOM' }).catch(()=>{}), RAINBOW_MS);
            console.log('[ Rainbow ] Cambia 2 veces/seg ✅');
        }
        try {
            await guild.commands.set([
                { name:'help',        description:'📋 Todos los comandos' },
                // ── Diversión ──
                { name:'meme',        description:'😂 Meme en español' },
                { name:'animal',      description:'🐾 Animal con dato curioso en español' },
                { name:'dado',        description:'🎲 Tirar un dado',                  options:[{name:'caras',    type:4,description:'Número de caras (default 6)',required:false}] },
                { name:'8ball',       description:'🎱 Bola mágica',                    options:[{name:'pregunta', type:3,description:'Tu pregunta',required:true}] },
                { name:'trivia',      description:'❓ Pregunta de trivia (gana coins)' },
                { name:'coinflip',    description:'🪙 Cara o Cruz' },
                { name:'slots',       description:'🎰 Tragamonedas (gana coins)' },
                { name:'rps',         description:'✊ Piedra Papel Tijera',             options:[{name:'eleccion', type:3,description:'piedra / papel / tijera',required:true}] },
                { name:'love',        description:'❤️ Compatibilidad amorosa',          options:[{name:'usuario',  type:6,description:'Con quién',required:true}] },
                { name:'rate',        description:'⭐ Calificar algo',                  options:[{name:'cosa',     type:3,description:'Qué calificar',required:true}] },
                { name:'ship',        description:'💑 Shipear dos personas',            options:[{name:'user1',   type:6,description:'Persona 1',required:true},{name:'user2',type:6,description:'Persona 2',required:true}] },
                { name:'ship2',       description:'💘 Ship random del servidor' },
                { name:'pp',          description:'🍆 Medidor de PP',                   options:[{name:'usuario',  type:6,description:'De quién',required:false}] },
                { name:'iq',          description:'🧠 Calculadora de IQ',               options:[{name:'usuario',  type:6,description:'De quién',required:false}] },
                { name:'tod',         description:'🎭 Verdad o Atrevido' },
                { name:'roast',       description:'🔥 Insultar a alguien',              options:[{name:'usuario',  type:6,description:'A quién',required:true}] },
                { name:'compliment',  description:'💝 Elogiar a alguien',               options:[{name:'usuario',  type:6,description:'A quién',required:false}] },
                { name:'banana',      description:'🍌 Medidor de banana',               options:[{name:'usuario',  type:6,description:'De quién',required:false}] },
                { name:'hack',        description:'💻 Hackear a alguien (falso)',        options:[{name:'usuario',  type:6,description:'A quién',required:true}] },
                { name:'wyr',         description:'🤔 ¿Qué preferirías?' },
                { name:'chiste',      description:'😄 Chiste random' },
                { name:'horoscopo',   description:'🔮 Tu horóscopo',                   options:[{name:'signo',    type:3,description:'Tu signo zodiacal',required:true}] },
                { name:'misterio',    description:'🌌 Pregunta misteriosa del universo' },
                { name:'impostor',    description:'🔴 ¿Quién es el impostor?' },
                { name:'consejo',     description:'🧙 Consejo de vida' },
                { name:'insulto',     description:'😤 Insulto creativo' },
                { name:'beso',        description:'😘 Beso a alguien',                  options:[{name:'usuario',  type:6,description:'A quién',required:true}] },
                { name:'abrazo',      description:'🤗 Abrazo a alguien',                options:[{name:'usuario',  type:6,description:'A quién',required:true}] },
                { name:'slap',        description:'👋 Cachetear a alguien',             options:[{name:'usuario',  type:6,description:'A quién',required:true}] },
                { name:'cumplea',     description:'🎂 Cumpleaños random del servidor' },
                { name:'muerte',      description:'💀 ¿Cómo vas a morir?',              options:[{name:'usuario',  type:6,description:'De quién',required:false}] },
                { name:'superpoder',  description:'🦸 Tu superpoder aleatorio',          options:[{name:'usuario',  type:6,description:'De quién',required:false}] },
                { name:'trabajo',     description:'💼 Trabajo raro aleatorio' },
                { name:'motivacion',  description:'🚀 Frase motivacional (o no)' },
                { name:'ruleta',      description:'🎲 Ruleta rusa del servidor' },
                { name:'nunca',       description:'🙋 Nunca nunca...' },
                { name:'parecer',     description:'👀 ¿A qué famoso te parecés?' },
                // ── Economía ──
                { name:'perfil',      description:'👤 Ver perfil',                      options:[{name:'usuario',  type:6,description:'De quién',required:false}] },
                { name:'ranking',     description:'🏆 Top 10 por nivel' },
                { name:'rranking',    description:'💰 Top 10 más ricos' },
                { name:'daily',       description:'🎁 Coins diarias' },
                { name:'work',        description:'💼 Trabajar (cooldown 1h)' },
                { name:'slut',        description:'💋 Actividad arriesgada (30min)' },
                { name:'crime',       description:'🔫 Cometer un crimen (2h)' },
                { name:'beg',         description:'🙏 Mendigar (cooldown 5min)' },
                { name:'heist',       description:'🏦 Golpe grande (cooldown 3h)' },
                { name:'spin',        description:'🎰 Ruleta de apuesta',               options:[{name:'apuesta',  type:4,description:'Cuántos coins apostás (mín 10)',required:true}] },
                { name:'duel',        description:'⚔️ Duelo PvP por coins',             options:[{name:'usuario',  type:6,description:'A quién desafiar',required:true},{name:'apuesta',type:4,description:'Coins en juego',required:true}] },
                { name:'transfer',    description:'💸 Transferir coins a alguien',      options:[{name:'usuario',  type:6,description:'A quién',required:true},{name:'cantidad',type:4,description:'Cuántos coins',required:true}] },
                { name:'dep',         description:'🏦 Depositar al banco',              options:[{name:'cantidad', type:3,description:'Número o all',required:true}] },
                { name:'withdraw',    description:'🏦 Retirar del banco',               options:[{name:'cantidad', type:3,description:'Número o all',required:true}] },
                { name:'rob',         description:'🥷 Robarle a alguien',               options:[{name:'usuario',  type:6,description:'A quién',required:true}] },
            ]);
            console.log('[ Slash ] Comandos registrados ✅');
        } catch(e) { console.error('[ Slash ]', e.message); }
    }
    client.user.setPresence({ status:'online', activities:[{ name:'!help | 🌈 rainbow', type:'WATCHING' }] });
});

// ── XP al chatear ─────────────────────────────────────────────────────────────
client.on('messageCreate', async (message) => {
    if (message.author.bot || !message.guild) return;
    const uid = message.author.id, now = Date.now();
    if (!xpCooldown.has(uid) || now-xpCooldown.get(uid) > 60000) {
        xpCooldown.set(uid, now);
        const up = eco.addXP(uid, message.author.username, randInt(5,20), randInt(1,5));
        if (up) { const u = eco.getUser(uid); message.channel.send(`🎉 ¡${message.author} subiste al **nivel ${u.level}**! 🆙`); }
    }
    if (!message.content.startsWith(PREFIX)) return;
    const args = message.content.slice(PREFIX.length).trim().split(/ +/);
    handleCommand(args.shift().toLowerCase(), args, message, null);
});

client.on('interactionCreate', async (interaction) => {
    if (!interaction.isCommand()) return;
    handleCommand(interaction.commandName, [], null, interaction);
});

// ══════════════════════════════════════════════════════════════════════════════
//  HANDLER CENTRAL
// ══════════════════════════════════════════════════════════════════════════════
async function handleCommand(command, args, msg, inter) {
    const guild   = inter ? inter.guild   : msg?.guild;
    const author  = inter ? inter.user    : msg?.author;
    const channel = inter ? inter.channel : msg?.channel;

    const reply = async (content, embed=null) => {
        const p = embed ? {embeds:[embed]} : {content:String(content)};
        try {
            if (inter) { return (inter.replied||inter.deferred) ? inter.followUp(p) : inter.reply(p); }
            return channel.send(p);
        } catch(e) { console.error('[ Reply ]', e.message); }
    };

    const mOpt  = (name, fb=null) => inter ? (inter.options.getUser(name)||fb) : (msg?.mentions?.users?.first()||fb);
    const sOpt  = (name)          => inter ? inter.options.getString(name)  : null;
    const iOpt  = (name)          => inter ? inter.options.getInteger(name) : null;
    const sec   = ()              => Array.from(msg?.mentions?.users?.values()||[])[1]||null;
    const E     = (t,d,c='#7289DA') => new MessageEmbed().setTitle(t).setDescription(d).setColor(c);
    const rnd   = arr => arr[Math.floor(Math.random()*arr.length)];

    // ── HELP ──────────────────────────────────────────────────────────────────
    if (command === 'help') {
        return reply(null, new MessageEmbed().setTitle('📋 Comandos del servidor').setColor('#FF69B4')
            .addField('😂 Diversión (página 1)',  '`!meme` `!animal` `!dado` `!8ball` `!trivia` `!coinflip` `!slots` `!rps` `!love` `!rate` `!ship` `!ship2` `!pp` `!iq` `!banana`')
            .addField('😂 Diversión (página 2)',  '`!tod` `!roast` `!compliment` `!hack` `!wyr` `!chiste` `!horoscopo` `!misterio` `!impostor` `!consejo` `!insulto` `!muerte` `!superpoder`')
            .addField('😂 Diversión (página 3)',  '`!beso` `!abrazo` `!slap` `!cumplea` `!trabajo` `!motivacion` `!ruleta` `!nunca` `!parecer`')
            .addField('💰 Economía',              '`!perfil` `!ranking` `!rranking` `!daily` `!work` `!slut` `!crime` `!beg` `!heist` `!spin` `!duel` `!transfer` `!dep` `!withdraw` `!rob`')
            .addField('🌈 Rainbow',               'Automático — cambia 2 veces por segundo')
            .setFooter({text:'Usá / para slash commands | XP y coins ganás chateando 💬'}));
    }

    // ══════════════════════════════════════════════════════════════════════════
    //  DIVERSIÓN
    // ══════════════════════════════════════════════════════════════════════════

    if (command === 'meme') {
        for (let i=0; i<6; i++) {
            try {
                const d = await (await fetch(`https://meme-api.com/gimme/${rnd(MEME_SUBS)}`)).json();
                if (d.url && !d.nsfw && /\.(jpg|jpeg|png|gif)$/i.test(d.url))
                    return reply(null, new MessageEmbed().setTitle(d.title||'Meme').setImage(d.url).setColor('#FF6B6B').setFooter({text:`👍 ${d.ups||0} | r/${d.subreddit}`}));
            } catch { continue; }
        }
        return reply('❌ No pude obtener un meme ahora. Intentá de nuevo.');
    }

    if (command === 'animal') {
        const keys=Object.keys(ANIMALES), tipo=rnd(keys), data=ANIMALES[tipo];
        let imgUrl=null;
        try { const j=await(await fetch(`https://some-random-api.com/animal/${data.api}`)).json(); imgUrl=j.image||null; } catch {}
        const embed=new MessageEmbed().setTitle(`${data.emoji} ${tipo.replace(/([A-Z])/g,' $1').trim().replace(/\b\w/g,c=>c.toUpperCase())}`).setDescription(`📖 **Dato curioso:** ${rnd(data.hechos)}`).setColor('#4CAF50');
        if(imgUrl) embed.setImage(imgUrl);
        return reply(null, embed);
    }

    if (command === 'dado') {
        const c=(inter?iOpt('caras'):parseInt(args[0]))||6;
        if(c<2||c>1000) return reply('❌ Entre 2 y 1000 caras.');
        return reply(null, E('🎲 Dado',`Tiraste un **d${c}** → **${randInt(1,c)}**`,'#F0A500'));
    }

    if (command === '8ball') {
        const q=inter?sOpt('pregunta'):args.join(' ').trim();
        if(!q) return reply('❌ Ej: `!8ball ¿Voy a ser rico?`');
        return reply(null, new MessageEmbed().setTitle('🎱 La bola mágica respondió...').addField('❓ Pregunta',q).addField('💬 Respuesta',rnd(BOLAS)).setColor('#6A0572'));
    }

    if (command === 'coinflip') {
        const r=Math.random()<0.5;
        return reply(null, E('🪙 Cara o Cruz',`¡Salió **${r?'CARA 😎':'CRUZ 😬'}**!`,r?'#FFD700':'#9E9E9E'));
    }

    if (command === 'slots') {
        const s=[rnd(SLOTS_ITEMS),rnd(SLOTS_ITEMS),rnd(SLOTS_ITEMS)];
        const jackpot=s[0]===s[1]&&s[1]===s[2], two=s[0]===s[1]||s[1]===s[2]||s[0]===s[2];
        let txt='';
        if(jackpot){eco.addCoins(author.id,author.username,500);txt='🎉 **¡JACKPOT!** +**500 coins** 🪙';}
        else if(two){eco.addCoins(author.id,author.username,100);txt='✨ Dos iguales. +**100 coins** 🪙';}
        else txt='💸 Sin suerte esta vez...';
        return reply(null, E('🎰 Tragamonedas',`[ ${s[0]} | ${s[1]} | ${s[2]} ]\n\n${txt}`,jackpot?'#FFD700':two?'#4CAF50':'#E53935'));
    }

    if (command === 'rps') {
        const opts=['piedra','papel','tijera'],em={piedra:'✊',papel:'📄',tijera:'✂️'};
        const el=(inter?sOpt('eleccion'):args[0]||'').toLowerCase();
        if(!opts.includes(el)) return reply('❌ Elegí: `piedra`, `papel` o `tijera`');
        const bot=rnd(opts), win=(el==='piedra'&&bot==='tijera')||(el==='papel'&&bot==='piedra')||(el==='tijera'&&bot==='papel');
        return reply(null, new MessageEmbed().setTitle('✊ Piedra Papel Tijera').addField('Vos',em[el],true).addField('Yo',em[bot],true).addField('Resultado',el===bot?'🤝 ¡Empate!':win?'🎉 ¡Ganaste!':'😔 ¡Perdiste!').setColor('#7289DA'));
    }

    if (command === 'love') {
        const t=mOpt('usuario'); if(!t) return reply('❌ Mencioná a alguien.');
        const pct=randInt(0,100), bar='❤️'.repeat(Math.floor(pct/10))+'🖤'.repeat(10-Math.floor(pct/10));
        return reply(null, E('❤️ Medidor de Amor',`**${author.username}** + **${t.username}**\n\n${bar}\n**${pct}%** ${pct>=80?'😍 ¡Almas gemelas!':pct>=60?'😊 Hay buena vibra':pct>=40?'🤔 Puede funcionar':pct>=20?'😬 Complicado...':'💔 Incompatibles'}`,'#FF69B4'));
    }

    if (command === 'rate') {
        const cosa=inter?sOpt('cosa'):args.join(' ').trim()||'eso', nota=randInt(0,10);
        const comentario=nota===10?'¡Perfecto! 🏆':nota>=8?'Muy bueno 👌':nota>=6?'Está bien 😊':nota>=4?'Más o menos 😐':nota>=2?'Bastante malo 😬':'Horrible 💀';
        return reply(null, E('⭐ Calificación',`**${cosa}**\n\n${'⭐'.repeat(nota)+'☆'.repeat(10-nota)}\n**${nota}/10** — ${comentario}`,'#FFD700'));
    }

    if (command === 'ship') {
        const u1=inter?inter.options.getUser('user1'):msg?.mentions?.users?.first(), u2=inter?inter.options.getUser('user2'):sec();
        if(!u1||!u2) return reply('❌ Mencioná a dos personas. Ej: `!ship @user1 @user2`');
        const pct=randInt(0,100), name=u1.username.slice(0,Math.ceil(u1.username.length/2))+u2.username.slice(Math.floor(u2.username.length/2));
        const desc=pct>=80?'💞 ¡Almas gemelas!':pct>=60?'💕 Muy buena onda':pct>=40?'😊 Hay potencial':pct>=20?'🤔 Tal vez con tiempo...':'💔 No funciona';
        return reply(null, E('💑 Ship',`**${u1.username}** 💗 **${u2.username}**\nNombre del ship: **${name}**\nCompatibilidad: **${pct}%** — ${desc}`,'#FF69B4'));
    }

    if (command === 'ship2') {
        const members=Array.from(guild?.members?.cache?.filter(m=>!m.user.bot)?.values()||[]);
        if(members.length<2) return reply('❌ No hay suficientes miembros.');
        const a=rnd(members), b=rnd(members.filter(m=>m.id!==a.id)), pct=randInt(0,100);
        return reply(null, E('💘 Ship Random del Servidor',`**${a.user.username}** 💗 **${b.user.username}**\n**${pct}%** ${pct>=70?'😍 ¡Enamorados!':pct>=40?'😊 Hay algo':'🤷 A ver qué pasa'}`,'#E91E63'));
    }

    if (command === 'pp') {
        const t=mOpt('usuario',author), sz=randInt(0,20);
        return reply(null, E('🍆 Medidor de PP',`**${t.username}**\n\n\`8${'='.repeat(sz)}D\`\n**${sz} cm** ${sz>=15?'😱 ¡Monstruoso!':sz>=10?'😮 Impresionante':sz>=5?'😊 Normal':sz>=2?'😅 Modesto':'🔬 Necesitás microscopio'}`,'#7CB342'));
    }

    if (command === 'iq') {
        const t=mOpt('usuario',author), iq=randInt(20,220);
        const d=iq>=180?'🧬 Dios del intelecto':iq>=160?'🧬 Genio absoluto':iq>=130?'🧠 Muy inteligente':iq>=100?'😎 Por encima del promedio':iq>=80?'😅 Promedio':iq>=60?'😬 Un poco despistado':'🥔 La papa tiene más IQ';
        return reply(null, E('🧠 Calculadora de IQ',`**${t.username}** tiene un IQ de **${iq}**\n${d}`,'#5C6BC0'));
    }

    if (command === 'tod') {
        const esV=Math.random()<0.5;
        return reply(null, E(esV?'🎭 ¡VERDAD!':'🎭 ¡ATREVIDO!',rnd(esV?VERDADES:ATREVIDOS),esV?'#2196F3':'#FF5722').setFooter({text:esV?'¡Tenés que responder con honestidad!':'¡Sin excusas!'}));
    }

    if (command === 'roast') {
        const t=mOpt('usuario'); if(!t) return reply('❌ Mencioná a alguien.');
        return reply(null, E(`🔥 Roast para ${t.username}`,rnd(ROASTS),'#E53935').setFooter({text:'Es solo por diversión 😈'}));
    }

    if (command === 'compliment') {
        const t=mOpt('usuario',author);
        return reply(null, E(`💝 Elogio para ${t.username}`,rnd(COMPLIMENTS),'#E91E63').setFooter({text:'¡Lo merece! ✨'}));
    }

    if (command === 'banana') {
        const t=mOpt('usuario',author), sz=randInt(0,25);
        return reply(null, E('🍌 Medidor de Banana',`**${t.username}**\n\n${'🍌'.repeat(Math.max(1,Math.ceil(sz/4)))}\n**${sz} cm** ${sz>=20?'🏆 Legendario':sz>=14?'😮 Impresionante':sz>=8?'😊 Normal':'😅 Pequeñita'}`,'#FFD600'));
    }

    if (command === 'hack') {
        const t=mOpt('usuario'); if(!t) return reply('❌ Mencioná a alguien.');
        if(inter) await inter.reply({content:`💻 Iniciando hack a **${t.username}**...`}).catch(()=>{});
        const pasos=[`💻 Iniciando ataque a **${t.username}**...`,'🔍 Escaneando vulnerabilidades...','🔑 Crackeando contraseña con fuerza bruta...','📡 Bypaseando firewall...','🗄️ Filtrando base de datos...','📱 Accediendo a redes sociales...','💳 Encontrando datos bancarios...',`☠️ **${t.username}** completamente hackeado!\nIP: \`192.168.${randInt(1,254)}.${randInt(1,254)}\` | Pass: \`${['hunter','robot','admin','pass','qwerty'][randInt(0,4)]}${randInt(100,9999)}\`\nSaldo bancario robado: 💰${randInt(10,9999)} USD 💀`];
        const sent=await channel.send(pasos[0]).catch(()=>null); if(!sent) return;
        let i=0; const iv=setInterval(async()=>{ i++; if(i<pasos.length){try{await sent.edit(pasos[i]);}catch{}}else clearInterval(iv); },1000);
        return;
    }

    if (command === 'wyr') {
        return reply(null, E('🤔 ¿Qué preferirías?',rnd(WYR),'#9C27B0').setFooter({text:'Respondé en el chat y debatí con el servidor!'}));
    }

    if (command === 'chiste') {
        return reply(null, E('😄 Chiste del día',rnd(CHISTES),'#FF9800').setFooter({text:'© Ministerio de Chistes Malos'}));
    }

    if (command === 'horoscopo') {
        const raw=(inter?sOpt('signo'):args[0]||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim();
        const desc=HOROSCOPO[raw];
        if(!desc) return reply('❌ Signo no válido. Usá: `aries`, `tauro`, `geminis`, `cancer`, `leo`, `virgo`, `libra`, `escorpio`, `sagitario`, `capricornio`, `acuario`, `piscis`');
        return reply(null, E('🔮 Horóscopo de hoy',desc,'#7B1FA2').setFooter({text:'Solo por diversión, no lo tomes en serio 😄'}));
    }

    if (command === 'misterio') {
        return reply(null, E('🌌 Misterio del Universo',rnd(MISTERIOS),'#1A237E').setFooter({text:'¿Qué pensás vos? 💭'}));
    }

    if (command === 'impostor') {
        const members=Array.from(guild?.members?.cache?.filter(m=>!m.user.bot)?.values()||[]);
        if(!members.length) return reply('❌ No hay miembros.');
        const imp=rnd(members);
        return reply(null, E('🔴 ¡El impostor es...!',`🔪 **${imp.user.username}** es el impostor\n\n*Todos al chat de emergencia.*`,'#C62828').setFooter({text:'Es solo un juego! Among Us mode 😄'}));
    }

    if (command === 'consejo') {
        return reply(null, E('🧙 Consejo de Vida',rnd(CONSEJOS),'#00897B').setFooter({text:'Sabiduría gratuita, sin garantías'}));
    }

    if (command === 'insulto') {
        return reply(null, E('😤 Insulto Creativo',rnd(INSULTOS),'#B71C1C').setFooter({text:'¡Es solo por diversión! No te lo tomés a pecho'}));
    }

    if (command === 'beso') {
        const t=mOpt('usuario'); if(!t) return reply('❌ Mencioná a alguien.');
        const gifs=['https://media.giphy.com/media/G3va31oEEnIkM/giphy.gif','https://media.giphy.com/media/zkppEMFvRX5FC/giphy.gif'];
        return reply(null, new MessageEmbed().setTitle('😘 ¡Beso!').setDescription(`**${author.username}** le dio un beso a **${t.username}** 💋`).setImage(rnd(gifs)).setColor('#E91E63'));
    }

    if (command === 'abrazo') {
        const t=mOpt('usuario'); if(!t) return reply('❌ Mencioná a alguien.');
        const gifs=['https://media.giphy.com/media/3M4NpbLCTxBqU/giphy.gif','https://media.giphy.com/media/lrr9rHuoJOE0w/giphy.gif'];
        return reply(null, new MessageEmbed().setTitle('🤗 ¡Abrazo!').setDescription(`**${author.username}** le dio un abrazo a **${t.username}** 🤗`).setImage(rnd(gifs)).setColor('#FF9800'));
    }

    if (command === 'slap') {
        const t=mOpt('usuario'); if(!t) return reply('❌ Mencioná a alguien.');
        const gifs=['https://media.giphy.com/media/Zau0yrl17uzdK/giphy.gif','https://media.giphy.com/media/uqSU9IEYEKAbS/giphy.gif'];
        return reply(null, new MessageEmbed().setTitle('👋 ¡Cachetazo!').setDescription(`**${author.username}** le pegó una cachetada a **${t.username}** 💥`).setImage(rnd(gifs)).setColor('#FF5722'));
    }

    if (command === 'cumplea') {
        const members=Array.from(guild?.members?.cache?.filter(m=>!m.user.bot)?.values()||[]);
        if(!members.length) return reply('❌ No hay miembros.');
        const h=rnd(members);
        return reply(null, E('🎂 ¡Feliz Cumpleaños!',`🎉 ¡Hoy es el cumpleaños de **${h.user.username}**!\n\n¡Vayan a felicitarlo/a! 🎁🎈🎊`,'#FF69B4').setFooter({text:'Esto es random, puede no ser verdad 😄'}));
    }

    if (command === 'muerte') {
        const t=mOpt('usuario',author);
        return reply(null, E('💀 Causa de Muerte',`**${t.username}** ${rnd(MUERTE)}`,'#424242').setFooter({text:'Es ficción 💀'}));
    }

    if (command === 'superpoder') {
        const t=mOpt('usuario',author);
        return reply(null, E(`🦸 Superpoder de ${t.username}`,rnd(PODERES),'#7B1FA2'));
    }

    if (command === 'trabajo') {
        return reply(null, E('💼 Tu trabajo ideal',`Tu próxima vocación: **${rnd(TRABAJOS_RAROS)}**`,'#FF6F00').setFooter({text:'El mercado laboral está complicado'}));
    }

    if (command === 'motivacion') {
        return reply(null, E('🚀 Frase Motivacional',rnd(FRASES_MOTIVADORAS),'#00BCD4').setFooter({text:'Creé en vos mismo. O no. Como quieras.'}));
    }

    if (command === 'ruleta') {
        // Ruleta rusa: elige a alguien random del servidor
        const members=Array.from(guild?.members?.cache?.filter(m=>!m.user.bot)?.values()||[]);
        if(!members.length) return reply('❌ No hay miembros.');
        const victima=rnd(members);
        const sobrevive=Math.random()<0.833; // 5/6 chances de sobrevivir
        return reply(null, E('🔫 Ruleta Rusa',`La ruleta apuntó a **${victima.user.username}**...\n\n${sobrevive?'*click*\n\n💨 ¡Bala vacía! **Sobrevivió** esta vez...':'**BANG** 💥\n\n☠️ **Eliminado del servidor** *(no en realidad)*'}`,'#B71C1C').setFooter({text:'Es solo un juego 😅'}));
    }

    if (command === 'nunca') {
        const frases=[
            'Nunca nunca... **comí pizza con piña y me gustó** 🍕',
            'Nunca nunca... **mandé un mensaje al destinatario equivocado** 📱',
            'Nunca nunca... **me quedé dormido viendo Netflix** 😴',
            'Nunca nunca... **mentí diciendo que ya iba cuando ni me había levantado** 🤥',
            'Nunca nunca... **busqué mi propio nombre en Google** 🔍',
            'Nunca nunca... **hablé mal de alguien y esa persona apareció de la nada** 😬',
            'Nunca nunca... **fingí no escuchar una pregunta para no responderla** 🙉',
            'Nunca nunca... **comí de pie frente a la heladera a medianoche** 🌙',
            'Nunca nunca... **le hice caso a mi horóscopo aunque no crea en eso** ♈',
            'Nunca nunca... **grité en el interior cuando alguien arruinó mi plan** 😤',
        ];
        return reply(null, E('🙋 Nunca Nunca',rnd(frases),'#4CAF50').setFooter({text:'¡El que lo hizo levante la mano!'}));
    }

    if (command === 'parecer') {
        const t=mOpt('usuario',author);
        const famosos=['Messi 🐐','Cristiano Ronaldo ⚽','Bad Bunny 🎤','Shakira 💃','Elon Musk 🚀','Barack Obama 🎤','Billie Eilish 🎵','Lali Espósito 🌟','Paulo Dybala ⭐','Maluma 🎶','Taylor Swift 🎸','Lionel Richie 🎹','Thanos 💜','SpongeBob 🧽','Shrek 🟢'];
        return reply(null, E(`👀 ¿A quién te parecés?`,`**${t.username}** se parece a... **${rnd(famosos)}**`,'#FF6B6B').setFooter({text:'Resultado generado científicamente (no)'}));
    }

    if (command === 'trivia') {
        const q=rnd(TRIVIA);
        await reply(`❓ **Trivia:** ${q.p}\n*(Tenés 15 segundos para responder en el chat)*`);
        const col=channel.createMessageCollector({filter:m=>!m.author.bot,time:15000});
        let ok=false;
        col.on('collect',m=>{ if(m.content.toLowerCase().includes(q.r)){ ok=true; eco.addCoins(m.author.id,m.author.username,50); channel.send(`✅ ¡Correcto, ${m.author}! Era **${q.r.charAt(0).toUpperCase()+q.r.slice(1)}**. 💰 +50 coins!`); col.stop(); } });
        col.on('end',()=>{ if(!ok) channel.send(`⏰ Tiempo. La respuesta era **${q.r.charAt(0).toUpperCase()+q.r.slice(1)}**.`); });
        return;
    }

    // ══════════════════════════════════════════════════════════════════════════
    //  ECONOMÍA
    // ══════════════════════════════════════════════════════════════════════════

    if (command === 'perfil') {
        const t=mOpt('usuario',author), u=eco.getUser(t.id,t.username), need=eco.xpNeeded(u.level);
        const wr = (u.wins||0)+(u.losses||0) > 0 ? `${u.wins||0}W / ${u.losses||0}L` : 'Sin historial';
        return reply(null, new MessageEmbed()
            .setTitle(`👤 Perfil de ${t.username}`)
            .setThumbnail(t.displayAvatarURL({dynamic:true}))
            .setColor('#FFD700')
            .addField('👛 Billetera', `${u.coins} 🪙`,              true)
            .addField('🏦 Banco',     `${u.banco||0} 🪙`,           true)
            .addField('💎 Total',     `${u.coins+(u.banco||0)} 🪙`,  true)
            .addField('⭐ XP',        `${u.xp} / ${need}`,          true)
            .addField('🆙 Nivel',     `${u.level}`,                  true)
            .addField('🎰 W/L',       wr,                             true)
            .addField('💰 Total ganado', `${u.totalEarned||0} 🪙`,  true)
            .addField('📊 Progreso',  barProgress(u.xp,need))
            .setFooter({text:'Ganás XP y coins chateando'}));
    }

    if (command === 'ranking') {
        const top=eco.getTop(10); if(!top.length) return reply('📭 No hay datos aún.');
        return reply(null, new MessageEmbed().setTitle('🏆 Top 10 — Por Nivel').setColor('#FFD700')
            .setDescription(top.map((u,i)=>`${i===0?'🥇':i===1?'🥈':i===2?'🥉':`**${i+1}.**`} **${u.username}** — Nv.**${u.level}** | 💰${u.coins+(u.banco||0)}`).join('\n')));
    }

    if (command === 'rranking') {
        const top=eco.getRichTop(10); if(!top.length) return reply('📭 No hay datos aún.');
        return reply(null, new MessageEmbed().setTitle('💰 Top 10 — Los más ricos').setColor('#FFD700')
            .setDescription(top.map((u,i)=>`${i===0?'🥇':i===1?'🥈':i===2?'🥉':`**${i+1}.**`} **${u.username}** — 💰**${u.coins+(u.banco||0)}** coins | Nv.${u.level}`).join('\n')));
    }

    if (command === 'daily') {
        const r=eco.claimDaily(author.id,author.username);
        if(r.success) return reply(null, E('🎁 Daily reclamado!',`+**${r.amount} coins** 🪙\nBilletera: **${r.total}**`,'#00C851').setFooter({text:'Volvé mañana para más!'}));
        return reply(`⏰ Ya reclamaste tu daily. Volvé en **${fmtTime(r.remaining)}**.`);
    }

    if (command === 'work') {
        const r=eco.doWork(author.id,author.username);
        if(!r.success) return reply(`⏰ Ya trabajaste. Volvé en **${fmtTime(r.remaining)}**.`);
        return reply(null, E('💼 ¡Trabajo completado!',`${r.job.verb}\n\n+**${r.earned} coins** 💰`,'#4CAF50').addField('👛 Billetera',`${r.total} 🪙`,true).setFooter({text:'Cooldown: 1 hora'}));
    }

    if (command === 'slut') {
        const r=eco.doSlut(author.id,author.username);
        if(!r.success) return reply(`⏰ Necesitás descansar. Volvé en **${fmtTime(r.remaining)}**.`);
        return reply(null, E(r.win?'💋 ¡Saliste bien!':'💋 No salió bien...',r.msg,r.win?'#FF69B4':'#E53935').addField(r.win?'💰 Ganaste':'💸 Perdiste',`${r.amount} 🪙`,true).addField('👛 Total',`${r.total} 🪙`,true).setFooter({text:'Cooldown: 30 minutos'}));
    }

    if (command === 'crime') {
        const r=eco.doCrime(author.id,author.username);
        if(!r.success) return reply(`⏰ Esperá antes de volver a delinquir. Volvé en **${fmtTime(r.remaining)}**.`);
        return reply(null, E(r.win?'🔫 ¡Crimen exitoso!':'🔫 ¡Te atraparon!',r.msg,r.win?'#B71C1C':'#E53935').addField(r.win?'💰 Ganaste':'💸 Perdiste',`${r.amount} 🪙`,true).addField('👛 Total',`${r.total} 🪙`,true).setFooter({text:'Cooldown: 2 horas'}));
    }

    if (command === 'beg') {
        const r=eco.doBeg(author.id,author.username);
        if(!r.success) return reply(`⏰ Volvé en **${fmtTime(r.remaining)}** a pedir limosna.`);
        return reply(null, E(r.win?'🙏 ¡Conseguiste algo!':'🙏 Nadie te dio nada...',r.msg,r.win?'#8BC34A':'#9E9E9E').addField('💰 Resultado',`${r.amount} 🪙`,true).addField('👛 Total',`${r.total} 🪙`,true).setFooter({text:'Cooldown: 5 minutos'}));
    }

    if (command === 'heist') {
        const r=eco.doHeist(author.id,author.username);
        if(!r.success) return reply(`⏰ Necesitás planear el siguiente golpe. Volvé en **${fmtTime(r.remaining)}**.`);
        return reply(null, E(r.win?'🏦 ¡Golpe exitoso!':'🏦 ¡El golpe falló!',r.msg,r.win?'#1B5E20':'#B71C1C').addField(r.win?'💰 Botín':'💸 Pérdida',`${r.amount} 🪙`,true).addField('👛 Total',`${r.total} 🪙`,true).setFooter({text:'Cooldown: 3 horas'}));
    }

    if (command === 'spin') {
        const bet=iOpt('apuesta')||parseInt(args[0]);
        const r=eco.doSpin(author.id,author.username,bet);
        if(!r.success&&r.type==='cooldown') return reply(`⏰ Volvé en **${fmtTime(r.remaining)}**.`);
        if(!r.success&&r.type==='invalid')  return reply('❌ La apuesta mínima es **10 coins**. Ej: `!spin 100`');
        if(!r.success&&r.type==='broke')    return reply(`❌ No tenés suficientes coins. Tenés **${r.have}** 🪙`);
        const jackpot = r.isZero;
        const desc=`La bolita cayó en el **${r.n}** — ${r.color}\n\nApostaste: **${r.bet} 🪙**\n${jackpot?`🎉 **¡JACKPOT! (35x)** +**${r.earned} coins**`:`✅ Ganaste **${r.earned} coins** (1x)`}`;
        return reply(null, E('🎰 Ruleta',desc,jackpot?'#FFD700':'#4CAF50').addField('👛 Total',`${r.total} 🪙`,true).setFooter({text:'Verde (0) = jackpot 35x | Rojo/Negro = 1x | Cooldown: 30 min'}));
    }

    if (command === 'duel') {
        const t=mOpt('usuario'); if(!t) return reply('❌ Mencioná a alguien.');
        if(t.id===author.id) return reply('❌ No podés duelarte con vos mismo.');
        if(t.bot) return reply('❌ No podés duelarte con un bot.');
        const bet=iOpt('apuesta')||parseInt(args[1])||0;
        if(!bet||bet<10) return reply('❌ La apuesta mínima es **10 coins**. Ej: `!duel @usuario 200`');
        const r=eco.doDuel(author.id,author.username,t.id,t.username,bet);
        if(!r.success&&r.type==='broke_challenger') return reply(`❌ No tenés suficientes coins para apostar **${bet}**.`);
        if(!r.success&&r.type==='broke_target') return reply(`❌ **${r.targetName}** no tiene suficientes coins para el duelo.`);
        const w=r.challengerWins?author.username:t.username, l=r.challengerWins?t.username:author.username;
        const ataques=['con una cuchara de madera 🥄','en un debate de filosofía 📚','jugando al piedra papel tijera ✊','en una carrera de tortugas 🐢','con un chiste malo 😂','en un concurso de miradas 👀'];
        return reply(null, E('⚔️ ¡Duelo!',`**${w}** venció a **${l}** ${rnd(ataques)}\n\n**${w}** gana **${r.bet} coins** 🏆`,'#FF6F00').addField(`${author.username}`,`${r.challengerTotal} 🪙`,true).addField(`${t.username}`,`${r.targetTotal} 🪙`,true));
    }

    if (command === 'transfer') {
        const t=mOpt('usuario'); if(!t) return reply('❌ Mencioná a alguien.');
        if(t.id===author.id) return reply('❌ No podés transferirte a vos mismo.');
        if(t.bot) return reply('❌ No podés transferirle a un bot.');
        const amt=iOpt('cantidad')||parseInt(args[1])||0;
        const r=eco.transfer(author.id,author.username,t.id,t.username,amt);
        if(!r.success&&r.reason==='invalid') return reply('❌ Cantidad inválida. Ej: `!transfer @usuario 500`');
        if(!r.success&&r.reason==='broke')   return reply(`❌ Solo tenés **${r.have}** coins en billetera.`);
        return reply(null, E('💸 Transferencia realizada',`**${author.username}** le envió **${r.amount} coins** a **${t.username}** ✅`,'#4CAF50').addField('Tu billetera',`${r.fromTotal} 🪙`,true).addField(`Billetera de ${t.username}`,`${r.toTotal} 🪙`,true));
    }

    if (command === 'dep') {
        const amt=inter?sOpt('cantidad'):args.join(' ').trim(), r=eco.deposit(author.id,author.username,amt);
        if(!r.success&&r.reason==='invalid') return reply('❌ Escribí una cantidad válida o `all`. Ej: `!dep 500`');
        if(!r.success&&r.reason==='broke')   return reply(`❌ Solo tenés **${r.have}** coins en billetera.`);
        return reply(null, E('🏦 Depósito realizado',`Depositaste **${r.amount} coins** al banco 💰`,'#1565C0').addField('👛 Billetera',`${r.coins} 🪙`,true).addField('🏦 Banco',`${r.banco} 🪙`,true));
    }

    if (command === 'withdraw') {
        const amt=inter?sOpt('cantidad'):args.join(' ').trim(), r=eco.withdraw(author.id,author.username,amt);
        if(!r.success&&r.reason==='invalid') return reply('❌ Escribí una cantidad válida o `all`. Ej: `!withdraw 500`');
        if(!r.success&&r.reason==='broke')   return reply(`❌ Solo tenés **${r.have}** coins en el banco.`);
        return reply(null, E('🏦 Retiro realizado',`Retiraste **${r.amount} coins** del banco 💸`,'#1565C0').addField('👛 Billetera',`${r.coins} 🪙`,true).addField('🏦 Banco',`${r.banco} 🪙`,true));
    }

    if (command === 'rob') {
        const t=mOpt('usuario');
        if(!t)               return reply('❌ Mencioná a quien querés robar. Ej: `!rob @usuario`');
        if(t.id===author.id) return reply('❌ No podés robarte a vos mismo 😂');
        if(t.bot)            return reply('❌ No podés robarle a un bot.');
        const r=eco.doRob(author.id,author.username,t.id,t.username);
        if(!r.success&&r.type==='cooldown') return reply(`⏰ Esperá **${fmtTime(r.remaining)}**.`);
        if(!r.success&&r.type==='poor')     return reply(`❌ **${r.targetName}** tiene menos de 100 coins. No vale la pena.`);
        return reply(null, E(r.win?'🥷 ¡Robo exitoso!':'🥷 ¡Te agarraron!',r.win?`Le robaste **${r.amount} coins** a **${r.targetName}** 😈`:`Intentaste robarle a **${r.targetName}** pero te pescaron. Multa: **${r.fine} coins** 🚔`,r.win?'#FF6F00':'#E53935').addField('👛 Billetera',`${r.total} 🪙`,true).setFooter({text:'Cooldown: 1 hora'}));
    }
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function fmtTime(ms) {
    const h=Math.floor(ms/3600000),m=Math.floor((ms%3600000)/60000),s=Math.floor((ms%60000)/1000);
    return h>0?`${h}h ${m}m`:m>0?`${m}m ${s}s`:`${s}s`;
}
function randInt(min,max){ return Math.floor(Math.random()*(max-min+1))+min; }
function barProgress(cur,tot){
    if(!tot) return '░'.repeat(10)+' 0%';
    const p=Math.min(Math.floor((cur/tot)*10),10);
    return '█'.repeat(p)+'░'.repeat(10-p)+` ${Math.floor((cur/tot)*100)}%`;
}

keepAlive();
client.login(TOKEN);
