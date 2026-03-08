const fs   = require('fs');
const PATH = './data.json';

function load() {
    if (!fs.existsSync(PATH)) { fs.writeFileSync(PATH, '{}'); return {}; }
    try { return JSON.parse(fs.readFileSync(PATH, 'utf8')); } catch { return {}; }
}
function save(d) { fs.writeFileSync(PATH, JSON.stringify(d, null, 2)); }

const DEFAULT = (u = 'Desconocido') => ({
    username: u, coins: 0, banco: 0, xp: 0, level: 1,
    lastDaily: 0, lastWork: 0, lastSlut: 0, lastCrime: 0, lastRob: 0,
    lastBeg: 0, lastDuel: 0, lastHeist: 0, lastSpin: 0,
    wins: 0, losses: 0, totalEarned: 0,
});

function getUser(userId, username = 'Desconocido') {
    const data = load();
    if (!data[userId]) { data[userId] = DEFAULT(username); save(data); }
    const u = data[userId];
    // migrar campos nuevos si no existen
    const campos = ['banco','lastWork','lastSlut','lastCrime','lastRob','lastBeg','lastDuel','lastHeist','lastSpin','wins','losses','totalEarned'];
    campos.forEach(c => { if (u[c] === undefined) u[c] = 0; });
    save(data);
    return data[userId];
}

function xpNeeded(level) { return level * 100; }

function addXP(userId, username, xpAmt, coinsAmt) {
    const data = load();
    if (!data[userId]) data[userId] = DEFAULT(username);
    const u = data[userId];
    u.username = username; u.xp += xpAmt; u.coins += coinsAmt;
    let up = false;
    while (u.xp >= xpNeeded(u.level)) { u.xp -= xpNeeded(u.level); u.level++; up = true; }
    data[userId] = u; save(data); return up;
}

function addCoins(userId, username, amount) {
    const data = load();
    if (!data[userId]) data[userId] = DEFAULT(username);
    data[userId].username = username;
    data[userId].coins = (data[userId].coins || 0) + amount;
    if (amount > 0) data[userId].totalEarned = (data[userId].totalEarned||0) + amount;
    save(data); return data[userId].coins;
}

function removeCoins(userId, username, amount) {
    const data = load();
    if (!data[userId]) data[userId] = DEFAULT(username);
    data[userId].coins = Math.max(0, (data[userId].coins||0) - amount);
    save(data); return data[userId].coins;
}

// ─── Banco ────────────────────────────────────────────────────────────────────
function deposit(userId, username, amount) {
    const data = load();
    if (!data[userId]) data[userId] = DEFAULT(username);
    const u = data[userId];
    if (amount === 'all') amount = u.coins;
    amount = parseInt(amount);
    if (isNaN(amount) || amount <= 0) return { success:false, reason:'invalid' };
    if (u.coins < amount) return { success:false, reason:'broke', have:u.coins };
    u.coins -= amount; u.banco = (u.banco||0) + amount;
    data[userId] = u; save(data);
    return { success:true, amount, coins:u.coins, banco:u.banco };
}

function withdraw(userId, username, amount) {
    const data = load();
    if (!data[userId]) data[userId] = DEFAULT(username);
    const u = data[userId];
    if (amount === 'all') amount = u.banco||0;
    amount = parseInt(amount);
    if (isNaN(amount) || amount <= 0) return { success:false, reason:'invalid' };
    if ((u.banco||0) < amount) return { success:false, reason:'broke', have:u.banco||0 };
    u.banco = (u.banco||0) - amount; u.coins += amount;
    data[userId] = u; save(data);
    return { success:true, amount, coins:u.coins, banco:u.banco };
}

// ─── Daily ────────────────────────────────────────────────────────────────────
function claimDaily(userId, username) {
    const data = load(); if (!data[userId]) data[userId] = DEFAULT(username);
    const u = data[userId], now = Date.now(), CD = 86400000;
    if (now - (u.lastDaily||0) < CD) return { success:false, remaining: CD-(now-u.lastDaily) };
    const amount = Math.floor(Math.random()*201)+100;
    u.coins += amount; u.lastDaily = now; u.username = username; u.totalEarned=(u.totalEarned||0)+amount;
    data[userId]=u; save(data); return { success:true, amount, total:u.coins };
}

