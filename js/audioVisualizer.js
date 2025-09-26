let audioContext, analyser, source, gainNode;
let dataArray;
let isAudioInitialized = false;

// VARIABLES PARA AUTO-PLAY
let autoPlayEnabled = true;
let autoPlayListener = null;

const musicInput = document.getElementById('music-input');
const audioPlayer = document.getElementById('audio-player');
const progressBar = document.getElementById('progress-bar');
const progressContainer = document.querySelector('.progress-container');

const volumeBtn = document.getElementById('volume-btn');
const iconVolume = document.getElementById('icon-volume');
const iconMute = document.getElementById('icon-mute');

const playPauseBtn = document.getElementById('playpause-btn');
const iconPlay = document.getElementById('icon-play');
const iconPause = document.getElementById('icon-pause');

const currentTimeEl = document.getElementById('current-time');
const durationEl = document.getElementById('duration');

// ========================================
// FUNCIONES DE NAVEGACIÓN SIMPLES
// ========================================

// Función para ir a la siguiente canción
async function goToNextSong() {
    if (currentPlaylist.length === 0) {
        console.log('❌ No hay playlist disponible');
        return;
    }

    let nextIndex = currentSongIndex + 1;

    // Si llegamos al final
    if (nextIndex >= currentPlaylist.length) {
        if (repeatPlaylist) {
            nextIndex = 0; // Volver al inicio
            console.log('🔄 Final de playlist, volviendo al inicio');
        } else {
            console.log('📻 Final de playlist alcanzado');
            return;
        }
    }

    // Reproducir siguiente canción
    const song = currentPlaylist[nextIndex];
    if (song) {
        currentSongIndex = nextIndex;
        
        try {
            await window.initializeAudioForPlaylist(song.file);
            
            // Cargar letras si existen
            if (song.lyrics && window.karaoke) {
                fetch(song.lyrics)
                    .then(res => res.text())
                    .then(text => window.karaoke.loadLyrics(text))
                    .catch(e => console.log('Error cargando letras:', e));
            }
            
            // Actualizar UI
            updatePlaylistUI(nextIndex);
            
            console.log(`▶️ Auto-play: ${song.title} (${nextIndex + 1}/${currentPlaylist.length})`);
            
        } catch (error) {
            console.error('❌ Error en auto-play:', error);
        }
    }
}

// Función para actualizar la UI de la playlist
function updatePlaylistUI(activeIndex) {
    const playlistItems = document.querySelectorAll('#playlist li');
    playlistItems.forEach((item, index) => {
        item.classList.remove('active');
        if (index === activeIndex) {
            item.classList.add('active');
            item.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
    });
}

// Función para establecer la playlist actual
function setCurrentPlaylist(songs, startIndex = 0) {
    currentPlaylist = songs;
    currentSongIndex = startIndex;
    console.log('📝 Playlist establecida:', currentPlaylist.length, 'canciones');
}

// FUNCIONES PÚBLICAS PARA USO EXTERNO
window.setCurrentPlaylist = setCurrentPlaylist;
window.toggleRepeatPlaylist = function() {
    repeatPlaylist = !repeatPlaylist;
    console.log('🔁 Repeat playlist:', repeatPlaylist ? 'ON' : 'OFF');
    return repeatPlaylist;
};

// ========================================
// FUNCIÓN PARA LIMPIAR CONEXIONES ANTERIORES
// ========================================
function cleanupAudioConnections() {
    try {
        if (source) {
            source.disconnect();
            source = null;
        }
        if (gainNode) {
            gainNode.disconnect();
            gainNode = null;
        }
        console.log('🧹 Conexiones de audio limpiadas');
    } catch (e) {
        console.log('Cleanup: algunas conexiones ya estaban desconectadas');
    }
}

// ========================================
// AUTO-PLAY CORREGIDO
// ========================================
function setupSingleAutoPlay() {
    if (!audioPlayer) return;
    
    // Remover listener anterior si existe
    if (autoPlayListener) {
        audioPlayer.removeEventListener('ended', autoPlayListener);
        console.log('🗑️ Listener anterior removido');
    }
    
    // Crear la función del listener
    autoPlayListener = async function handleSongEndOnce() {
        console.log('🔚 Canción terminada - Auto-play activado');
        
        if (!autoPlayEnabled) {
            console.log('⏹️ Auto-play deshabilitado');
            return;
        }

        // Pequeño delay para asegurar que la canción realmente terminó
        setTimeout(async () => {
            if (audioPlayer.ended && !audioPlayer.paused) {
                console.log('✅ Confirmado: canción terminada naturalmente');
                
                // Aquí llamas a tu función de siguiente canción
                if (window.playNext) {
                    await window.playNext();
                } else {
                    console.log('⚠️ Función playNext no disponible');
                }
            } else {
                console.log('⏹️ Falsa alarma - canción no terminó naturalmente');
            }
        }, 100);
    };
    
    // Agregar el listener UNA SOLA VEZ
    audioPlayer.addEventListener('ended', autoPlayListener);
    console.log('✅ Auto-play configurado correctamente');
}

function cleanupAutoPlay() {
    if (audioPlayer && autoPlayListener) {
        audioPlayer.removeEventListener('ended', autoPlayListener);
        autoPlayListener = null;
        console.log('🧹 Auto-play limpiado');
    }
}

// ========================================
// FUNCIÓN CENTRALIZADA PARA CONFIGURAR EL ANALIZADOR (CORREGIDA)
// ========================================
function setupAudioAnalyzer() {
    // Crear contexto de audio si no existe
    if (!audioContext) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }

    // Reanudar contexto si está suspendido
    if (audioContext.state === 'suspended') {
        audioContext.resume();
    }

    try {
        // Solo crear source si no existe aún
        if (!source) {
            source = audioContext.createMediaElementSource(audioPlayer);
            console.log('✅ MediaElementSource creado');
        }

        // Solo crear gain si no existe
        if (!gainNode) {
            gainNode = audioContext.createGain();
            gainNode.gain.setValueAtTime(0.8, audioContext.currentTime);
            console.log('✅ GainNode creado');
        }

        // Crear analizador si no existe
        if (!analyser) {
            analyser = audioContext.createAnalyser();
            analyser.fftSize = 64;
            dataArray = new Uint8Array(analyser.frequencyBinCount);
            console.log('✅ Analyser creado');
        }

        // Conectar solo si no están conectados
        if (!isAudioInitialized) {
            source.connect(gainNode);
            gainNode.connect(analyser);
            analyser.connect(audioContext.destination);
            
            isAudioInitialized = true;
            console.log('✅ Analizador de audio configurado correctamente');
        } else {
            console.log('✅ Analizador ya estaba inicializado');
        }
        
    } catch (error) {
        console.error('❌ Error configurando analizador:', error);
        isAudioInitialized = false;
    }
}

