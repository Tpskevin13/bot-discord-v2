const {
    joinVoiceChannel,
    createAudioPlayer,
    createAudioResource,
    AudioPlayerStatus,
    VoiceConnectionStatus,
    entersState,
    getVoiceConnection,
} = require('@discordjs/voice');
const play = require('play-dl');

// ─── Cola por servidor: Map<guildId, QueueObject> ────────────────────────────
const queues = new Map();

// ─── Iniciar o devolver la cola de un servidor ────────────────────────────────
function createQueue(guild, voiceChannel, textChannel) {
    const player = createAudioPlayer();

    const connection = joinVoiceChannel({
        channelId: voiceChannel.id,
        guildId: guild.id,
        adapterCreator: guild.voiceAdapterCreator,
        selfDeaf: true,
    });

    connection.subscribe(player);

    const queue = {
        songs: [],       // [{ title, url, duration, requestedBy }]
        player,
        connection,
        textChannel,
        volume: 80,
        playing: false,
    };

    queues.set(guild.id, queue);

    // Cuando termina una canción → siguiente
    player.on(AudioPlayerStatus.Idle, () => {
        queue.songs.shift();
        if (queue.songs.length > 0) {
            _playNext(guild.id);
        } else {
            queue.playing = false;
            textChannel.send('📭 Cola terminada. ¡Hasta la próxima!');
            // Desconectar después de 30s si sigue vacío
            setTimeout(() => {
                const q = queues.get(guild.id);
                if (q && q.songs.length === 0) {
                    q.connection.destroy();
                    queues.delete(guild.id);
                }
            }, 30000);
        }
    });

    player.on('error', (err) => {
        console.error('[ Music Player ]', err.message);
        textChannel.send(`❌ Error reproduciendo: \`${err.message.slice(0, 100)}\``);
        queue.songs.shift();
        if (queue.songs.length > 0) _playNext(guild.id);
        else queue.playing = false;
    });

    // Si la conexión se rompe, limpiar
    connection.on(VoiceConnectionStatus.Disconnected, async () => {
        try {
            await Promise.race([
                entersState(connection, VoiceConnectionStatus.Signalling, 5_000),
                entersState(connection, VoiceConnectionStatus.Connecting, 5_000),
            ]);
        } catch {
            connection.destroy();
            queues.delete(guild.id);
        }
    });

    return queue;
}

// ─── Reproducir siguiente canción de la cola ─────────────────────────────────
async function _playNext(guildId) {
    const queue = queues.get(guildId);
    if (!queue || !queue.songs.length) return;

    const song = queue.songs[0];
    queue.playing = true;

    try {
        const source = await play.stream(song.url, { quality: 2 });
        const resource = createAudioResource(source.stream, {
            inputType: source.type,
            inlineVolume: true,
        });
        resource.volume?.setVolumeLogarithmic(queue.volume / 100);
        queue.currentResource = resource;
        queue.player.play(resource);
        queue.textChannel.send(
            `▶️ Reproduciendo: **${song.title}** \`${song.duration}\` — pedido por *${song.requestedBy}*`
        );
    } catch (e) {
        console.error('[ _playNext ]', e.message);
        queue.textChannel.send(`❌ No se pudo reproducir **${song.title}**: \`${e.message.slice(0, 80)}\``);
        queue.songs.shift();
        if (queue.songs.length > 0) _playNext(guildId);
        else queue.playing = false;
    }
}

// ─── API pública ──────────────────────────────────────────────────────────────

/**
 * Busca y agrega una canción a la cola. Si no hay nada sonando, empieza a tocar.
 * @returns { song, position } — position=0 significa que empezó ahora
 */
async function addSong(guild, voiceChannel, textChannel, query, requestedBy) {
    let songInfo;

    // Detectar si es URL de YouTube directa
    const urlType = play.yt_validate(query);

    if (urlType === 'video') {
        const info = await play.video_info(query);
        const v = info.video_details;
        songInfo = {
            title: v.title || 'Sin título',
            url: v.url,
            duration: v.durationRaw || '?:??',
            requestedBy,
        };
    } else if (urlType === 'playlist') {
        throw new Error('Las playlists no están soportadas aún. Enviá URLs o nombres de canciones individuales.');
    } else {
        // Búsqueda por nombre
        const results = await play.search(query, { source: { youtube: 'video' }, limit: 1 });
        if (!results || results.length === 0) throw new Error('No encontré resultados en YouTube para eso.');
        const v = results[0];
        songInfo = {
            title: v.title || 'Sin título',
            url: v.url,
            duration: v.durationRaw || '?:??',
            requestedBy,
        };
    }

    // Obtener o crear cola
    let queue = queues.get(guild.id);
    if (!queue) {
        queue = createQueue(guild, voiceChannel, textChannel);
    }

    queue.songs.push(songInfo);
    const position = queue.songs.length; // 1 = va a sonar ahora

    // Si el player está idle, empezar
    if (!queue.playing) {
        await _playNext(guild.id);
    }

    return { song: songInfo, position };
}

function skipSong(guild) {
    const queue = queues.get(guild.id);
    if (!queue) throw new Error('No hay música reproduciéndose.');
    queue.player.stop(); // dispara el evento Idle → siguiente canción
}

function stopMusic(guild) {
    const queue = queues.get(guild.id);
    if (!queue) throw new Error('No hay música reproduciéndose.');
    queue.songs = [];
    queue.playing = false;
    queue.player.stop();
    queue.connection.destroy();
    queues.delete(guild.id);
}

function pauseMusic(guild) {
    const queue = queues.get(guild.id);
    if (!queue) throw new Error('No hay música reproduciéndose.');
    if (queue.player.state.status === AudioPlayerStatus.Paused) throw new Error('Ya está pausada.');
    queue.player.pause();
}

function resumeMusic(guild) {
    const queue = queues.get(guild.id);
    if (!queue) throw new Error('No hay música reproducida.');
    if (queue.player.state.status !== AudioPlayerStatus.Paused) throw new Error('No está pausada.');
    queue.player.unpause();
}

function setVolumeMusic(guild, vol) {
    const queue = queues.get(guild.id);
    if (!queue) throw new Error('No hay música reproduciéndose.');
    queue.volume = vol;
    // Aplicar al recurso activo si existe
    if (queue.currentResource?.volume) {
        queue.currentResource.volume.setVolumeLogarithmic(vol / 100);
    }
}

function getQueue(guild) {
    return queues.get(guild.id) || null;
}

module.exports = { addSong, skipSong, stopMusic, pauseMusic, resumeMusic, setVolumeMusic, getQueue };