// ─── Work (1h) ────────────────────────────────────────────────────────────────
const WORK_JOBS = [
    {verb:'Programaste toda la noche 💻',          min:200, max:400},
    {verb:'Repartiste pizzas bajo la lluvia 🍕',    min:100, max:250},
    {verb:'Hiciste stream 8 horas seguidas 🎮',     min:150, max:350},
    {verb:'Subiste un video que se hizo viral 📹',  min:100, max:500},
    {verb:'Arreglaste 3 autos en el taller 🔧',     min:200, max:450},
    {verb:'Trabajaste en el restaurante 👨‍🍳',        min:150, max:300},
    {verb:'Manejaste 12 horas de Uber 🚗',          min:120, max:280},
    {verb:'Minaste recursos todo el día ⛏️',         min:180, max:380},
    {verb:'Hiciste turno doble en el hospital 🏥',  min:200, max:420},
    {verb:'Tocaste en una fiesta toda la noche 🎧', min:250, max:500},
    {verb:'Diseñaste una web para un cliente 🖥️',   min:300, max:600},
    {verb:'Diste clases particulares todo el día 📚',min:150,max:350},
    {verb:'Tradujiste documentos 12 horas 📄',      min:180, max:400},
    {verb:'Vendiste merch en la feria 🛍️',          min:100, max:300},
];
function doWork(userId, username) {
    const data = load(); if (!data[userId]) data[userId] = DEFAULT(username);
    const u = data[userId], now = Date.now(), CD = 3600000;
    if (now-(u.lastWork||0) < CD) return { success:false, remaining:CD-(now-u.lastWork) };
    const job = WORK_JOBS[Math.floor(Math.random()*WORK_JOBS.length)];
    const earned = Math.floor(Math.random()*(job.max-job.min+1))+job.min;
    u.coins += earned; u.lastWork = now; u.username = username; u.totalEarned=(u.totalEarned||0)+earned;
    data[userId]=u; save(data); return { success:true, earned, total:u.coins, job };
}

// ─── Slut (30min, 65%) ───────────────────────────────────────────────────────
const SLUT_WIN  = ['Bailaste en un club toda la noche 💃','Hiciste de modelo en una sesión de fotos 📸','Cantaste en una esquina y juntaste propinas 🎤','Hiciste de extra en una película 🎬','Ganaste un concurso de belleza 👑'];
const SLUT_LOSE = ['Te agarró la policía y te multaron 🚓','Te resbalaste en el escenario 😬','El cliente canceló sin pagar 😡','Llegaste tarde y te echaron 😤'];
function doSlut(userId, username) {
    const data = load(); if (!data[userId]) data[userId] = DEFAULT(username);
    const u = data[userId], now = Date.now(), CD = 1800000;
    if (now-(u.lastSlut||0) < CD) return { success:false, remaining:CD-(now-u.lastSlut) };
    const win = Math.random()<0.65;
    const amt  = win ? Math.floor(Math.random()*301)+200 : Math.floor(Math.random()*151)+50;
    u.coins    = win ? u.coins+amt : Math.max(0,u.coins-amt);
    u.lastSlut = now; u.username = username;
    if(win){u.wins=(u.wins||0)+1;u.totalEarned=(u.totalEarned||0)+amt;}else u.losses=(u.losses||0)+1;
    data[userId]=u; save(data);
    return { success:true, win, amount:amt, msg:win?SLUT_WIN[Math.floor(Math.random()*SLUT_WIN.length)]:SLUT_LOSE[Math.floor(Math.random()*SLUT_LOSE.length)], total:u.coins };
}

// ─── Crime (2h, 45%) ──────────────────────────────────────────────────────────
const CRIME_WIN  = ['Hackeaste una base de datos corporativa 💻','Asaltaste un banco con tu pandilla 🏦','Vendiste información clasificada 🕵️','Robaste un auto de lujo y lo vendiste 🚗','Estafa millonaria de criptomonedas 📈'];
const CRIME_LOSE = ['Te atrapó la policía y perdiste todo 🚨','Tu cómplice te traicionó 🔪','La alarma sonó, huiste sin nada 🚨','Las cámaras te identificaron 📹'];
function doCrime(userId, username) {
    const data = load(); if (!data[userId]) data[userId] = DEFAULT(username);
    const u = data[userId], now = Date.now(), CD = 7200000;
    if (now-(u.lastCrime||0) < CD) return { success:false, remaining:CD-(now-u.lastCrime) };
    const win = Math.random()<0.45;
    const amt  = win ? Math.floor(Math.random()*1001)+500 : Math.floor(Math.random()*401)+100;
    u.coins    = win ? u.coins+amt : Math.max(0,u.coins-amt);
    u.lastCrime= now; u.username = username;
    if(win){u.wins=(u.wins||0)+1;u.totalEarned=(u.totalEarned||0)+amt;}else u.losses=(u.losses||0)+1;
    data[userId]=u; save(data);
    return { success:true, win, amount:amt, msg:win?CRIME_WIN[Math.floor(Math.random()*CRIME_WIN.length)]:CRIME_LOSE[Math.floor(Math.random()*CRIME_LOSE.length)], total:u.coins };
}