// ========================================
// FUNCIÓN PÚBLICA MEJORADA PARA INICIALIZAR AUDIO
// ========================================
window.initializeAudioForPlaylist = function(audioSrc) {
    return new Promise((resolve, reject) => {
        // Limpiar auto-play antes de cambiar canción
        cleanupAutoPlay();
        
        // Pausar audio actual si está reproduciéndose
        if (!audioPlayer.paused) {
            audioPlayer.pause();
        }

        // Cambiar fuente
        audioPlayer.src = audioSrc;

        // Configurar evento una sola vez
        const handleCanPlay = () => {
            // Solo configurar analizador si no está inicializado
            if (!isAudioInitialized) {
                setupAudioAnalyzer();
            } else {
                if (audioContext && audioContext.state === 'suspended') {
                    audioContext.resume();
                }
            }
            
            // Actualizar iconos
            iconPlay.style.visibility = 'hidden';
            iconPause.style.visibility = 'visible';
            
            // Intentar reproducir
            audioPlayer.play()
                .then(() => {
                    console.log('✅ Reproducción iniciada:', audioSrc);
                    
                    // Configurar auto-play DESPUÉS de que empiece a reproducir
                    setTimeout(() => {
                        if (autoPlayEnabled) {
                            setupSingleAutoPlay();
                        }
                    }, 500);
                    
                    resolve();
                })
                .catch(error => {
                    console.error('❌ Error en reproducción:', error);
                    iconPlay.style.visibility = 'visible';
                    iconPause.style.visibility = 'hidden';
                    reject(error);
                });
        };

        audioPlayer.addEventListener('canplay', handleCanPlay, { once: true });
        audioPlayer.load();
    });
};

// ========================================
// RESTO DEL CÓDIGO EXISTENTE (sin cambios)
// ========================================

