// ─── Exponer ffmpeg al PATH para que DisTube lo encuentre ────────────────────
const ffmpegPath = require('ffmpeg-static');
const path = require('path');
process.env.PATH = process.env.PATH + path.delimiter + path.dirname(ffmpegPath);

const { Client, Intents, MessageEmbed } = require('discord.js');
const { DisTube } = require('distube');
const { YtdlcorePlugin } = require('@distube/ytdl-core');
const fetch     = require('node-fetch');
const keepAlive = require('./keep_alive');
const eco       = require('./economy');

// ─── Config ───────────────────────────────────────────────────────────────────
const PREFIX         = '!';
const TOKEN          = process.env.TOKEN     || 'PEGA_TU_TOKEN_AQUI';
const SERVER_ID      = process.env.SERVER_ID || '1473797537398784081';
const ROLE_ID        = process.env.ROLE_ID   || '1473797735416332385';
const RAINBOW_MS     = 500; // 2 veces por segundo

const MEME_SUBS = ['memesenespanol','MemesEnEspanol','Memes_En_Espanol','argentina','latinoamerica','espanol','chile','mexico'];

// ─── Client ───────────────────────────────────────────────────────────────────
const client = new Client({
    intents: [
        Intents.FLAGS.GUILDS,
        Intents.FLAGS.GUILD_MESSAGES,
        Intents.FLAGS.GUILD_VOICE_STATES,
        Intents.FLAGS.GUILD_MESSAGE_REACTIONS,
        Intents.FLAGS.MESSAGE_CONTENT,
    ]
});

// ─── DisTube ──────────────────────────────────────────────────────────────────
const distube = new DisTube(client, {
    searchSongs: 1,
    searchCooldown: 30,
    leaveOnEmpty: true,
    emptyCooldown: 25,
    leaveOnFinish: true,
    leaveOnStop: true,
    plugins: [new YtdlcorePlugin()],
});

distube
    .on('playSong',  (queue, song) => queue.textChannel?.send(`▶️ Reproduciendo: **${song.name}** \`${song.formattedDuration}\` — *${song.user?.username || '?'}*`))
    .on('addSong',   (queue, song) => queue.textChannel?.send(`✅ Agregado a la cola: **${song.name}** — posición #${queue.songs.length}`))
    .on('addList',   (queue, pl)   => queue.textChannel?.send(`✅ Playlist: **${pl.name}** (${pl.songs.length} canciones)`))
    .on('finish',    (queue)       => queue.textChannel?.send('📭 Cola terminada. ¡Hasta la próxima!'))
    .on('error',     (channel, e)  => { console.error('[ DisTube ]', e.message); channel?.send(`❌ Error de música: \`${String(e.message).slice(0, 120)}\``); });

const xpCooldown = new Map();

// ─── Hechos de animales en ESPAÑOL (no depende de la API) ────────────────────
const ANIMALES = {
    gato:       { emoji:'🐱', api:'cat',       hechos:['Los gatos pasan el 70% de su vida durmiendo.','Un gato adulto solo maúlla para comunicarse con humanos, no con otros gatos.','Los gatos tienen 32 músculos en cada oreja.','Los bigotes de un gato miden aproximadamente el ancho de su cuerpo.','Los gatos pueden saltar hasta 6 veces su propia altura.'] },
    perro:      { emoji:'🐶', api:'dog',       hechos:['Los perros tienen olfato 10.000 veces más potente que los humanos.','Los perros pueden reconocer hasta 250 palabras.','Los perros sudan por las patas.','Pueden detectar el estrés humano por el olor del cortisol.','Un perro puede oler enfermedades como el cáncer y la diabetes.'] },
    zorro:      { emoji:'🦊', api:'fox',       hechos:['Los zorros usan el campo magnético de la Tierra para cazar.','Pueden hacer más de 40 sonidos distintos.','Son los únicos cánidos que retraen garras como los gatos.','Usan su cola como almohada para calentarse en el frío.','Son animales principalmente solitarios y nocturnos.'] },
    panda:      { emoji:'🐼', api:'panda',     hechos:['Un panda come entre 12 y 38 kg de bambú al día.','Los pandas tienen una falsa sexta "dedo" que es un hueso de la muñeca.','Una cría de panda es 900 veces más pequeña que su madre al nacer.','El rugido de un panda suena más a balido de oveja.','Existen menos de 2.000 pandas gigantes en el mundo.'] },
    koala:      { emoji:'🐨', api:'koala',     hechos:['Los koalas duermen entre 18 y 22 horas al día.','Tienen huellas dactilares casi idénticas a las humanas.','Su cerebro solo ocupa el 61% de su cavidad craneal.','Obtienen casi toda su agua del eucalipto que comen.','Son uno de los pocos mamíferos que comen hojas de eucalipto venenosas.'] },
    pajaro:     { emoji:'🐦', api:'bird',      hechos:['El colibrí es el único pájaro que puede volar hacia atrás.','Los búhos no pueden mover sus globos oculares, por eso giran la cabeza.','Los flamencos son rosados por los carotenoides del camarón que comen.','Los cuervos pueden recordar caras humanas durante años.','Los loros pueden imitar el habla porque tienen una siringe especial.'] },
    mapache:    { emoji:'🦝', api:'raccoon',   hechos:['Los mapaches pueden abrir cerrojos y frascos con tapa.','Tienen memoria capaz de recordar soluciones a problemas 3 años después.','Mojan su comida para potenciar su sensibilidad táctil, no para lavarla.','Son excelentes nadadores y trepadores.','Su IQ es similar al de los gatos.'] },
    canguro:    { emoji:'🦘', api:'kangaroo',  hechos:['Los canguros no pueden caminar hacia atrás.','Una cría de canguro mide apenas 2 cm al nacer.','Pueden saltar más de 9 metros en un solo salto.','Los machos se "boxean" para competir por las hembras.','Usan su cola como tercera pierna al caminar lentamente.'] },
    pandaRojo:  { emoji:'🔴🐼', api:'red_panda', hechos:['El panda rojo fue descubierto 48 años antes que el panda gigante.','Está más emparentado con las comadrejas que con los osos.','Son principalmente nocturnos y crepusculares.','Pasan la mayor parte del tiempo en los árboles.','Usan su cola peluda como almohada en el frío.'] },
};

