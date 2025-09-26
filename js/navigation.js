// ========================================
// VARIABLES GLOBALES PARA CONTROL DE PLAYLIST
// ========================================
let currentSongIndex = -1;
let currentPlaylist = []; // Array que contendrá las canciones actuales
let isShuffleMode = false;
let isRepeatMode = false; // 'off', 'one', 'all'

// Elementos del DOM
const prevBtn = document.getElementById('prev-btn');
const nextBtn = document.getElementById('next-btn');

// ========================================
// FUNCIONES PARA CONTROL DE PLAYLIST
// ========================================

// Función para actualizar la playlist actual
function updateCurrentPlaylist(songsArray) {
    currentPlaylist = songsArray;
    console.log('📝 Playlist actualizada:', currentPlaylist.length, 'canciones');
}

// Función para encontrar el índice de la canción actual
function findCurrentSongIndex(songFile) {
    const index = currentPlaylist.findIndex(song => song.file === songFile);
    currentSongIndex = index;
    return index;
}

// Función para reproducir una canción por índice
async function playSongByIndex(index) {
    if (index < 0 || index >= currentPlaylist.length) {
        console.log('❌ Índice de canción fuera de rango:', index);
        return false;
    }

    const song = currentPlaylist[index];
    currentSongIndex = index;

    try {
        // Actualizar la UI para mostrar la canción seleccionada
        updatePlaylistUI(index);
        
        // Reproducir la canción
        await window.initializeAudioForPlaylist(song.file);

        // Cargar letras si existen
        if (song.lyrics) {
            fetch(song.lyrics)
                .then(res => res.text())
                .then(text => {
                    if (window.karaoke) {
                        window.karaoke.loadLyrics(text);
                    }
                })
                .catch(e => console.log('Error cargando letras:', e));
        } else {
            if (window.karaoke) {
                window.karaoke.clearLyrics();
            }
        }

        console.log(`▶️ Reproduciendo: ${song.title} (${index + 1}/${currentPlaylist.length})`);
        return true;

    } catch (error) {
        console.error('❌ Error reproduciendo canción:', error);
        return false;
    }
}

