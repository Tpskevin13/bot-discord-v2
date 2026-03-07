const {
    joinVoiceChannel,
    createAudioPlayer,
    createAudioResource,
    AudioPlayerStatus,
    VoiceConnectionStatus,
    entersState,
    StreamType,
} = require('@discordjs/voice');
const ytdl  = require('@distube/ytdl-core');
const yts   = require('yt-search');

// Cola por servidor
const queues = new Map();

function createQueue(guild, voiceChannel, textChannel) {
    const player = createAudioPlayer();

    const connection = joinVoiceChannel({
        channelId:      voiceChannel.id,
        guildId:        guild.id,
        adapterCreator: guild.voiceAdapterCreator,
        selfDeaf:       true,
    });
    connection.subscribe(player);

    const queue = { songs: [], player, connection, textChannel, volume: 80, playing: false };
    queues.set(guild.id, queue);

    player.on(AudioPlayerStatus.Idle, () => {
        queue.songs.shift();
        if (queue.songs.length > 0) {
            _playNext(guild.id);
        } else {
            queue.playing = false;
            textChannel.send('📭 Cola terminada. ¡Hasta la próxima!');
            setTimeout(() => {
                const q = queues.get(guild.id);
                if (q && q.songs.length === 0) { q.connection.destroy(); queues.delete(guild.id); }
            }, 30000);
        }
    });

    player.on('error', err => {
        console.error('[ Music ]', err.message);
        textChannel.send(`❌ Error: \`${err.message.slice(0, 100)}\``);
        queue.songs.shift();
        if (queue.songs.length > 0) _playNext(guild.id);
        else queue.playing = false;
    });

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

async function _playNext(guildId) {
    const queue = queues.get(guildId);
    if (!queue || !queue.songs.length) return;
    const song = queue.songs[0];
    queue.playing = true;
    try {
        const stream = ytdl(song.url, {
            filter: 'audioonly',
            quality: 'highestaudio',
            highWaterMark: 1 << 25, // 32MB buffer
        });
        const resource = createAudioResource(stream, { inputType: StreamType.Arbitrary, inlineVolume: true });
        resource.volume?.setVolumeLogarithmic(queue.volume / 100);
        queue.currentResource = resource;
        queue.player.play(resource);
        queue.textChannel.send(`▶️ Reproduciendo: **${song.title}** \`${song.duration}\` — *${song.requestedBy}*`);
    } catch (e) {
        console.error('[ _playNext ]', e.message);
        queue.textChannel.send(`❌ No pude reproducir **${song.title}**: \`${e.message.slice(0, 80)}\``);
        queue.songs.shift();
        if (queue.songs.length > 0) _playNext(guildId);
        else queue.playing = false;
    }
}

async function addSong(guild, voiceChannel, textChannel, query, requestedBy) {
    let songInfo;

    // URL directa de YouTube
    if (ytdl.validateURL(query)) {
        const info = await ytdl.getInfo(query);
        const v = info.videoDetails;
        const dur = new Date(parseInt(v.lengthSeconds) * 1000).toISOString().substr(11, 8).replace(/^00:/, '');
        songInfo = { title: v.title, url: v.video_url, duration: dur, requestedBy };
    } else {
        // Búsqueda por nombre
        const result = await yts(query);
        const v = result.videos[0];
        if (!v) throw new Error('No encontré resultados en YouTube para eso.');
        songInfo = { title: v.title, url: v.url, duration: v.timestamp || '?:??', requestedBy };
    }

    let queue = queues.get(guild.id);
    if (!queue) queue = createQueue(guild, voiceChannel, textChannel);

    queue.songs.push(songInfo);
    if (!queue.playing) await _playNext(guild.id);

    return { song: songInfo, position: queue.songs.length };
}

function skipSong(guild)      { const q = _get(guild); q.player.stop(); }
function stopMusic(guild)     { const q = _get(guild); q.songs = []; q.playing = false; q.player.stop(); q.connection.destroy(); queues.delete(guild.id); }
function pauseMusic(guild)    { const q = _get(guild); if (q.player.state.status === AudioPlayerStatus.Paused) throw new Error('Ya está pausada.'); q.player.pause(); }
function resumeMusic(guild)   { const q = _get(guild); if (q.player.state.status !== AudioPlayerStatus.Paused) throw new Error('No está pausada.'); q.player.unpause(); }
function setVolumeMusic(guild, vol) { const q = _get(guild); q.volume = vol; q.currentResource?.volume?.setVolumeLogarithmic(vol / 100); }
function getQueue(guild)      { return queues.get(guild.id) || null; }

function _get(guild) {
    const q = queues.get(guild.id);
    if (!q) throw new Error('No hay música reproduciéndose.');
    return q;
}

module.exports = { addSong, skipSong, stopMusic, pauseMusic, resumeMusic, setVolumeMusic, getQueue };