// ─── Contenido de diversión ───────────────────────────────────────────────────
const TRIVIA = [
    {p:'¿Cuál es el planeta más grande del sistema solar?', r:'júpiter'},
    {p:'¿Cuántos colores tiene el arcoíris?',               r:'7'},
    {p:'¿Cuál es el océano más grande del mundo?',          r:'pacífico'},
    {p:'¿En qué año llegó el hombre a la Luna?',            r:'1969'},
    {p:'¿Cuál es el animal terrestre más rápido?',          r:'guepardo'},
    {p:'¿Cuántos lados tiene un hexágono?',                 r:'6'},
    {p:'¿Cuál es el país más grande del mundo?',            r:'rusia'},
    {p:'¿Cuántos huesos tiene el cuerpo humano adulto?',    r:'206'},
    {p:'¿En qué continente está Egipto?',                   r:'africa'},
    {p:'¿Cuántas patas tiene una araña?',                   r:'8'},
    {p:'¿Cuál es el río más largo del mundo?',              r:'nilo'},
    {p:'¿Quién pintó la Mona Lisa?',                        r:'da vinci'},
    {p:'¿Cuántos jugadores tiene un equipo de fútbol?',     r:'11'},
    {p:'¿De qué país es la bandera celeste y blanca?',      r:'argentina'},
    {p:'¿Cuántos continentes hay en el mundo?',             r:'7'},
    {p:'¿Cuál es la capital de Brasil?',                    r:'brasilia'},
    {p:'¿Cuántos días tiene un año bisiesto?',              r:'366'},
    {p:'¿Qué planeta es el planeta rojo?',                  r:'marte'},
    {p:'¿Quién escribió el Quijote?',                       r:'cervantes'},
    {p:'¿En qué año fue la Revolución Francesa?',           r:'1789'},
    {p:'¿Cuál es el elemento más abundante en el universo?',r:'hidrógeno'},
    {p:'¿Cuántos lados tiene un octágono?',                 r:'8'},
    {p:'¿Cuál es la capital de Japón?',                     r:'tokio'},
    {p:'¿Cuántos planetas tiene el sistema solar?',         r:'8'},
    {p:'¿Cuál es el deporte más popular del mundo?',        r:'fútbol'},
];

const BOLAS = ['✅ Definitivamente sí.','✅ Sin duda alguna.','✅ Sí, claro.','✅ Todas las señales dicen que sí.','✅ ¡Mirá que sí!','🤔 Las señales no son claras.','🤔 Preguntá de nuevo más tarde.','🤔 Es mejor no decirte ahora.','❌ No creo.','❌ Definitivamente no.','❌ Mis fuentes dicen que no.','❌ Las perspectivas no son buenas.'];
const VERDADES = ['¿Cuál fue tu momento más vergonzoso?','¿Alguna vez mentiste a tu mejor amigo?','¿A quién del servidor le tenés ganas? 👀','¿Cuál es tu mayor miedo?','¿Qué es lo más raro que buscaste en Google?','¿Alguna vez lloraste con una película?','¿Cuál es tu peor hábito?','¿Cuánto tiempo pasás en el baño?','¿Alguna vez te hiciste el dormido para no hablar con alguien?','¿Cuál es la mentira más grande que dijiste?','¿Alguna vez stalkeaste el perfil de alguien?','¿Qué aplicación borrarías si te vieran el celular?','¿Alguna vez comiste algo del piso?'];
const ATREVIDOS = ['Cambiá tu foto de perfil por una papa por 24hs 🥔','Escribí un elogio a la última persona que mencionaste','Cantá 30 segundos de una canción en el canal de voz 🎤','Mandá un sticker random a alguien del servidor','Escribí tu nombre completo al revés en el chat','Hacé 10 flexiones y mandá foto de prueba 💪','Cambiá tu estado a "Me gustan los pies" por 1 hora','Nombrá 3 personas del servidor con las que saldrías','Describí a la última persona que agregaste con un emoji','Confesá tu mayor secreto en el servidor 🤫','Imitá a alguien del servidor en el chat durante 5 minutos'];
const ROASTS = ['Sos tan lento que Google Maps te sugiere ir a pie y aun así llegás tarde.','Tu cara es la razón por la que las cámaras tienen modo retrato: para difuminarte.','Sos tan inútil que hasta tu sombra te abandona cuando hay poca luz.','Tus neuronas se conocieron pero no se cayeron bien.','Sos tan aburrido que hasta el silencio te pide que te calles.','Si la estupidez doliera, vivirías quejándote.','Sos la razón por la que el shampoo tiene instrucciones.','Tu cerebro tiene más bugs que el código de un Junior.','Sos tan predecible que hasta el horóscopo se aburre de vos.','Ponés la L de LOL en slow motion.','Sos como el WiFi en el campo: todos saben que existís pero nadie te agarra bien.'];
const COMPLIMENTS = ['¡Sos una persona increíble y el mundo es mejor contigo! 🌟','Tu energía positiva ilumina cualquier sala. ✨','Sos más valioso/a de lo que creés. 💎','Tu creatividad no tiene límites. 🎨','Sos de las pocas personas que realmente marca la diferencia. 🏆','Tienes una sonrisa que puede alegrar el día de cualquiera. 😊','Tu dedicación es inspiradora. 💪','Sos alguien con quien da gusto hablar. 🤝','El universo tuvo suerte cuando te creó. 🌌','Sos exactamente la persona que este servidor necesitaba. 🎯'];
const CHISTES = ['¿Por qué los pájaros vuelan hacia el sur en invierno? Porque caminar llevaría demasiado.','¿Qué hace una abeja en el gimnasio? ¡Zum-ba!','¿Cómo se llama el campeón de buceo de Japón? Tokofondo.','¿Por qué la escoba está feliz? Porque barrió el concurso.','¿Qué le dice un semáforo a otro? No me mires que me estoy cambiando.','¿Qué hace un pez cuando está aburrido? Nada.','¿Por qué el libro de matemáticas estaba triste? Tenía demasiados problemas.','¿Qué le dijo el 0 al 8? Lindo cinturón.','¿Por qué los esqueletos no pelean entre sí? Porque no tienen agallas.'];
const CONSEJOS = ['No dejes para mañana lo que podés hacer pasado mañana 😴','Si la vida te da limones, vendelos y comprá lo que querés 🍋','El dinero no da la felicidad pero la crisis sí que da tristeza 💸','Antes de hablar, respirá. Antes de actuar, respirá más.','Si algo no te mata, te fortalece. Excepto el veneno, ese te mata.','Dormí más, Netflix puede esperar. Bueno, no, mirá Netflix.','El éxito es 1% inspiración y 99% no scrollear TikTok.','Rodeate de gente que te sume. O al menos que no te reste demasiado.'];
const INSULTOS = ['Sos tan falso que hasta tu sombra te da la espalda.','Tu personalidad tiene más huecos que el queso gruyere.','Sos como el IKEA: complicado de armar y sin instrucciones claras.','Si la ignorancia fuera un superpoder, serías el más poderoso.','Sos tan lento que las tortugas te pasan la derecha.','Sos la versión bootleg de una buena persona.'];
const MISTERIOS = ['¿Existe vida inteligente en otros planetas? 👽','¿Qué hay dentro de los agujeros negros? 🕳️','¿El universo es infinito o tiene un borde? 🌌','¿Somos una simulación? 💻','¿Qué pasó antes del Big Bang? 💥','¿Existe el libre albedrío o todo está predeterminado? 🎲','¿Hay otros universos paralelos? 🪞'];
const WYR = ['¿Poder volar o ser invisible?','¿Vivir 200 años sin internet o 80 años con todo?','¿Hablar todos los idiomas o tocar todos los instrumentos?','¿Saber la fecha de tu muerte o cómo vas a morir?','¿Tener dinero infinito o tiempo infinito?','¿Ser famoso o ser extremadamente rico en secreto?','¿Poder leer mentes o viajar en el tiempo?','¿Nunca sentir calor o nunca sentir frío?','¿Tener 10 amigos reales o 1 millón de seguidores?','¿Poder pausar el tiempo o rebobinarlo?'];
const SLOTS_ITEMS = ['🍒','🍋','🍊','🍇','💎','⭐','🎰'];
const HOROSCOPO = {
    aries:'♈ **Aries** — Hoy tendrás energía imparable. Úsala para empezar ese proyecto que postergás.',
    tauro:'♉ **Tauro** — Un día para disfrutar los placeres simples. Alguien cercano tiene buenas noticias.',
    geminis:'♊ **Géminis** — Tu mente está en modo turbo. Aprovechá para comunicarte y hacer nuevos contactos.',
    cancer:'♋ **Cáncer** — Las emociones están a flor de piel. Cuídate y no te olvides de los tuyos.',
    leo:'♌ **Leo** — El centro de atención te espera. Brillás naturalmente hoy.',
    virgo:'♍ **Virgo** — Organización y análisis son tu fuerte hoy. El trabajo da sus frutos.',
    libra:'♎ **Libra** — La armonía y el equilibrio reinan. Una relación importante se fortalece.',
    escorpio:'♏ **Escorpio** — Misterios por resolver. Tu intuición está afilada al máximo.',
    sagitario:'♐ **Sagitario** — La aventura llama. Una nueva experiencia está en el horizonte.',
    capricornio:'♑ **Capricornio** — El esfuerzo sostenido da resultados hoy. Paciencia y constancia.',
    acuario:'♒ **Acuario** — Innovación y creatividad al palo. El futuro se construye hoy.',
    piscis:'♓ **Piscis** — La sensibilidad y empatía son tus superpoderes. Alguien necesita tu apoyo.',
};

