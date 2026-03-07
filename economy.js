const fs = require('fs');
const PATH = './data.json';

function load() {
    if (!fs.existsSync(PATH)) { fs.writeFileSync(PATH, JSON.stringify({})); return {}; }
    try { return JSON.parse(fs.readFileSync(PATH, 'utf8')); } catch { return {}; }
}
function save(data) { fs.writeFileSync(PATH, JSON.stringify(data, null, 2)); }

const DEFAULT = (username = 'Desconocido') => ({
    username, coins: 0, banco: 0, xp: 0, level: 1,
    lastDaily: 0, lastWork: 0, lastSlut: 0, lastCrime: 0, lastRob: 0
});

function getUser(userId, username = 'Desconocido') {
    const data = load();
    if (!data[userId]) { data[userId] = DEFAULT(username); save(data); }
    // Migrar campos viejos
    const u = data[userId];
    if (u.banco    === undefined) u.banco    = 0;
    if (!u.lastWork)  u.lastWork  = 0;
    if (!u.lastSlut)  u.lastSlut  = 0;
    if (!u.lastCrime) u.lastCrime = 0;
    if (!u.lastRob)   u.lastRob   = 0;
    save(data);
    return data[userId];
}

function xpNeeded(level) { return level * 100; }

function addXP(userId, username, xpAmt, coinsAmt) {
    const data = load();
    if (!data[userId]) data[userId] = DEFAULT(username);
    const u = data[userId];
    u.username = username;
    u.xp     += xpAmt;
    u.coins  += coinsAmt;
    let leveledUp = false;
    while (u.xp >= xpNeeded(u.level)) { u.xp -= xpNeeded(u.level); u.level++; leveledUp = true; }
    data[userId] = u; save(data);
    return leveledUp;
}

function addCoins(userId, username, amount) {
    const data = load();
    if (!data[userId]) data[userId] = DEFAULT(username);
    data[userId].username = username;
    data[userId].coins = (data[userId].coins || 0) + amount;
    save(data);
    return data[userId].coins;
}

// ─── Banco ────────────────────────────────────────────────────────────────────
function deposit(userId, username, amount) {
    const data = load();
    if (!data[userId]) data[userId] = DEFAULT(username);
    const u = data[userId];
    if (amount === 'all') amount = u.coins;
    amount = parseInt(amount);
    if (isNaN(amount) || amount <= 0) return { success: false, reason: 'invalid' };
    if (u.coins < amount) return { success: false, reason: 'broke', have: u.coins };
    u.coins -= amount;
    u.banco  = (u.banco || 0) + amount;
    data[userId] = u; save(data);
    return { success: true, amount, coins: u.coins, banco: u.banco };
}

function withdraw(userId, username, amount) {
    const data = load();
    if (!data[userId]) data[userId] = DEFAULT(username);
    const u = data[userId];
    if (amount === 'all') amount = u.banco || 0;
    amount = parseInt(amount);
    if (isNaN(amount) || amount <= 0) return { success: false, reason: 'invalid' };
    if ((u.banco || 0) < amount) return { success: false, reason: 'broke', have: u.banco || 0 };
    u.banco  = (u.banco || 0) - amount;
    u.coins += amount;
    data[userId] = u; save(data);
    return { success: true, amount, coins: u.coins, banco: u.banco };
}

// ─── Daily ────────────────────────────────────────────────────────────────────
function claimDaily(userId, username) {
    const data = load();
    if (!data[userId]) data[userId] = DEFAULT(username);
    const u = data[userId]; const now = Date.now(); const CD = 86400000;
    if (now - (u.lastDaily || 0) < CD) return { success: false, remaining: CD - (now - u.lastDaily) };
    const amount = Math.floor(Math.random() * 201) + 100;
    u.coins += amount; u.lastDaily = now; u.username = username;
    data[userId] = u; save(data);
    return { success: true, amount, total: u.coins };
}

// ─── Work (1h) ────────────────────────────────────────────────────────────────
const WORK_JOBS = [
    { job: 'programador',       verb: 'Programaste toda la noche 💻',           min: 200, max: 400 },
    { job: 'repartidor',        verb: 'Repartiste pizzas bajo la lluvia 🍕',     min: 100, max: 250 },
    { job: 'streamer',          verb: 'Hiciste stream 8 horas seguidas 🎮',      min: 150, max: 350 },
    { job: 'youtuber',          verb: 'Subiste un video que se hizo viral 📹',   min: 100, max: 500 },
    { job: 'mecánico',          verb: 'Arreglaste 3 autos en el taller 🔧',      min: 200, max: 450 },
    { job: 'cocinero',          verb: 'Trabajaste en el restaurante 👨‍🍳',         min: 150, max: 300 },
    { job: 'conductor de Uber', verb: 'Manejaste 12 horas seguidas 🚗',          min: 120, max: 280 },
    { job: 'minero',            verb: 'Minaste recursos todo el día ⛏️',          min: 180, max: 380 },
    { job: 'enfermero',         verb: 'Hiciste un turno doble en el hospital 🏥', min: 200, max: 420 },
    { job: 'DJ',                verb: 'Tocaste en una fiesta toda la noche 🎧',  min: 250, max: 500 },
];
function doWork(userId, username) {
    const data = load();
    if (!data[userId]) data[userId] = DEFAULT(username);
    const u = data[userId]; const now = Date.now(); const CD = 3600000;
    if (now - (u.lastWork || 0) < CD) return { success: false, remaining: CD - (now - u.lastWork) };
    const job    = WORK_JOBS[Math.floor(Math.random() * WORK_JOBS.length)];
    const earned = Math.floor(Math.random() * (job.max - job.min + 1)) + job.min;
    u.coins += earned; u.lastWork = now; u.username = username;
    data[userId] = u; save(data);
    return { success: true, earned, total: u.coins, job };
}