// FORMATEO DE TIEMPO
function formatTime(seconds) {
    if (isNaN(seconds)) return '0:00';
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes}:${secs < 10 ? '0' + secs : secs}`;
}

// ACTUALIZACIÓN DE METADATOS
audioPlayer.addEventListener('loadedmetadata', () => {
    if (durationEl) {
        durationEl.textContent = formatTime(audioPlayer.duration);
    }
});

// ACTUALIZACIÓN DE TIEMPO
audioPlayer.addEventListener('timeupdate', () => {
    if (currentTimeEl) {
        currentTimeEl.textContent = formatTime(audioPlayer.currentTime);
    }
    
    if (progressBar && audioPlayer.duration > 0) {
        const progressPercent = (audioPlayer.currentTime / audioPlayer.duration) * 100;
        progressBar.style.width = Math.min(progressPercent, 100) + '%';
    }
});

// CLICK EN BARRA PARA SALTAR
if (progressContainer) {
    progressContainer.addEventListener('click', (e) => {
        if (audioPlayer.duration > 0) {
            const width = progressContainer.clientWidth;
            const clickX = e.offsetX;
            const newTime = (clickX / width) * audioPlayer.duration;
            audioPlayer.currentTime = newTime;
        }
    });
}

// PLAY / PAUSE TOGGLE MEJORADO
if (playPauseBtn) {
    playPauseBtn.addEventListener('click', async () => {
        try {
            if (!isAudioInitialized && audioPlayer.src) {
                setupAudioAnalyzer();
            }

            if (!audioContext) {
                audioContext = new (window.AudioContext || window.webkitAudioContext)();
            }

            if (audioContext.state === 'suspended') {
                await audioContext.resume();
            }

            if (audioPlayer.paused) {
                await audioPlayer.play();
                iconPlay.style.visibility = 'hidden';
                iconPause.style.visibility = 'visible';
                console.log('▶️ Reproducción iniciada');
            } else {
                audioPlayer.pause();
                iconPlay.style.visibility = 'visible';
                iconPause.style.visibility = 'hidden';
                console.log('⏸️ Reproducción pausada');
            }
        } catch (error) {
            console.error('❌ Error en play/pause:', error);
            iconPlay.style.visibility = 'visible';
            iconPause.style.visibility = 'hidden';
        }
    });
}

// MUTEO MEJORADO
if (volumeBtn) {
    volumeBtn.addEventListener('click', () => {
        audioPlayer.muted = !audioPlayer.muted;
        
        if (audioPlayer.muted) {
            if (gainNode) gainNode.gain.setValueAtTime(0, audioContext.currentTime);
            iconVolume.style.display = 'none';
            iconMute.style.display = 'block';
            console.log('🔇 Audio muteado');
        } else {
            if (gainNode) gainNode.gain.setValueAtTime(0.8, audioContext.currentTime);
            iconVolume.style.display = 'block';
            iconMute.style.display = 'none';
            console.log('🔊 Audio desmuteado');
        }
    });
}

// CAMBIO DE ARCHIVO DESDE INPUT MEJORADO
if (musicInput) {
    musicInput.addEventListener('change', function () {
        const file = this.files[0];
        if (!file) return;

        const audioURL = URL.createObjectURL(file);
        
        window.initializeAudioForPlaylist(audioURL)
            .then(() => {
                console.log('✅ Archivo cargado exitosamente');
                
                fetch('songs/song1.lrc')
                    .then(res => res.text())
                    .then(text => {
                        if (window.karaoke) {
                            karaoke.loadLyrics(text);
                        }
                    })
                    .catch(e => console.log('No se pudo cargar letras por defecto'));
            })
            .catch(error => {
                console.error('❌ Error cargando archivo:', error);
            });
    });
}

// ========================================
// FUNCIONES DE UTILIDAD
// ========================================

let lastUpdateTime = 0;
const UPDATE_INTERVAL = 16;

window.getFrequencyData = function () {
    const now = performance.now();
    
    if (now - lastUpdateTime < UPDATE_INTERVAL) {
        return dataArray;
    }
    
    if (analyser && isAudioInitialized && !audioPlayer.paused && !audioPlayer.muted && audioPlayer.readyState >= 2) {
        try {
            analyser.getByteFrequencyData(dataArray);
            lastUpdateTime = now;
            return dataArray;
        } catch (error) {
            console.error('Error obteniendo datos de frecuencia:', error);
            return null;
        }
    }
    return null;
};

window.checkAudioStatus = function() {
    console.log('=== ESTADO DEL AUDIO ===');
    console.log('AudioContext:', audioContext ? audioContext.state : 'No existe');
    console.log('Source:', source ? 'Conectado' : 'No conectado');
    console.log('GainNode:', gainNode ? 'Conectado' : 'No conectado');
    console.log('Analyser:', analyser ? 'Conectado' : 'No conectado');
    console.log('Audio inicializado:', isAudioInitialized);
    console.log('Auto-play habilitado:', autoPlayEnabled);
    console.log('========================');
};

// FUNCIONES PÚBLICAS PARA CONTROLAR AUTO-PLAY
window.toggleAutoPlay = function() {
    autoPlayEnabled = !autoPlayEnabled;
    console.log('🎵 Auto-play:', autoPlayEnabled ? 'HABILITADO' : 'DESHABILITADO');
    
    if (!autoPlayEnabled) {
        cleanupAutoPlay();
    } else if (audioPlayer.src) {
        setupSingleAutoPlay();
    }
    
    return autoPlayEnabled;
};

window.debugAutoPlay = function() {
    console.log('=== DEBUG AUTO-PLAY ===');
    console.log('Auto-play habilitado:', autoPlayEnabled);
    console.log('Listener existe:', autoPlayListener !== null);
    console.log('Audio ended:', audioPlayer ? audioPlayer.ended : 'No audio');
    console.log('Audio paused:', audioPlayer ? audioPlayer.paused : 'No audio');
    console.log('========================');
};

// LIMPIEZA AL CAMBIAR DE PÁGINA
window.addEventListener('beforeunload', () => {
    cleanupAudioConnections();
    cleanupAutoPlay();
    if (audioContext) {
        audioContext.close();
    }
});