// ─── Rob (1h, 40%) ────────────────────────────────────────────────────────────
function doRob(robberId, robberName, targetId, targetName) {
    const data = load();
    if (!data[robberId]) data[robberId] = DEFAULT(robberName);
    if (!data[targetId])  data[targetId]  = DEFAULT(targetName);
    const robber = data[robberId], target = data[targetId];
    const now = Date.now(), CD = 3600000;
    if (now-(robber.lastRob||0) < CD) return { success:false, type:'cooldown', remaining:CD-(now-robber.lastRob) };
    if (target.coins < 100) return { success:false, type:'poor', targetName };
    const win    = Math.random()<0.40;
    const maxRob = Math.floor(target.coins*0.30);
    const amount = Math.max(50, Math.floor(Math.random()*maxRob));
    const fine   = Math.floor(Math.random()*201)+100;
    if (win) { robber.coins+=amount; target.coins=Math.max(0,target.coins-amount); robber.totalEarned=(robber.totalEarned||0)+amount; robber.wins=(robber.wins||0)+1; }
    else     { robber.coins=Math.max(0,robber.coins-fine); robber.losses=(robber.losses||0)+1; }
    robber.lastRob=now; robber.username=robberName;
    data[robberId]=robber; data[targetId]=target; save(data);
    return { success:true, win, amount, fine, targetName, total:robber.coins };
}

// ─── Beg (5min, 70%) ─────────────────────────────────────────────────────────
const BEG_WIN  = ['Un señor te tiró monedas desde el auto 🪙','Cantaste en el subte y la gente aplaudió 🎵','Un turista te dio propina pensando que eras artista 🎭','Encontraste plata en el piso 💰','Un delivery te dio su comida extra 🍕'];
const BEG_LOSE = ['Te ignoraron completamente 🙄','Un perro te robó tu cartel 🐕','Empezó a llover justo cuando saliste 🌧️','La policía te pidió que te muevas 🚓'];
function doBeg(userId, username) {
    const data = load(); if (!data[userId]) data[userId] = DEFAULT(username);
    const u = data[userId], now = Date.now(), CD = 300000; // 5min
    if (now-(u.lastBeg||0) < CD) return { success:false, remaining:CD-(now-u.lastBeg) };
    const win = Math.random()<0.70;
    const amt  = win ? Math.floor(Math.random()*51)+10 : 0;
    u.coins   += amt; u.lastBeg=now; u.username=username;
    if(win) u.totalEarned=(u.totalEarned||0)+amt;
    data[userId]=u; save(data);
    return { success:true, win, amount:amt, msg:win?BEG_WIN[Math.floor(Math.random()*BEG_WIN.length)]:BEG_LOSE[Math.floor(Math.random()*BEG_LOSE.length)], total:u.coins };
}

// ─── Spin (ruleta, 30min) ────────────────────────────────────────────────────
function doSpin(userId, username, bet) {
    const data = load(); if (!data[userId]) data[userId] = DEFAULT(username);
    const u = data[userId], now = Date.now(), CD = 1800000;
    if (now-(u.lastSpin||0) < CD) return { success:false, type:'cooldown', remaining:CD-(now-u.lastSpin) };
    bet = parseInt(bet);
    if (isNaN(bet)||bet<10) return { success:false, type:'invalid' };
    if (u.coins < bet) return { success:false, type:'broke', have:u.coins };
    const n = Math.floor(Math.random()*37); // 0-36
    const red=[1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36];
    const isRed=red.includes(n), isZero=n===0;
    const color = isZero?'🟢 VERDE':isRed?'🔴 ROJO':'⚫ NEGRO';
    // Verde (0) = jackpot 35x | Rojo/Negro = gana 1x (siempre cobra algo)
    const mult  = isZero ? 35 : 1;
    const earned = bet * mult;
    u.coins += earned; u.lastSpin=now; u.username=username;
    u.totalEarned=(u.totalEarned||0)+earned;
    data[userId]=u; save(data);
    return { success:true, n, color, isZero, earned, total:u.coins, bet };
}

