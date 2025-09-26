 // Función para actualizar la hora
 function updateTime() {
    const now = new Date();
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const timeString = `${hours}:${minutes}`;
    
    const timeElement = document.getElementById('ahora-hora');
    if (timeElement) {
        timeElement.textContent = timeString;
    }
}

// Actualizar la hora inmediatamente
updateTime();

// Actualizar cada minuto (60000 milisegundos)
setInterval(updateTime, 60000);

// Opcional: Actualizar cada segundo si quieres incluir segundos
// Descomenta las siguientes líneas si prefieres mostrar segundos:
/*
function updateTimeWithSeconds() {
    const now = new Date();
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const seconds = now.getSeconds().toString().padStart(2, '0');
    const timeString = `${hours}:${minutes}:${seconds}`;
    
    const timeElement = document.getElementById('current-time');
    if (timeElement) {
        timeElement.textContent = timeString;
    }
}

// Usar esto en lugar de updateTime() si quieres segundos
// updateTimeWithSeconds();
// setInterval(updateTimeWithSeconds, 1000);
*/

// Sincronización precisa: actualizar en el próximo cambio de minuto
function scheduleNextUpdate() {
    const now = new Date();
    const msUntilNextMinute = 60000 - (now.getSeconds() * 1000 + now.getMilliseconds());
    
    setTimeout(() => {
        updateTime();
        // Después de la primera sincronización, continuar cada minuto
        setInterval(updateTime, 60000);
    }, msUntilNextMinute);
}