// ─── Ready ────────────────────────────────────────────────────────────────────
client.on('ready', async () => {
    console.log(`[ Bot ] ${client.user.tag} está online ✅`);

    const guild = client.guilds.cache.get(SERVER_ID);
    if (guild) {
        const role = guild.roles.cache.get(ROLE_ID);
        if (role) {
            setInterval(() => role.edit({ color: 'RANDOM' }).catch(() => {}), RAINBOW_MS);
            console.log(`[ Rainbow ] Cambia 2 veces/seg ✅`);
        } else {
            console.log(`[ Rainbow ] ⚠️ No se encontró el rol ${ROLE_ID}`);
        }

        try {
            await guild.commands.set([
                { name:'help',       description:'📋 Todos los comandos' },
                // Economía
                { name:'perfil',     description:'👤 Ver perfil', options:[{name:'usuario',type:6,description:'De quién',required:false}] },
                { name:'ranking',    description:'🏆 Top 10' },
                { name:'daily',      description:'🎁 Coins diarias' },
                { name:'work',       description:'💼 Trabajar (1h)' },
                { name:'slut',       description:'💋 Actividad arriesgada (30min)' },
                { name:'crime',      description:'🔫 Cometer un crimen (2h)' },
                { name:'dep',        description:'🏦 Depositar al banco', options:[{name:'cantidad',type:3,description:'Número o all',required:true}] },
                { name:'withdraw',   description:'🏦 Retirar del banco',  options:[{name:'cantidad',type:3,description:'Número o all',required:true}] },
                { name:'rob',        description:'🥷 Robarle a alguien',  options:[{name:'usuario',type:6,description:'A quién',required:true}] },
                // Diversión
                { name:'meme',       description:'😂 Meme en español' },
                { name:'animal',     description:'🐾 Animal aleatorio con dato en español' },
                { name:'dado',       description:'🎲 Tirar un dado', options:[{name:'caras',type:4,description:'Caras (default 6)',required:false}] },
                { name:'8ball',      description:'🎱 Bola mágica', options:[{name:'pregunta',type:3,description:'Tu pregunta',required:true}] },
                { name:'trivia',     description:'❓ Trivia (gana coins)' },
                { name:'coinflip',   description:'🪙 Cara o Cruz' },
                { name:'slots',      description:'🎰 Tragamonedas (gana coins)' },
                { name:'rps',        description:'✊ Piedra Papel Tijera', options:[{name:'eleccion',type:3,description:'piedra / papel / tijera',required:true}] },
                { name:'love',       description:'❤️ Compatibilidad amorosa', options:[{name:'usuario',type:6,description:'Con quién',required:true}] },
                { name:'rate',       description:'⭐ Calificar algo', options:[{name:'cosa',type:3,description:'Qué calificar',required:true}] },
                { name:'ship',       description:'💑 Shipear dos personas', options:[{name:'user1',type:6,description:'Persona 1',required:true},{name:'user2',type:6,description:'Persona 2',required:true}] },
                { name:'ship2',      description:'💘 Ship random del servidor' },
                { name:'pp',         description:'🍆 Medidor de PP', options:[{name:'usuario',type:6,description:'De quién',required:false}] },
                { name:'iq',         description:'🧠 Calculadora de IQ', options:[{name:'usuario',type:6,description:'De quién',required:false}] },
                { name:'tod',        description:'🎭 Verdad o Atrevido' },
                { name:'roast',      description:'🔥 Insultar a alguien', options:[{name:'usuario',type:6,description:'A quién',required:true}] },
                { name:'compliment', description:'💝 Elogiar a alguien', options:[{name:'usuario',type:6,description:'A quién',required:false}] },
                { name:'banana',     description:'🍌 Medidor de banana', options:[{name:'usuario',type:6,description:'De quién',required:false}] },
                { name:'hack',       description:'💻 Hackear a alguien (falso)', options:[{name:'usuario',type:6,description:'A quién',required:true}] },
                { name:'wyr',        description:'🤔 ¿Qué preferirías?' },
                { name:'chiste',     description:'😄 Chiste random' },
                { name:'horoscopo',  description:'🔮 Tu horóscopo', options:[{name:'signo',type:3,description:'Tu signo zodiacal',required:true}] },
                { name:'misterio',   description:'🌌 Pregunta misteriosa del universo' },
                { name:'impostor',   description:'🔴 ¿Quién es el impostor?' },
                { name:'consejo',    description:'🧙 Consejo de vida' },
                { name:'insulto',    description:'😤 Insulto creativo' },
                { name:'beso',       description:'😘 Beso a alguien', options:[{name:'usuario',type:6,description:'A quién',required:true}] },
                { name:'abrazo',     description:'🤗 Abrazo a alguien', options:[{name:'usuario',type:6,description:'A quién',required:true}] },
                { name:'slap',       description:'👋 Cachetear a alguien', options:[{name:'usuario',type:6,description:'A quién',required:true}] },
                { name:'cumplea',    description:'🎂 Cumpleaños random del servidor' },
                // Música
                { name:'play',   description:'▶️ Reproducir música', options:[{name:'cancion',type:3,description:'Nombre o URL',required:true}] },
                { name:'skip',   description:'⏭️ Saltar canción' },
                { name:'stop',   description:'⏹️ Detener música' },
                { name:'pause',  description:'⏸️ Pausar' },
                { name:'resume', description:'▶️ Reanudar' },
                { name:'queue',  description:'📋 Ver cola de música' },
                { name:'volume', description:'🔊 Cambiar volumen', options:[{name:'vol',type:4,description:'1-100',required:true}] },
                { name:'np',     description:'🎵 Qué está sonando ahora' },
            ]);
            console.log('[ Slash ] Comandos registrados ✅');
        } catch(e) { console.error('[ Slash ] Error:', e.message); }
    }

    client.user.setPresence({ status:'online', activities:[{ name:'!help | 🌈 x2/seg', type:'WATCHING' }] });
});