// ─── Duel (desafío PvP, apuesta) ─────────────────────────────────────────────
function doDuel(challengerId, challengerName, targetId, targetName, bet) {
    const data = load();
    if (!data[challengerId]) data[challengerId] = DEFAULT(challengerName);
    if (!data[targetId])     data[targetId]     = DEFAULT(targetName);
    const c = data[challengerId], t = data[targetId];
    if (c.coins < bet) return { success:false, type:'broke_challenger' };
    if (t.coins < bet) return { success:false, type:'broke_target', targetName };
    const challengerWins = Math.random()<0.5;
    if(challengerWins){ c.coins+=bet; t.coins=Math.max(0,t.coins-bet); c.wins=(c.wins||0)+1; t.losses=(t.losses||0)+1; c.totalEarned=(c.totalEarned||0)+bet; }
    else              { t.coins+=bet; c.coins=Math.max(0,c.coins-bet); t.wins=(t.wins||0)+1; c.losses=(c.losses||0)+1; t.totalEarned=(t.totalEarned||0)+bet; }
    data[challengerId]=c; data[targetId]=t; save(data);
    return { success:true, challengerWins, bet, challengerTotal:c.coins, targetTotal:t.coins };
}

// ─── Heist (golpe grupal, 3h, 50%) ───────────────────────────────────────────
function doHeist(userId, username) {
    const data = load(); if (!data[userId]) data[userId] = DEFAULT(username);
    const u = data[userId], now = Date.now(), CD = 10800000; // 3h
    if (now-(u.lastHeist||0) < CD) return { success:false, remaining:CD-(now-u.lastHeist) };
    const win  = Math.random()<0.50;
    const amt  = win ? Math.floor(Math.random()*2001)+1000 : Math.floor(Math.random()*501)+200;
    u.coins    = win ? u.coins+amt : Math.max(0,u.coins-amt);
    u.lastHeist=now; u.username=username;
    if(win){u.wins=(u.wins||0)+1;u.totalEarned=(u.totalEarned||0)+amt;}else u.losses=(u.losses||0)+1;
    data[userId]=u; save(data);
    const winMsgs=['Vaciaste la caja fuerte del banco central 🏦💰','Robaste un camión blindado en la autopista 🚛','Hackeaste el sistema y te llevaste todo 💻','El golpe fue perfecto, escaparon sin rastros 🎭'];
    const loseMsgs=['La alarma sonó antes de entrar 🚨','Un cómplice cantó todo 🐦','La policía llegó antes de lo esperado 🚔','El plan falló desde el principio 💀'];
    return { success:true, win, amount:amt, msg:win?winMsgs[Math.floor(Math.random()*winMsgs.length)]:loseMsgs[Math.floor(Math.random()*loseMsgs.length)], total:u.coins };
}

// ─── Transfer ────────────────────────────────────────────────────────────────
function transfer(fromId, fromName, toId, toName, amount) {
    const data = load();
    if (!data[fromId]) data[fromId] = DEFAULT(fromName);
    if (!data[toId])   data[toId]   = DEFAULT(toName);
    amount = parseInt(amount);
    if (isNaN(amount)||amount<=0) return { success:false, reason:'invalid' };
    if (data[fromId].coins < amount) return { success:false, reason:'broke', have:data[fromId].coins };
    data[fromId].coins -= amount;
    data[toId].coins   += amount;
    save(data);
    return { success:true, amount, fromTotal:data[fromId].coins, toTotal:data[toId].coins };
}

function getTop(limit=10) {
    return Object.values(load()).sort((a,b)=>b.level-a.level||b.xp-a.xp).slice(0,limit);
}
function getRichTop(limit=10) {
    return Object.values(load()).sort((a,b)=>(b.coins+(b.banco||0))-(a.coins+(a.banco||0))).slice(0,limit);
}

module.exports = {
    getUser, addXP, addCoins, removeCoins,
    claimDaily, doWork, doSlut, doCrime, doRob, doBeg, doSpin, doDuel, doHeist, transfer,
    deposit, withdraw, getTop, getRichTop, xpNeeded,
};
