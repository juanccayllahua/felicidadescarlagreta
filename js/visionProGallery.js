// === GALERÍA VISION PRO ===
class VisionProGallery {
    constructor() {
        this.images = [
            { src: 'images/c24.jpeg', alt: 'Recuerdo 1' },
            { src: 'images/images.jpg', alt: 'Recuerdo 2' },
            { src: 'images/recuerdo3.jpg', alt: 'Recuerdo 3' },
            { src: 'images/recuerdo4.jpg', alt: 'Recuerdo 4' },
            { src: 'images/recuerdo5.jpg', alt: 'Recuerdo 5' },
            // Fallback con imágenes online si no tienes las locales
            { src: 'https://picsum.photos/800/600?random=1', alt: 'Paisaje 1' },
            { src: 'https://picsum.photos/800/600?random=2', alt: 'Paisaje 2' },
            { src: 'https://picsum.photos/800/600?random=3', alt: 'Paisaje 3' },
        ];
        
        this.currentIndex = 0;
        this.isVisible = false;
        
        this.initializeElements();
        this.setupEventListeners();
        this.generateThumbnails();
    }
    
    initializeElements() {
        this.gallery = document.getElementById('vision-gallery');
        this.galleryImage = document.getElementById('gallery-image');
        this.galleryClose = document.getElementById('gallery-close');
        this.galleryPrev = document.getElementById('gallery-prev');
        this.galleryNext = document.getElementById('gallery-next');
        this.currentIndexEl = document.getElementById('current-index');
        this.totalImagesEl = document.getElementById('total-images');
        this.thumbnailsGrid = document.getElementById('thumbnails-grid');
        this.galleryLoading = document.getElementById('gallery-loading');
        
        // Actualizar contador total
        this.totalImagesEl.textContent = this.images.length;
    }
    
    setupEventListeners() {
        // Cerrar galería
        this.galleryClose.addEventListener('click', () => this.close());
        
        // Navegación
        this.galleryPrev.addEventListener('click', () => this.previous());
        this.galleryNext.addEventListener('click', () => this.next());
        
        // Teclado
        document.addEventListener('keydown', (e) => {
            if (!this.isVisible) return;
            
            switch(e.key) {
                case 'Escape':
                    this.close();
                    break;
                case 'ArrowLeft':
                    this.previous();
                    break;
                case 'ArrowRight':
                    this.next();
                    break;
            }
        });
        
        // Click fuera de la imagen para cerrar
        this.gallery.addEventListener('click', (e) => {
            if (e.target === this.gallery) {
                this.close();
            }
        });
    }
    
    generateThumbnails() {
        this.thumbnailsGrid.innerHTML = '';
        
        this.images.forEach((image, index) => {
            const thumbnail = document.createElement('div');
            thumbnail.className = 'thumbnail';
            thumbnail.innerHTML = `<img src="${image.src}" alt="${image.alt}">`;
            
            thumbnail.addEventListener('click', () => {
                this.goToImage(index);
            });
            
            this.thumbnailsGrid.appendChild(thumbnail);
        });
    }
    
    open(startIndex = 0) {
        this.currentIndex = startIndex;
        this.isVisible = true;
        this.gallery.classList.add('visible');
        document.body.style.overflow = 'hidden'; // Prevenir scroll
        this.displayImage();
        this.updateThumbnails();
        
        // Efecto de entrada
        setTimeout(() => {
            this.galleryImage.classList.add('fade-in');
        }, 100);
    }
    
    close() {
        this.isVisible = false;
        this.gallery.classList.remove('visible');
        document.body.style.overflow = ''; // Restaurar scroll
        this.galleryImage.classList.remove('fade-in');
    }
    
    next() {
        this.currentIndex = (this.currentIndex + 1) % this.images.length;
        this.displayImage();
        this.updateThumbnails();
    }
    
    previous() {
        this.currentIndex = (this.currentIndex - 1 + this.images.length) % this.images.length;
        this.displayImage();
        this.updateThumbnails();
    }
    
    goToImage(index) {
        this.currentIndex = index;
        this.displayImage();
        this.updateThumbnails();
    }
    
    displayImage() {
        const currentImage = this.images[this.currentIndex];
        
        // Mostrar loading
        this.galleryLoading.style.display = 'block';
        this.galleryImage.style.opacity = '0';
        
        // Precargar imagen
        const img = new Image();
        img.onload = () => {
            // Ocultar loading
            this.galleryLoading.style.display = 'none';
            
            // Mostrar imagen con transición
            this.galleryImage.src = currentImage.src;
            this.galleryImage.alt = currentImage.alt;
            this.galleryImage.style.opacity = '1';
            
            // Efecto de entrada
            this.galleryImage.classList.remove('fade-in');
            setTimeout(() => {
                this.galleryImage.classList.add('fade-in');
            }, 50);
        };
        
        img.onerror = () => {
            // Si la imagen falla, usar una imagen de fallback
            console.warn(`Error cargando imagen: ${currentImage.src}`);
            this.galleryLoading.style.display = 'none';
            this.galleryImage.src = `https://picsum.photos/800/600?random=${this.currentIndex + 10}`;
            this.galleryImage.style.opacity = '1';
        };
        
        img.src = currentImage.src;
        
        // Actualizar contador
        this.currentIndexEl.textContent = this.currentIndex + 1;
    }
    
    updateThumbnails() {
        const thumbnails = this.thumbnailsGrid.querySelectorAll('.thumbnail');
        thumbnails.forEach((thumb, index) => {
            thumb.classList.toggle('active', index === this.currentIndex);
        });
    }
    
    // Método para agregar nuevas imágenes
    addImage(src, alt) {
        this.images.push({ src, alt });
        this.totalImagesEl.textContent = this.images.length;
        this.generateThumbnails();
    }
    
    // Método para cambiar todas las imágenes
    setImages(newImages) {
        this.images = newImages;
        this.currentIndex = 0;
        this.totalImagesEl.textContent = this.images.length;
        this.generateThumbnails();
    }
}

// === INICIALIZACIÓN ===
document.addEventListener('DOMContentLoaded', () => {
    // Crear instancia de la galería
    window.visionGallery = new VisionProGallery();
    
    // Conectar con el botón de recuerdos
    const memoryCard = document.querySelector('.memory-card');
    if (memoryCard) {
        memoryCard.addEventListener('click', () => {
            window.visionGallery.open();
            console.log('🖼️ Abriendo galería Vision Pro');
        });
    }
    
    // También puedes abrirla desde cualquier lugar con:
    // window.visionGallery.open(índice_inicial);
});

// === FUNCIONES GLOBALES DE UTILIDAD ===
window.openGallery = (startIndex = 0) => {
    if (window.visionGallery) {
        window.visionGallery.open(startIndex);
    }
};

window.addImageToGallery = (src, alt = 'Nuevo recuerdo') => {
    if (window.visionGallery) {
        window.visionGallery.addImage(src, alt);
        console.log(`📷 Imagen agregada: ${src}`);
    }
};

// Ejemplo de cómo cambiar todas las imágenes:
window.setGalleryImages = (images) => {
    if (window.visionGallery) {
        window.visionGallery.setImages(images);
        console.log('🎨 Galería actualizada con nuevas imágenes');
    }
};