// Función para actualizar la UI de la playlist
function updatePlaylistUI(activeIndex) {
    const playlistItems = document.querySelectorAll('#playlist li');
    playlistItems.forEach((item, index) => {
        item.classList.remove('active');
        if (index === activeIndex) {
            item.classList.add('active');
            // Hacer scroll para mostrar la canción actual
            item.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
    });
}

// ========================================
// FUNCIONES PARA NAVEGACIÓN
// ========================================

// Función para ir a la canción siguiente
async function playNext() {
    if (currentPlaylist.length === 0) {
        console.log('❌ No hay playlist disponible');
        return;
    }

    let nextIndex;

    if (isShuffleMode) {
        // Modo aleatorio: seleccionar una canción al azar diferente a la actual
        do {
            nextIndex = Math.floor(Math.random() * currentPlaylist.length);
        } while (nextIndex === currentSongIndex && currentPlaylist.length > 1);
    } else {
        // Modo normal: siguiente canción en orden
        nextIndex = currentSongIndex + 1;
        
        // Si llegamos al final de la playlist
        if (nextIndex >= currentPlaylist.length) {
            if (isRepeatMode === 'all') {
                nextIndex = 0; // Volver al inicio
            } else {
                console.log('📻 Final de la playlist alcanzado');
                return; // No hacer nada si no está en modo repeat
            }
        }
    }

    const success = await playSongByIndex(nextIndex);
    if (success) {
        updateNavigationButtons();
    }
}

// Función para ir a la canción anterior
async function playPrevious() {
    if (currentPlaylist.length === 0) {
        console.log('❌ No hay playlist disponible');
        return;
    }

    let prevIndex;

    if (isShuffleMode) {
        // En modo aleatorio, ir a una canción aleatoria diferente
        do {
            prevIndex = Math.floor(Math.random() * currentPlaylist.length);
        } while (prevIndex === currentSongIndex && currentPlaylist.length > 1);
    } else {
        // Modo normal: canción anterior en orden
        prevIndex = currentSongIndex - 1;
        
        // Si llegamos al inicio de la playlist
        if (prevIndex < 0) {
            if (isRepeatMode === 'all') {
                prevIndex = currentPlaylist.length - 1; // Ir al final
            } else {
                console.log('📻 Inicio de la playlist alcanzado');
                return; // No hacer nada si no está en modo repeat
            }
        }
    }

    const success = await playSongByIndex(prevIndex);
    if (success) {
        updateNavigationButtons();
    }
}

// Función para actualizar el estado visual de los botones
function updateNavigationButtons() {
    if (!prevBtn || !nextBtn || currentPlaylist.length === 0) return;

    // En modo shuffle o repeat, siempre habilitar ambos botones
    if (isShuffleMode || isRepeatMode === 'all') {
        prevBtn.style.opacity = '1';
        nextBtn.style.opacity = '1';
        prevBtn.disabled = false;
        nextBtn.disabled = false;
        return;
    }

    // Modo normal: deshabilitar según posición
    if (currentSongIndex <= 0) {
        prevBtn.style.opacity = '0.5';
        prevBtn.disabled = true;
    } else {
        prevBtn.style.opacity = '1';
        prevBtn.disabled = false;
    }

    if (currentSongIndex >= currentPlaylist.length - 1) {
        nextBtn.style.opacity = '0.5';
        nextBtn.disabled = true;
    } else {
        nextBtn.style.opacity = '1';
        nextBtn.disabled = false;
    }
}

// ========================================
// EVENT LISTENERS PARA LOS BOTONES
// ========================================

// Botón anterior
if (prevBtn) {
    prevBtn.addEventListener('click', async () => {
        console.log('⏮️ Botón anterior presionado');
        await playPrevious();
    });
}

// Botón siguiente
if (nextBtn) {
    nextBtn.addEventListener('click', async () => {
        console.log('⏭️ Botón siguiente presionado');
        await playNext();
    });
}

// ========================================
// INTEGRACIÓN CON EL CÓDIGO EXISTENTE
// ========================================

// Función para modificar el renderPlaylist existente
function renderPlaylistWithNavigation(songsToRender) {
    const playlistEl = document.getElementById('playlist');
    
    // Actualizar la playlist actual para navegación
    updateCurrentPlaylist(songsToRender);
    
    playlistEl.innerHTML = ""; // limpiar lista
    
    songsToRender.forEach((song, index) => {
        const li = document.createElement('li');

        li.innerHTML = `
            <div class="song-info">
                <img src="${song.cover}" alt="cover">
                <span class="song-title">${song.title}</span>
            </div>
            <span class="song-duration">${song.duration}</span>
        `;

        li.addEventListener('click', async () => {
            const success = await playSongByIndex(index);
            if (success) {
                updateNavigationButtons();
            }
        });

        playlistEl.appendChild(li);
    });
    
    // Actualizar estado de botones de navegación
    updateNavigationButtons();
    
    console.log('📝 Playlist renderizada con', songsToRender.length, 'canciones');
}

// ========================================
// AUTO-PLAY AL TERMINAR CANCIÓN
// ========================================

// Agregar event listener para auto-play siguiente canción
if (audioPlayer) {
    audioPlayer.addEventListener('ended', async () => {
        console.log('🔚 Canción terminada');
        
        if (isRepeatMode === 'one') {
            // Repetir la misma canción
            try {
                await audioPlayer.play();
                console.log('🔁 Repitiendo canción actual');
            } catch (e) {
                console.error('Error repitiendo canción:', e);
            }
        } else {
            // Pasar a la siguiente canción automáticamente
            await playNext();
        }
    });
}

// ========================================
// FUNCIONES PÚBLICAS PARA USO EXTERNO
// ========================================

// Exportar funciones para uso en otros scripts
window.playNext = playNext;
window.playPrevious = playPrevious;
window.playSongByIndex = playSongByIndex;
window.updateCurrentPlaylist = updateCurrentPlaylist;
window.renderPlaylistWithNavigation = renderPlaylistWithNavigation;

// Funciones para controlar modos
window.toggleShuffle = function() {
    isShuffleMode = !isShuffleMode;
    updateNavigationButtons();
    console.log('🔀 Shuffle:', isShuffleMode ? 'ON' : 'OFF');
    return isShuffleMode;
};

window.toggleRepeat = function() {
    const modes = ['off', 'all', 'one'];
    const currentIndex = modes.indexOf(isRepeatMode);
    isRepeatMode = modes[(currentIndex + 1) % modes.length];
    updateNavigationButtons();
    console.log('🔁 Repeat:', isRepeatMode);
    return isRepeatMode;
};

// Función de utilidad para obtener info actual
window.getCurrentPlaybackInfo = function() {
    return {
        currentIndex: currentSongIndex,
        totalSongs: currentPlaylist.length,
        currentSong: currentPlaylist[currentSongIndex] || null,
        shuffle: isShuffleMode,
        repeat: isRepeatMode
    };
};

console.log('🎵 Sistema de navegación de playlist inicializado');