// ─── Slut (30min, 65%) ────────────────────────────────────────────────────────
const SLUT_WIN  = ['Bailaste en un club toda la noche 💃','Hiciste de modelo en una sesión de fotos 📸','Cantaste en una esquina y juntaste propinas 🎤','Hiciste de extra en una película 🎬','Ganaste un concurso de belleza 👑'];
const SLUT_LOSE = ['Te agarró la policía y te multaron 🚓','Te resbalaste en el escenario 😬','El cliente canceló sin pagar 😡','Llegaste tarde y te echaron 😤'];
function doSlut(userId, username) {
    const data = load();
    if (!data[userId]) data[userId] = DEFAULT(username);
    const u = data[userId]; const now = Date.now(); const CD = 1800000;
    if (now - (u.lastSlut || 0) < CD) return { success: false, remaining: CD - (now - u.lastSlut) };
    const win = Math.random() < 0.65;
    const amt  = win ? Math.floor(Math.random()*301)+200 : Math.floor(Math.random()*151)+50;
    u.coins    = win ? u.coins + amt : Math.max(0, u.coins - amt);
    u.lastSlut = now; u.username = username; data[userId] = u; save(data);
    const msg  = win ? SLUT_WIN[Math.floor(Math.random()*SLUT_WIN.length)] : SLUT_LOSE[Math.floor(Math.random()*SLUT_LOSE.length)];
    return { success: true, win, amount: amt, msg, total: u.coins };
}

// ─── Crime (2h, 45%) ──────────────────────────────────────────────────────────
const CRIME_WIN  = ['Hackeaste una base de datos corporativa 💻','Asaltaste un banco con tu pandilla 🏦','Vendiste información clasificada 🕵️','Robaste un auto de lujo y lo vendiste 🚗','Estafa millonaria de criptomonedas 📈'];
const CRIME_LOSE = ['Te atrapó la policía y perdiste todo 🚨','Tu cómplice te traicionó 🔪','La alarma sonó, huiste sin nada 🚨','Las cámaras te identificaron 📹'];
function doCrime(userId, username) {
    const data = load();
    if (!data[userId]) data[userId] = DEFAULT(username);
    const u = data[userId]; const now = Date.now(); const CD = 7200000;
    if (now - (u.lastCrime || 0) < CD) return { success: false, remaining: CD - (now - u.lastCrime) };
    const win = Math.random() < 0.45;
    const amt  = win ? Math.floor(Math.random()*1001)+500 : Math.floor(Math.random()*401)+100;
    u.coins     = win ? u.coins + amt : Math.max(0, u.coins - amt);
    u.lastCrime = now; u.username = username; data[userId] = u; save(data);
    const msg   = win ? CRIME_WIN[Math.floor(Math.random()*CRIME_WIN.length)] : CRIME_LOSE[Math.floor(Math.random()*CRIME_LOSE.length)];
    return { success: true, win, amount: amt, msg, total: u.coins };
}

// ─── Rob (1h, 40%) ────────────────────────────────────────────────────────────
function doRob(robberId, robberName, targetId, targetName) {
    const data = load();
    if (!data[robberId]) data[robberId] = DEFAULT(robberName);
    if (!data[targetId])  data[targetId]  = DEFAULT(targetName);
    const robber = data[robberId]; const target = data[targetId];
    const now = Date.now(); const CD = 3600000;
    if (now - (robber.lastRob || 0) < CD) return { success: false, type: 'cooldown', remaining: CD - (now - robber.lastRob) };
    if (target.coins < 100) return { success: false, type: 'poor', targetName };
    const win    = Math.random() < 0.40;
    const maxRob = Math.floor(target.coins * 0.30);
    const amount = Math.max(50, Math.floor(Math.random() * maxRob));
    const fine   = Math.floor(Math.random() * 201) + 100;
    if (win) { robber.coins += amount; target.coins = Math.max(0, target.coins - amount); }
    else     { robber.coins = Math.max(0, robber.coins - fine); }
    robber.lastRob = now; robber.username = robberName;
    data[robberId] = robber; data[targetId] = target; save(data);
    return { success: true, win, amount, fine, targetName, total: robber.coins };
}

function getTop(limit = 10) {
    const data = load();
    return Object.values(data).sort((a, b) => b.level - a.level || b.xp - a.xp).slice(0, limit);
}

module.exports = { getUser, addXP, addCoins, claimDaily, doWork, doSlut, doCrime, doRob, deposit, withdraw, getTop, xpNeeded };
