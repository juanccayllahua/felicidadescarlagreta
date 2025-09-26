// ========================================
// CONFIGURACIÓN DE REPRODUCCIÓN AUTOMÁTICA MEJORADA
// ========================================

let autoPlayEnabled = true; // Control principal de auto-play
let autoPlayDelay = 1000; // Delay entre canciones (en ms)
let crossfadeEnabled = false; // Para transiciones suaves (opcional)

// ========================================
// FUNCIÓN PRINCIPAL DE AUTO-PLAY MEJORADA
// ========================================

function setupEnhancedAutoPlay() {
    if (!audioPlayer) return;

    // Limpiar listeners anteriores para evitar duplicados
    audioPlayer.removeEventListener('ended', handleSongEnd);
    
    // Agregar el nuevo listener
    audioPlayer.addEventListener('ended', handleSongEnd);
    
    console.log('🎵 Auto-play mejorado configurado');
}

// Función principal que maneja el final de cada canción
async function handleSongEnd() {
    console.log('🔚 Canción terminada');
    
    if (!autoPlayEnabled) {
        console.log('⏹️ Auto-play deshabilitado');
        return;
    }

    // Modo repetir una canción
    if (isRepeatMode === 'one') {
        await repeatCurrentSong();
        return;
    }

    // Determinar siguiente canción
    const nextIndex = getNextSongIndex();
    
    if (nextIndex === -1) {
        // No hay más canciones
        await handlePlaylistEnd();
        return;
    }

    // Reproducir siguiente canción con delay opcional
    if (autoPlayDelay > 0) {
        console.log(`⏳ Esperando ${autoPlayDelay}ms antes de la siguiente canción...`);
        setTimeout(() => playNextSong(nextIndex), autoPlayDelay);
    } else {
        await playNextSong(nextIndex);
    }
}

// ========================================
// FUNCIONES DE APOYO PARA AUTO-PLAY
// ========================================

// Repetir la canción actual
async function repeatCurrentSong() {
    try {
        audioPlayer.currentTime = 0;
        await audioPlayer.play();
        console.log('🔁 Repitiendo canción actual');
    } catch (error) {
        console.error('❌ Error repitiendo canción:', error);
        // Si falla, intentar pasar a la siguiente
        const nextIndex = getNextSongIndex();
        if (nextIndex !== -1) {
            await playNextSong(nextIndex);
        }
    }
}

// Obtener el índice de la siguiente canción según el modo
function getNextSongIndex() {
    if (currentPlaylist.length === 0) return -1;

    let nextIndex;

    if (isShuffleMode) {
        // Modo aleatorio: evitar repetir la misma canción
        if (currentPlaylist.length === 1) {
            nextIndex = 0;
        } else {
            do {
                nextIndex = Math.floor(Math.random() * currentPlaylist.length);
            } while (nextIndex === currentSongIndex);
        }
    } else {
        // Modo secuencial
        nextIndex = currentSongIndex + 1;
        
        // Verificar si llegamos al final
        if (nextIndex >= currentPlaylist.length) {
            if (isRepeatMode === 'all') {
                nextIndex = 0; // Volver al inicio
            } else {
                return -1; // No hay más canciones
            }
        }
    }

    return nextIndex;
}

// Reproducir la siguiente canción
async function playNextSong(index) {
    try {
        const success = await playSongByIndex(index);
        if (success) {
            console.log(`▶️ Auto-play: ${currentPlaylist[index].title}`);
            updateNavigationButtons();
            
            // Mostrar notificación visual opcional
            showAutoPlayNotification(currentPlaylist[index]);
        } else {
            console.error('❌ Error en auto-play, canción no se pudo reproducir');
        }
    } catch (error) {
        console.error('❌ Error en auto-play:', error);
    }
}

// Manejar el final de la playlist
async function handlePlaylistEnd() {
    console.log('📻 Final de playlist alcanzado');
    
    // Resetear iconos a estado pause
    if (iconPlay && iconPause) {
        iconPlay.style.visibility = 'visible';
        iconPause.style.visibility = 'hidden';
    }
    
    // Opcional: mostrar mensaje al usuario
    showPlaylistEndNotification();
}

// ========================================
// NOTIFICACIONES VISUALES (OPCIONALES)
// ========================================

