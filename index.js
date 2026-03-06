const { Client, Intents } = require('discord.js'); // FIX 1: Removido 'version' sin uso. FIX 2: Importado 'Intents'
const { 
    token, 
    serverID, 
    roleID, 
    interval 
} = require('./config.json');

// FIX 2: Se agregan los Intents necesarios para que el cache de guilds y roles funcione correctamente en discord.js v12.2+
const bot = new Client({ 
    ws: { 
        intents: new Intents(['GUILDS']) 
    } 
});

bot.on("ready", async () => {
    console.log(`[ Client ] ${bot.user.tag} Is Now Online`);

    let guild = bot.guilds.cache.get(serverID);
    // FIX 3: throw new Error() en lugar de throw "string" (mala práctica)
    if (!guild) throw new Error(`[ Error ] Didn't Find Any Server : ${serverID}`);

    // FIX 4: Renombrado 'u' a 'r' ya que es un Role, no un User
    let role = guild.roles.cache.find(r => r.id === roleID);
    if (!role) throw new Error(`[ Error ] Didn't Find Any Role, Server Name: ${guild.name}`);

    // FIX 6+7: interval en config.json ahora es número. Aquí se parsea por seguridad adicional
    const intervalMs = parseInt(interval);
    if (intervalMs < 60000) console.log(`\n[!!!] Enjoy Your Rainbow Roles`);

    setInterval(() => {
        role.edit({ color: 'RANDOM' }).catch(err => console.log(`[ Error ] An error occurred during the role change.`));
    }, intervalMs); // FIX 6: Usar intervalMs (número garantizado)

    // FIX 5: Se agrega await para capturar correctamente errores de setPresence
    await bot.user.setPresence({
        status: 'dnd',
        activity: {
            name: 'Roles Color Changer',
            type: 'WATCHING',
        }
    }).catch(err => console.log(`[ Error ] Could not set presence: ${err.message}`));
});

bot.login(token);
