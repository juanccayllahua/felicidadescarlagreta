class KaraokeOverlay {
    constructor(audioElement, overlayId, bottomPanelId, toggleButtonId) {
        this.audio = audioElement;
        this.overlay = document.getElementById(overlayId);
        this.bottomPanel = document.getElementById(bottomPanelId);
        this.toggleButton = toggleButtonId ? document.getElementById(toggleButtonId) : null;

        this.lyricsData = [];
        this.currentLine = -1;

        // Variables para arrastre
        this.isDragging = false;
        this.offsetX = 0;
        this.offsetY = 0;

        this.initDrag();
        this.initSync();
        this.initToggle();
        
    }

    loadLyrics(lrcText) {
        this.lyricsData = [];
        this.overlay.innerHTML = '';
        const lines = lrcText.split('\n');

        lines.forEach(line => {
            const match = line.match(/\[(\d+):(\d+\.\d+)\](.*)/);
            if(match){
                const min = parseInt(match[1]);
                const sec = parseFloat(match[2]);
                const text = match[3].trim();
                this.lyricsData.push({time: min*60 + sec, text});

                const div = document.createElement('div');
                div.className = 'lyrics-line';
                div.textContent = text;
                div.style.display = 'none'; // 👈 ocultar inicialmente

                this.overlay.appendChild(div);
            }
        });
    }

    initSync() {
        this.audio.addEventListener('timeupdate', () => {
            const currentTime = this.audio.currentTime;
            const allLines = this.overlay.querySelectorAll('.lyrics-line');
    
            this.lyricsData.forEach((line, index) => {
                const isCurrentLine = currentTime >= line.time &&
                    (index === this.lyricsData.length - 1 || currentTime < this.lyricsData[index + 1].time);
                    
                if (isCurrentLine && this.currentLine !== index) {
                    // Limpiar estados anteriores
                    allLines.forEach(l => l.classList.remove('active', 'fade-out'));
    
                    // Activar línea actual
                    if (allLines[index]) {
                        allLines[index].classList.add('active');
                    }
    
                    // Fade out para líneas anteriores
                    for (let j = 0; j < index; j++) {
                        if (allLines[j]) {
                            allLines[j].classList.add('fade-out');
                        }
                    }
    
                    // Mostrar ventana deslizante de 4 líneas
                    const start = Math.max(0, index - 3);
                    allLines.forEach((lineEl, i) => {
                        lineEl.style.display = (i >= start && i <= index) ? 'block' : 'none';
                    });
    
                    this.currentLine = index;
    
                    // Scroll suave al centro
                    const activeEl = allLines[index];
                    if (activeEl) {
                        const scrollTop = activeEl.offsetTop - (this.overlay.offsetHeight / 2) + (activeEl.offsetHeight / 2);
                        this.overlay.scrollTo({
                            top: scrollTop,
                            behavior: 'smooth'
                        });
                    }
                }
            });
        });
    }

    initDrag() {
        const overlay = this.overlay;

        overlay.addEventListener('mousedown', (e) => {
            this.isDragging = true;
            this.offsetX = e.clientX - overlay.offsetLeft;
            this.offsetY = e.clientY - overlay.offsetTop;
            overlay.style.cursor = 'grabbing';
        });

        document.addEventListener('mousemove', (e) => {
            if(!this.isDragging) return;

            let x = e.clientX - this.offsetX;
            let y = e.clientY - this.offsetY;

            // Limitar dentro de la ventana
            x = Math.max(0, Math.min(x, window.innerWidth - overlay.offsetWidth));
            y = Math.max(0, Math.min(y, window.innerHeight - overlay.offsetHeight));

            overlay.style.left = x + 'px';
            overlay.style.top = y + 'px';
        });

        document.addEventListener('mouseup', () => {
            this.isDragging = false;
            overlay.style.cursor = 'grab';
        });
    }
 
    initToggle() {
        if(!this.toggleButton) return;
        this.toggleButton.addEventListener('click', () => {
            if(this.overlay.style.display === 'none' || this.overlay.style.display === '') {
                this.overlay.style.display = 'flex';
            } else {
                this.overlay.style.display = 'none';
            }
        });
    }
    
}

// Hacemos la clase global para usarla sin módulos
window.KaraokeOverlay = KaraokeOverlay;