function showAutoPlayNotification(song) {
    // Crear notificación temporal
    const notification = document.createElement('div');
    notification.className = 'autoplay-notification';
    notification.innerHTML = `
        <div class="autoplay-content">
            <span class="autoplay-icon">▶️</span>
            <span class="autoplay-text">Reproduciendo: ${song.title}</span>
        </div>
    `;
    
    // Estilos inline para la notificación
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: rgba(0, 0, 0, 0.8);
        color: white;
        padding: 12px 16px;
        border-radius: 8px;
        backdrop-filter: blur(10px);
        z-index: 1000;
        font-size: 14px;
        opacity: 0;
        transition: opacity 0.3s ease;
    `;
    
    document.body.appendChild(notification);
    
    // Animar entrada
    setTimeout(() => notification.style.opacity = '1', 100);
    
    // Remover después de 3 segundos
    setTimeout(() => {
        notification.style.opacity = '0';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 3000);
}

function showPlaylistEndNotification() {
    const notification = document.createElement('div');
    notification.className = 'playlist-end-notification';
    notification.innerHTML = `
        <div class="notification-content">
            <span class="notification-icon">🎵</span>
            <span class="notification-text">Playlist finalizada</span>
            <button class="replay-btn" onclick="replayPlaylist()">▶️ Repetir</button>
        </div>
    `;
    
    notification.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: rgba(0, 0, 0, 0.9);
        color: white;
        padding: 20px;
        border-radius: 12px;
        backdrop-filter: blur(15px);
        z-index: 1001;
        text-align: center;
        opacity: 0;
        transition: opacity 0.3s ease;
    `;
    
    document.body.appendChild(notification);
    setTimeout(() => notification.style.opacity = '1', 100);
    
    // Auto-remover después de 5 segundos
    setTimeout(() => {
        notification.style.opacity = '0';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 5000);
}

// ========================================
// FUNCIONES DE CONTROL PÚBLICO
// ========================================

// Habilitar/deshabilitar auto-play
window.toggleAutoPlay = function() {
    autoPlayEnabled = !autoPlayEnabled;
    console.log('🎵 Auto-play:', autoPlayEnabled ? 'HABILITADO' : 'DESHABILITADO');
    
    // Guardar preferencia en localStorage si está disponible
    try {
        localStorage.setItem('autoPlayEnabled', autoPlayEnabled);
    } catch (e) {
        // Ignorar si localStorage no está disponible
    }
    
    return autoPlayEnabled;
};

// Configurar delay entre canciones
window.setAutoPlayDelay = function(milliseconds) {
    autoPlayDelay = Math.max(0, milliseconds);
    console.log('⏳ Delay de auto-play:', autoPlayDelay + 'ms');
    
    try {
        localStorage.setItem('autoPlayDelay', autoPlayDelay);
    } catch (e) {
        // Ignorar si localStorage no está disponible
    }
    
    return autoPlayDelay;
};

// Función para repetir toda la playlist
window.replayPlaylist = function() {
    if (currentPlaylist.length > 0) {
        playSongByIndex(0);
        console.log('🔄 Repitiendo playlist desde el inicio');
        
        // Remover notificación si existe
        const notification = document.querySelector('.playlist-end-notification');
        if (notification) {
            notification.remove();
        }
    }
};

// Obtener configuración actual
window.getAutoPlayConfig = function() {
    return {
        enabled: autoPlayEnabled,
        delay: autoPlayDelay,
        crossfade: crossfadeEnabled,
        repeatMode: isRepeatMode,
        shuffleMode: isShuffleMode
    };
};

// ========================================
// INICIALIZACIÓN
// ========================================

// Cargar preferencias guardadas
function loadAutoPlayPreferences() {
    try {
        const savedAutoPlay = localStorage.getItem('autoPlayEnabled');
        const savedDelay = localStorage.getItem('autoPlayDelay');
        
        if (savedAutoPlay !== null) {
            autoPlayEnabled = JSON.parse(savedAutoPlay);
        }
        
        if (savedDelay !== null) {
            autoPlayDelay = parseInt(savedDelay);
        }
        
        console.log('📱 Preferencias de auto-play cargadas:', {
            enabled: autoPlayEnabled,
            delay: autoPlayDelay
        });
    } catch (e) {
        console.log('📱 No se pudieron cargar las preferencias (localStorage no disponible)');
    }
}

// Inicializar cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        loadAutoPlayPreferences();
        setupEnhancedAutoPlay();
    });
} else {
    loadAutoPlayPreferences();
    setupEnhancedAutoPlay();
}

console.log('🎵 Sistema de reproducción automática mejorado cargado');