// ─── XP al chatear ────────────────────────────────────────────────────────────
client.on('messageCreate', async (message) => {
    if (message.author.bot || !message.guild) return;
    const uid = message.author.id, now = Date.now();
    if (!xpCooldown.has(uid) || now - xpCooldown.get(uid) > 60000) {
        xpCooldown.set(uid, now);
        const up = eco.addXP(uid, message.author.username, randInt(5,20), randInt(1,5));
        if (up) {
            const u = eco.getUser(uid);
            message.channel.send(`🎉 ¡Felicitaciones ${message.author}! Subiste al **nivel ${u.level}** 🆙`);
        }
    }
    if (!message.content.startsWith(PREFIX)) return;
    const args = message.content.slice(PREFIX.length).trim().split(/ +/);
    handleCommand(args.shift().toLowerCase(), args, message, null);
});

client.on('interactionCreate', async (interaction) => {
    if (!interaction.isCommand()) return;
    // Para slash, pasamos el objeto interaction directamente
    handleCommand(interaction.commandName, [], null, interaction);
});

// ─── Handler central ──────────────────────────────────────────────────────────
async function handleCommand(command, args, msg, inter) {
    const guild   = inter ? inter.guild   : msg?.guild;
    const member  = inter ? inter.member  : msg?.member;
    const author  = inter ? inter.user    : msg?.author;
    const channel = inter ? inter.channel : msg?.channel;

    // Función reply unificada
    const reply = async (content, embed = null) => {
        const payload = embed ? { embeds:[embed] } : { content: String(content) };
        try {
            if (inter) {
                if (inter.replied || inter.deferred) return inter.followUp(payload);
                return inter.reply(payload);
            }
            return channel.send(payload);
        } catch(e) { console.error('[ Reply ]', e.message); }
    };

    // Helpers para obtener opciones de slash o de mentions
    const getOpt = (name) => inter ? inter.options.getString(name)   : null;
    const getUser = (name) => inter ? inter.options.getUser(name)     : null;
    const getInt  = (name) => inter ? inter.options.getInteger(name)  : null;
    // Obtener usuario de mención (prefix) o slash
    const mentionOrOpt = (optName, fallback = null) => inter
        ? (inter.options.getUser(optName) || fallback)
        : (msg?.mentions?.users?.first() || fallback);
    // Segunda mención (prefix)
    const secondMention = () => {
        if (!msg?.mentions?.users) return null;
        const arr = Array.from(msg.mentions.users.values());
        return arr[1] || null;
    };

    const E = (title, desc, color='#7289DA') => new MessageEmbed().setTitle(title).setDescription(desc).setColor(color);
    const rnd = arr => arr[Math.floor(Math.random()*arr.length)];
    const randInt = (min, max) => Math.floor(Math.random()*(max-min+1))+min;

    // ── HELP ──────────────────────────────────────────────────────────────────
    if (command === 'help') {
        return reply(null, new MessageEmbed().setTitle('📋 Comandos disponibles').setColor('#FF69B4')
            .addField('🎵 Música',    '`!play` `!skip` `!stop` `!pause` `!resume` `!queue` `!volume` `!np`')
            .addField('😂 Diversión', '`!meme` `!animal` `!dado` `!8ball` `!trivia` `!coinflip` `!slots` `!rps` `!love` `!rate` `!ship` `!ship2` `!pp` `!iq` `!tod` `!roast` `!compliment` `!banana` `!hack` `!wyr` `!chiste` `!horoscopo` `!misterio` `!impostor` `!consejo` `!insulto` `!beso` `!abrazo` `!slap` `!cumplea`')
            .addField('💰 Economía',  '`!perfil` `!ranking` `!daily` `!work` `!slut` `!crime` `!rob` `!dep` `!withdraw`')
            .addField('🌈 Rainbow',   'Automático — cambia 2 veces por segundo')
            .setFooter({ text:'Usá / para slash commands | XP ganás chateando 💬' }));
    }

    // ── MÚSICA ────────────────────────────────────────────────────────────────
    if (command === 'play') {
        const vc = member?.voice?.channel;
        if (!vc) return reply('❌ Tenés que estar en un canal de voz primero.');
        const query = inter ? inter.options.getString('cancion') : args.join(' ').trim();
        if (!query) return reply('❌ Escribí el nombre o URL. Ej: `!play bohemian rhapsody`');
        if (inter) await inter.deferReply().catch(() => {});
        try {
            await distube.play(vc, query, { member, textChannel: channel });
            if (inter && !inter.replied) await inter.editReply(`🔍 Buscando: **${query}**...`).catch(() => {});
        } catch(e) {
            console.error('[ play ]', e.message);
            const msg = `❌ No pude reproducir eso.\n\`${String(e.message).slice(0,100)}\``;
            if (inter) { try { await inter.editReply(msg); } catch { await inter.followUp(msg).catch(()=>{}); } }
            else channel.send(msg);
        }
        return;
    }

    if (command === 'np') {
        const q = distube.getQueue(guild);
        if (!q) return reply('❌ No hay música reproduciéndose.');
        const s = q.songs[0];
        return reply(null, E('🎵 Sonando ahora',`**${s.name}**`,'#7289DA')
            .addField('Duración', s.formattedDuration, true)
            .addField('Pedido por', s.user?.username || '?', true));
    }

    if (command === 'skip')   { try { await distube.skip(guild);   return reply('⏭️ Canción saltada.'); }   catch { return reply('❌ No hay música.'); } }
    if (command === 'stop')   { try { await distube.stop(guild);   return reply('⏹️ Música detenida.'); }  catch { return reply('❌ No hay música.'); } }
    if (command === 'pause')  { try { distube.pause(guild);         return reply('⏸️ Pausada.'); }          catch { return reply('❌ No hay música.'); } }
    if (command === 'resume') { try { distube.resume(guild);        return reply('▶️ Reanudada.'); }        catch { return reply('❌ No hay música.'); } }

    if (command === 'volume') {
        const v = inter ? getInt('vol') : parseInt(args[0]);
        if (!v || v < 1 || v > 100) return reply('❌ Volumen entre 1 y 100.');
        try { distube.setVolume(guild, v); return reply(`🔊 Volumen: **${v}%**`); }
        catch { return reply('❌ No hay música reproduciéndose.'); }
    }

    if (command === 'queue') {
        const q = distube.getQueue(guild);
        if (!q?.songs?.length) return reply('📭 La cola está vacía.');
        return reply(null, new MessageEmbed().setTitle('🎵 Cola de música').setColor('#7289DA')
            .setDescription(q.songs.slice(0,15).map((s,i) =>
                `${i===0?'▶️ **Ahora:**':`**${i}.**`} ${s.name} \`${s.formattedDuration}\` — *${s.user?.username||'?'}*`
            ).join('\n')));
    }

    // ── DIVERSIÓN ─────────────────────────────────────────────────────────────
    if (command === 'meme') {
        for (let i = 0; i < 6; i++) {
            try {
                const d = await (await fetch(`https://meme-api.com/gimme/${rnd(MEME_SUBS)}`)).json();
                if (d.url && !d.nsfw && /\.(jpg|jpeg|png|gif)$/i.test(d.url))
                    return reply(null, new MessageEmbed().setTitle(d.title||'Meme').setImage(d.url).setColor('#FF6B6B').setFooter({text:`👍 ${d.ups||0} | r/${d.subreddit}`}));
            } catch { continue; }
        }
        return reply('❌ No pude obtener un meme ahora. Intentá de nuevo.');
    }

    if (command === 'animal') {
        const keys  = Object.keys(ANIMALES);
        const tipo  = rnd(keys);
        const data  = ANIMALES[tipo];
        const hecho = rnd(data.hechos);
        let imgUrl  = null;
        try {
            const res = await fetch(`https://some-random-api.com/animal/${data.api}`);
            const json = await res.json();
            imgUrl = json.image || null;
        } catch { /* imagen opcional */ }
        const embed = new MessageEmbed()
            .setTitle(`${data.emoji} ${tipo.replace('_',' ').replace(/\b\w/g, c => c.toUpperCase())}`)
            .setDescription(`📖 **Dato curioso:** ${hecho}`)
            .setColor('#4CAF50');
        if (imgUrl) embed.setImage(imgUrl);
        return reply(null, embed);
    }

    if (command === 'dado') {
        const c = (inter ? getInt('caras') : parseInt(args[0])) || 6;
        return reply(null, E('🎲 Dado',`Tiraste un **d${c}** y sacaste: **${randInt(1,c)}**`,'#F0A500'));
    }

    if (command === '8ball') {
        const q = inter ? inter.options.getString('pregunta') : args.join(' ').trim();
        if (!q) return reply('❌ Haceme una pregunta. Ej: `!8ball ¿Voy a ser rico?`');
        return reply(null, new MessageEmbed().setTitle('🎱 La bola mágica respondió...').addField('❓ Pregunta',q).addField('💬 Respuesta',rnd(BOLAS)).setColor('#6A0572'));
    }

    if (command === 'coinflip') {
        const r = Math.random() < 0.5;
        return reply(null, E('🪙 Cara o Cruz',`¡Salió **${r?'CARA 😎':'CRUZ 😬'}**!`, r?'#FFD700':'#9E9E9E'));
    }

    if (command === 'slots') {
        const s = [rnd(SLOTS_ITEMS), rnd(SLOTS_ITEMS), rnd(SLOTS_ITEMS)];
        const jackpot = s[0]===s[1] && s[1]===s[2];
        const two     = s[0]===s[1] || s[1]===s[2] || s[0]===s[2];
        let txt = '';
        if (jackpot) { eco.addCoins(author.id, author.username, 500); txt = '🎉 **¡JACKPOT!** Ganaste **500 coins** 🪙'; }
        else if (two){ eco.addCoins(author.id, author.username, 100); txt = '✨ Dos iguales. Ganaste **100 coins** 🪙'; }
        else           txt = '💸 Sin suerte esta vez...';
        return reply(null, E('🎰 Tragamonedas',`[ ${s[0]} | ${s[1]} | ${s[2]} ]\n\n${txt}`, jackpot?'#FFD700':two?'#4CAF50':'#E53935'));
    }

    if (command === 'rps') {
        const opts = ['piedra','papel','tijera'], em = {piedra:'✊',papel:'📄',tijera:'✂️'};
        const el   = (inter ? inter.options.getString('eleccion') : args[0] || '').toLowerCase();
        if (!opts.includes(el)) return reply('❌ Elegí: `piedra`, `papel` o `tijera`');
        const bot  = rnd(opts);
        const win  = (el==='piedra'&&bot==='tijera')||(el==='papel'&&bot==='piedra')||(el==='tijera'&&bot==='papel');
        const res  = el===bot ? '🤝 ¡Empate!' : win ? '🎉 ¡Ganaste!' : '😔 ¡Perdiste!';
        return reply(null, new MessageEmbed().setTitle('✊ Piedra Papel Tijera')
            .addField('Vos',em[el],true).addField('Yo',em[bot],true).addField('Resultado',res).setColor('#7289DA'));
    }

    if (command === 'love') {
        const target = mentionOrOpt('usuario');
        if (!target) return reply('❌ Mencioná a alguien. Ej: `!love @usuario`');
        const pct = randInt(0,100);
        const bar = '❤️'.repeat(Math.floor(pct/10)) + '🖤'.repeat(10-Math.floor(pct/10));
        return reply(null, E('❤️ Medidor de Amor',`**${author.username}** + **${target.username}**\n\n${bar}\n**${pct}%** ${pct>=80?'😍':pct>=50?'😊':pct>=30?'😐':'💔'}`,'#FF69B4'));
    }

    if (command === 'rate') {
        const cosa = inter ? inter.options.getString('cosa') : args.join(' ').trim() || 'eso';
        const nota = randInt(0,10);
        return reply(null, E('⭐ Calificación',`**${cosa}**\n${'⭐'.repeat(nota)+'☆'.repeat(10-nota)}\n**${nota}/10**`,'#FFD700'));
    }

    if (command === 'ship') {
        // FIX: No usar .at() en Collection - usar Array.from correctamente
        const u1 = inter ? inter.options.getUser('user1') : msg?.mentions?.users?.first();
        const u2 = inter ? inter.options.getUser('user2') : secondMention();
        if (!u1 || !u2) return reply('❌ Mencioná a dos personas. Ej: `!ship @user1 @user2`');
        const pct  = randInt(0,100);
        const name = u1.username.slice(0, Math.ceil(u1.username.length/2)) + u2.username.slice(Math.floor(u2.username.length/2));
        const desc = pct>=80?'💞 ¡Almas gemelas!':pct>=60?'💕 Buena onda':pct>=40?'😊 Hay potencial':pct>=20?'🤔 Tal vez...':'💔 No funciona';
        return reply(null, E('💑 Ship',`**${u1.username}** 💗 **${u2.username}**\nShip: **${name}** | **${pct}%** — ${desc}`,'#FF69B4'));
    }

    if (command === 'ship2') {
        const members = Array.from(guild?.members?.cache?.filter(m => !m.user.bot)?.values() || []);
        if (members.length < 2) return reply('❌ No hay suficientes miembros.');
        const a = rnd(members), b = rnd(members.filter(m => m.id !== a.id));
        const pct = randInt(0,100);
        return reply(null, E('💘 Ship Random',`**${a.user.username}** 💗 **${b.user.username}**\n**${pct}%** ${pct>=70?'😍 ¡Enamorados!':'🤷 A ver cómo sale'}`,'#E91E63'));
    }

    if (command === 'pp') {
        const t  = mentionOrOpt('usuario', author);
        const sz = randInt(0,15);
        return reply(null, E('🍆 Medidor de PP',`**${t.username}**\n\n\`8${'='.repeat(sz)}D\`\n**${sz} cm**`,'#7CB342'));
    }

    if (command === 'iq') {
        const t  = mentionOrOpt('usuario', author);
        const iq = randInt(20,200);
        const d  = iq>=160?'🧬 Genio absoluto':iq>=130?'🧠 Muy inteligente':iq>=100?'😎 Promedio inteligente':iq>=80?'😅 Un poco despistado':'🥔 La papa tiene más IQ';
        return reply(null, E('🧠 Calculadora de IQ',`**${t.username}** tiene un IQ de **${iq}**\n${d}`,'#5C6BC0'));
    }

    if (command === 'tod') {
        const esV = Math.random() < 0.5;
        return reply(null, E(esV?'🎭 ¡Verdad!':'🎭 ¡Atrevido!', rnd(esV?VERDADES:ATREVIDOS), esV?'#2196F3':'#FF5722'));
    }

    if (command === 'roast') {
        const t = mentionOrOpt('usuario');
        if (!t) return reply('❌ Mencioná a alguien. Ej: `!roast @usuario`');
        return reply(null, E(`🔥 Roast para ${t.username}`, rnd(ROASTS),'#E53935'));
    }

    if (command === 'compliment') {
        const t = mentionOrOpt('usuario', author);
        return reply(null, E(`💝 Elogio para ${t.username}`, rnd(COMPLIMENTS),'#E91E63'));
    }

    if (command === 'banana') {
        const t  = mentionOrOpt('usuario', author);
        const sz = randInt(0,20);
        return reply(null, E('🍌 Medidor de Banana',`**${t.username}**\n\n${'🍌'.repeat(Math.max(1,Math.ceil(sz/3)))}\n**${sz} cm**`,'#FFD600'));
    }

    if (command === 'hack') {
        const t = mentionOrOpt('usuario');
        if (!t) return reply('❌ Mencioná a alguien. Ej: `!hack @usuario`');
        // FIX: siempre usamos channel.send para el efecto animado, reply solo para acusar recibo
        if (inter) await inter.reply({ content: `💻 Iniciando hack a **${t.username}**...` }).catch(() => {});
        const pasos = [
            `💻 Iniciando hack a **${t.username}**...`,
            '🔍 Escaneando puertos abiertos...',
            '🔑 Crackeando contraseña...',
            '📡 Bypaseando firewall...',
            '🗄️ Accediendo a base de datos...',
            `✅ **${t.username}** hackeado! IP: \`192.168.${randInt(1,254)}.${randInt(1,254)}\` | Pass: \`hunter${randInt(1000,9999)}\` 💀`,
        ];
        const sent = await channel.send(pasos[0]).catch(() => null);
        if (!sent) return;
        let i = 0;
        const iv = setInterval(async () => {
            i++;
            if (i < pasos.length) { try { await sent.edit(pasos[i]); } catch {} }
            else clearInterval(iv);
        }, 1200);
        return;
    }

    if (command === 'wyr') {
        return reply(null, E('🤔 ¿Qué preferirías?', rnd(WYR),'#9C27B0').setFooter({text:'Respondé en el chat!'}));
    }

    if (command === 'chiste') {
        return reply(null, E('😄 Chiste del día', rnd(CHISTES),'#FF9800'));
    }

    if (command === 'horoscopo') {
        // FIX: obtener el signo correctamente tanto de slash como de prefix
        const raw  = (inter ? inter.options.getString('signo') : args[0] || '').toLowerCase()
                        .normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim();
        const desc = HOROSCOPO[raw];
        if (!desc) return reply('❌ Signo no válido. Usá: `aries`, `tauro`, `geminis`, `cancer`, `leo`, `virgo`, `libra`, `escorpio`, `sagitario`, `capricornio`, `acuario`, `piscis`');
        return reply(null, E('🔮 Horóscopo', desc,'#7B1FA2').setFooter({text:'Solo por diversión 😄'}));
    }

    if (command === 'misterio') {
        return reply(null, E('🌌 Misterio del Universo', rnd(MISTERIOS),'#1A237E').setFooter({text:'¿Qué pensás vos?'}));
    }

    if (command === 'impostor') {
        const members = Array.from(guild?.members?.cache?.filter(m => !m.user.bot)?.values() || []);
        if (!members.length) return reply('❌ No hay miembros.');
        const imp = rnd(members);
        return reply(null, E('🔴 ¡El impostor es...!',`**${imp.user.username}** es el impostor 🔪\n\n*Voten para expulsarlo.*`,'#C62828').setFooter({text:'Es solo un juego! 😄'}));
    }

    if (command === 'consejo') {
        return reply(null, E('🧙 Consejo de Vida', rnd(CONSEJOS),'#00897B'));
    }

    if (command === 'insulto') {
        return reply(null, E('😤 Insulto Creativo', rnd(INSULTOS),'#B71C1C').setFooter({text:'¡Es solo por diversión!'}));
    }

    if (command === 'beso') {
        const t    = mentionOrOpt('usuario');
        if (!t) return reply('❌ Mencioná a alguien. Ej: `!beso @usuario`');
        const gifs = ['https://media.giphy.com/media/G3va31oEEnIkM/giphy.gif','https://media.giphy.com/media/zkppEMFvRX5FC/giphy.gif'];
        return reply(null, new MessageEmbed().setTitle('😘 ¡Beso!').setDescription(`**${author.username}** le dio un beso a **${t.username}** 💋`).setImage(rnd(gifs)).setColor('#E91E63'));
    }

    if (command === 'abrazo') {
        const t    = mentionOrOpt('usuario');
        if (!t) return reply('❌ Mencioná a alguien. Ej: `!abrazo @usuario`');
        const gifs = ['https://media.giphy.com/media/3M4NpbLCTxBqU/giphy.gif','https://media.giphy.com/media/lrr9rHuoJOE0w/giphy.gif'];
        return reply(null, new MessageEmbed().setTitle('🤗 ¡Abrazo!').setDescription(`**${author.username}** le dio un abrazo a **${t.username}** 🤗`).setImage(rnd(gifs)).setColor('#FF9800'));
    }

    if (command === 'slap') {
        const t    = mentionOrOpt('usuario');
        if (!t) return reply('❌ Mencioná a alguien. Ej: `!slap @usuario`');
        const gifs = ['https://media.giphy.com/media/Zau0yrl17uzdK/giphy.gif','https://media.giphy.com/media/uqSU9IEYEKAbS/giphy.gif'];
        return reply(null, new MessageEmbed().setTitle('👋 ¡Cachetazo!').setDescription(`**${author.username}** le pegó una cachetada a **${t.username}** 💥`).setImage(rnd(gifs)).setColor('#FF5722'));
    }

    if (command === 'cumplea') {
        const members = Array.from(guild?.members?.cache?.filter(m => !m.user.bot)?.values() || []);
        if (!members.length) return reply('❌ No hay miembros.');
        const h = rnd(members);
        return reply(null, E('🎂 ¡Feliz Cumpleaños!',`¡Hoy es el cumpleaños de **${h.user.username}**! 🎉🎁🎈`,'#FF69B4').setFooter({text:'Esto es random, puede no ser verdad 😄'}));
    }

    if (command === 'trivia') {
        const q = rnd(TRIVIA);
        await reply(`❓ **Trivia:** ${q.p}\n*(Tenés 15 segundos para responder)*`);
        const col = channel.createMessageCollector({ filter: m => !m.author.bot, time: 15000 });
        let ok = false;
        col.on('collect', m => {
            if (m.content.toLowerCase().includes(q.r)) {
                ok = true;
                eco.addCoins(m.author.id, m.author.username, 50);
                channel.send(`✅ ¡Correcto, ${m.author}! Era **${q.r.charAt(0).toUpperCase()+q.r.slice(1)}**. 💰 +50 coins!`);
                col.stop();
            }
        });
        col.on('end', () => { if (!ok) channel.send(`⏰ Tiempo. Era **${q.r.charAt(0).toUpperCase()+q.r.slice(1)}**.`); });
        return;
    }

    // ── ECONOMÍA ──────────────────────────────────────────────────────────────
    if (command === 'perfil') {
        const t    = mentionOrOpt('usuario', author);
        const u    = eco.getUser(t.id, t.username);
        const need = eco.xpNeeded(u.level);
        return reply(null, new MessageEmbed()
            .setTitle(`👤 Perfil de ${t.username}`)
            .setThumbnail(t.displayAvatarURL({ dynamic:true }))
            .setColor('#FFD700')
            .addField('👛 Billetera', `${u.coins} 🪙`,             true)
            .addField('🏦 Banco',     `${u.banco||0} 🪙`,          true)
            .addField('💎 Total',     `${u.coins+(u.banco||0)} 🪙`, true)
            .addField('⭐ XP',        `${u.xp} / ${need}`,         true)
            .addField('🆙 Nivel',     `${u.level}`,                 true)
            .addField('📊 Progreso',  barProgress(u.xp, need))
            .setFooter({ text:'Ganás XP y coins chateando' }));
    }

    if (command === 'ranking') {
        const top = eco.getTop(10);
        if (!top.length) return reply('📭 No hay datos aún.');
        return reply(null, new MessageEmbed().setTitle('🏆 Top 10').setColor('#FFD700')
            .setDescription(top.map((u,i) =>
                `${i===0?'🥇':i===1?'🥈':i===2?'🥉':`**${i+1}.**`} **${u.username}** — Nv.${u.level} | 💰${u.coins+(u.banco||0)}`
            ).join('\n')));
    }

    if (command === 'daily') {
        const r = eco.claimDaily(author.id, author.username);
        if (r.success) return reply(null, E('🎁 Daily reclamado!',`+**${r.amount} coins** 🪙\nBilletera: **${r.total}**`,'#00C851').setFooter({text:'Volvé mañana'}));
        return reply(`⏰ Volvé en **${fmtTime(r.remaining)}**.`);
    }

    if (command === 'work') {
        const r = eco.doWork(author.id, author.username);
        if (!r.success) return reply(`⏰ Volvé en **${fmtTime(r.remaining)}**.`);
        return reply(null, E('💼 ¡Trabajo completado!',`${r.job.verb}\n\n+**${r.earned} coins** 💰`,'#4CAF50')
            .addField('👛 Billetera',`${r.total}`,true).setFooter({text:'Volvé en 1 hora'}));
    }

    if (command === 'slut') {
        const r = eco.doSlut(author.id, author.username);
        if (!r.success) return reply(`⏰ Volvé en **${fmtTime(r.remaining)}**.`);
        return reply(null, E(r.win?'💋 ¡Saliste bien!':'💋 No salió bien...', r.msg, r.win?'#FF69B4':'#E53935')
            .addField(r.win?'💰 Ganaste':'💸 Perdiste',`${r.amount}`,true)
            .addField('👛 Total',`${r.total}`,true).setFooter({text:'Volvé en 30 min'}));
    }

    if (command === 'crime') {
        const r = eco.doCrime(author.id, author.username);
        if (!r.success) return reply(`⏰ Volvé en **${fmtTime(r.remaining)}**.`);
        return reply(null, E(r.win?'🔫 ¡Crimen exitoso!':'🔫 ¡Te atraparon!', r.msg, r.win?'#B71C1C':'#E53935')
            .addField(r.win?'💰 Ganaste':'💸 Perdiste',`${r.amount}`,true)
            .addField('👛 Total',`${r.total}`,true).setFooter({text:'Volvé en 2 horas'}));
    }

    if (command === 'dep') {
        const amt = inter ? inter.options.getString('cantidad') : args.join(' ').trim();
        const r   = eco.deposit(author.id, author.username, amt);
        if (!r.success && r.reason==='invalid') return reply('❌ Escribí una cantidad válida o `all`. Ej: `!dep 500`');
        if (!r.success && r.reason==='broke')   return reply(`❌ Solo tenés **${r.have}** coins en billetera.`);
        return reply(null, E('🏦 Depósito realizado',`Depositaste **${r.amount} coins** al banco 💰`,'#1565C0')
            .addField('👛 Billetera',`${r.coins}`,true).addField('🏦 Banco',`${r.banco}`,true));
    }

    if (command === 'withdraw') {
        const amt = inter ? inter.options.getString('cantidad') : args.join(' ').trim();
        const r   = eco.withdraw(author.id, author.username, amt);
        if (!r.success && r.reason==='invalid') return reply('❌ Escribí una cantidad válida o `all`. Ej: `!withdraw 500`');
        if (!r.success && r.reason==='broke')   return reply(`❌ Solo tenés **${r.have}** coins en el banco.`);
        return reply(null, E('🏦 Retiro realizado',`Retiraste **${r.amount} coins** del banco 💸`,'#1565C0')
            .addField('👛 Billetera',`${r.coins}`,true).addField('🏦 Banco',`${r.banco}`,true));
    }

    if (command === 'rob') {
        const t = mentionOrOpt('usuario');
        if (!t)              return reply('❌ Mencioná a quien querés robar. Ej: `!rob @usuario`');
        if (t.id===author.id) return reply('❌ No podés robarte a vos mismo 😂');
        if (t.bot)            return reply('❌ No podés robarle a un bot.');
        const r = eco.doRob(author.id, author.username, t.id, t.username);
        if (!r.success && r.type==='cooldown') return reply(`⏰ Esperá **${fmtTime(r.remaining)}**.`);
        if (!r.success && r.type==='poor')     return reply(`❌ **${r.targetName}** tiene menos de 100 coins, no vale la pena.`);
        return reply(null, E(
            r.win?'🥷 ¡Robo exitoso!':'🥷 ¡Te agarraron!',
            r.win?`Le robaste **${r.amount} coins** a **${r.targetName}** 😈`:`Intentaste robarle a **${r.targetName}** y te agarraron. Multa: **${r.fine} coins** 🚔`,
            r.win?'#FF6F00':'#E53935'
        ).addField('👛 Billetera',`${r.total}`,true).setFooter({text:'Volvé en 1 hora'}));
    }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function fmtTime(ms) {
    const h=Math.floor(ms/3600000), m=Math.floor((ms%3600000)/60000), s=Math.floor((ms%60000)/1000);
    return h>0?`${h}h ${m}m`:m>0?`${m}m ${s}s`:`${s}s`;
}
function randInt(min, max) { return Math.floor(Math.random()*(max-min+1))+min; }
function barProgress(cur, tot) {
    if (!tot) return '░'.repeat(10)+' 0%';
    const p = Math.min(Math.floor((cur/tot)*10),10);
    return '█'.repeat(p)+'░'.repeat(10-p)+` ${Math.floor((cur/tot)*100)}%`;
}

keepAlive();
client.login(TOKEN);
