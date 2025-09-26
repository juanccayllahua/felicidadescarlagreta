// ================================
// VARIABLES GLOBALES
// ================================
let scene, camera, renderer;
let effectGroup;
let flowerPetals = [];
let atomElectrons = [];
let globe = null;
let hexMeshes = [];
let balloons = [];
let currentEffect = "globe";
let autoInterval = null;

// Configuración de cumpleaños
let birthdayOverlayTimeout = null;
const ceilingY = 60;
const ceilingSlots = [];
const slotSpacing = 12;
const maxSlots = 12;

// ================================
// UTILIDADES COMUNES (PRINCIPALES OPTIMIZACIONES)
// ================================

// Paletas de colores centralizadas
const COLOR_PALETTES = {
    neon: [
        new THREE.Color("#ff2d95"), // rosa
        new THREE.Color("#00faff"), // cyan
        new THREE.Color("#b300ff"), // morado
        new THREE.Color("#faff00")  // amarillo
    ],
    barca: [0x004d98, 0xa50044, 0xffd100],
    hexagon: [
        [new THREE.Color(0x6a0dad), new THREE.Color(0xe0b3ff)], // morado
        [new THREE.Color(0x228b22), new THREE.Color(0xadff2f)], // verde
        [new THREE.Color(0x0066cc), new THREE.Color(0x99e6ff)]  // celeste
    ],
    hexWave: [
        new THREE.Color(0xffd700), // Oro (girasol)
        new THREE.Color(0xff69b4), // Rosa fuerte
        new THREE.Color(0xffa500), // Naranja (girasol)
        new THREE.Color(0xdc143c), // Rojo cereza (rosa)
        new THREE.Color(0xffb347), // Naranja suave (girasol)
        new THREE.Color(0xff1493), // Rosa intenso
        new THREE.Color(0xf0e68c), // Caqui claro (girasol)
        new THREE.Color(0xffc0cb)  // Rosa claro
    ],
    vibrant: [
        new THREE.Color(0xff0080), new THREE.Color(0xff00ff), new THREE.Color(0x8000ff),
        new THREE.Color(0x4000ff), new THREE.Color(0x0080ff), new THREE.Color(0x00ffff),
        new THREE.Color(0x00ff80), new THREE.Color(0x80ff00), new THREE.Color(0xffff00),
        new THREE.Color(0xff8000), new THREE.Color(0xff4000)
    ],
    romantic: [
        [new THREE.Color(0xff1493), new THREE.Color(0xffc0cb)], // Rosa intenso a rosa claro
        [new THREE.Color(0xdc143c), new THREE.Color(0xffb6c1)], // Rojo cereza a rosa pálido  
        [new THREE.Color(0xff69b4), new THREE.Color(0xfff0f5)], // Rosa fuerte a lavanda
        [new THREE.Color(0xff6347), new THREE.Color(0xffe4e1)], // Coral a misty rose
        [new THREE.Color(0xc71585), new THREE.Color(0xdda0dd)], // Magenta a ciruela claro
        [new THREE.Color(0xff20b2), new THREE.Color(0xf8bbd9)]  // Rosa neón a rosa suave
    ],
};

// Funciones de utilidad para materiales (evita repetición)
function createBasicMaterial(color, transparent = true, opacity = 0.7) {
    return new THREE.MeshBasicMaterial({
        color: color,
        transparent: transparent,
        opacity: opacity
    });
}

function createLineMaterial(color, opacity = 1.0, linewidth = 1) {
    return new THREE.LineBasicMaterial({
        color: color,
        transparent: opacity < 1.0,
        opacity: opacity,
        linewidth: linewidth
    });
}

function createPointMaterial(size = 2, vertexColors = true, opacity = 0.7) {
    return new THREE.PointsMaterial({
        size: size,
        vertexColors: vertexColors,
        transparent: true,
        opacity: opacity
    });
}

// Función de limpieza unificada
function clearEffect() {
    effectGroup.children.forEach(child => {
        if (child.geometry) child.geometry.dispose();
        if (child.material) {
            if (Array.isArray(child.material)) {
                child.material.forEach(mat => mat.dispose());
            } else {
                child.material.dispose();
            }
        }
    });

    effectGroup.clear();

    // Resetear todos los arrays
    flowerPetals.length = 0;
    atomElectrons.length = 0;
    hexMeshes.length = 0;
    balloons.length = 0;

    globe = null;
    effectGroup.rotation.set(0, 0, 0);
    effectGroup.position.set(0, 0, 0);
}

// Generador de formas común (pero específico por tipo)
// REEMPLAZA la función createGeometry existente por esta versión completa:
function createGeometry(type, params = {}) {
    switch (type) {
        case 'heart':
            const shape = new THREE.Shape();
            const size = params.size || 10;
            shape.moveTo(0, -size / 2);
            shape.bezierCurveTo(size / 2, -size * 1.5, size * 1.5, size / 3, 0, size);
            shape.bezierCurveTo(-size * 1.5, size / 3, -size / 2, -size * 1.5, 0, -size / 2);
            return new THREE.BufferGeometry().setFromPoints(shape.getPoints(20));

        case 'petal':
            const petalShape = new THREE.Shape();
            const petalWidth = params.width || 10;
            const petalLength = params.length || 30;
            petalShape.moveTo(0, 0);
            petalShape.quadraticCurveTo(petalWidth, petalLength / 2, 0, petalLength);
            petalShape.quadraticCurveTo(-petalWidth, petalLength / 2, 0, 0);
            return new THREE.BufferGeometry().setFromPoints(petalShape.getPoints(20));

        case 'circle':
            return new THREE.CircleGeometry(params.radius || params.size || 6, params.segments || 16);

        case 'sphere':
            return new THREE.SphereGeometry(
                params.radius || params.size || 5,
                params.widthSegments || 16,
                params.heightSegments || 16
            );

        case 'hexagon':
            const hexPoints = [];
            const hexSize = params.size || params.radius || 6;
            for (let i = 0; i <= 6; i++) {
                const angle = (i / 6) * Math.PI * 2;
                hexPoints.push(new THREE.Vector3(
                    Math.cos(angle) * hexSize,
                    Math.sin(angle) * hexSize,
                    0
                ));
            }
            return new THREE.BufferGeometry().setFromPoints(hexPoints);

        case 'triangle':
            const triSize = params.size || params.radius || 6;
            const triPoints = [
                new THREE.Vector3(0, triSize, 0),
                new THREE.Vector3(-triSize * 0.866, -triSize * 0.5, 0),
                new THREE.Vector3(triSize * 0.866, -triSize * 0.5, 0),
                new THREE.Vector3(0, triSize, 0) // Cerrar el triángulo
            ];
            return new THREE.BufferGeometry().setFromPoints(triPoints);

        // NUEVA GEOMETRÍA DE ASTERISCO/ESTRELLA
        case 'asterisk':
            const asteriskPoints = [];
            const asterSize = params.size || params.radius || 4;

            // Crear asterisco con 4 líneas que se cruzan
            // Línea vertical
            asteriskPoints.push(new THREE.Vector3(0, asterSize, 0));
            asteriskPoints.push(new THREE.Vector3(0, -asterSize, 0));
            asteriskPoints.push(new THREE.Vector3(0, 0, 0)); // Volver al centro

            // Línea horizontal  
            asteriskPoints.push(new THREE.Vector3(-asterSize, 0, 0));
            asteriskPoints.push(new THREE.Vector3(asterSize, 0, 0));
            asteriskPoints.push(new THREE.Vector3(0, 0, 0)); // Volver al centro

            // Línea diagonal /
            asteriskPoints.push(new THREE.Vector3(-asterSize * 0.7, -asterSize * 0.7, 0));
            asteriskPoints.push(new THREE.Vector3(asterSize * 0.7, asterSize * 0.7, 0));
            asteriskPoints.push(new THREE.Vector3(0, 0, 0)); // Volver al centro

            // Línea diagonal \
            asteriskPoints.push(new THREE.Vector3(-asterSize * 0.7, asterSize * 0.7, 0));
            asteriskPoints.push(new THREE.Vector3(asterSize * 0.7, -asterSize * 0.7, 0));

            return new THREE.BufferGeometry().setFromPoints(asteriskPoints);

        default:
            return new THREE.CircleGeometry(6, 6);
    }
}
// ================================
// EFECTOS MANTENIENDO FUNCIONALIDAD ORIGINAL
// ================================

function createFlowerPetals() {
    clearEffect();
    const petalCount = 20;
    const radius = 50;

    for (let i = 0; i < petalCount; i++) {
        const angle = (i / petalCount) * Math.PI * 2;

        const geometry = createGeometry('petal', { width: 10, length: 30 });
        const material = createLineMaterial((i % 2 === 0) ? 0x6ee7ff : 0x34d399);
        const line = new THREE.Line(geometry, material);

        line.rotation.z = angle;
        line.position.x = Math.cos(angle) * radius;
        line.position.y = Math.sin(angle) * radius;

        flowerPetals.push(line);
        effectGroup.add(line);
    }
}



function createHexagons() {
    clearEffect();
    
    // Colores vibrantes como los pétalos
    const concertColors = [
        0x6ee7ff, // Cyan brillante
        0x34d399, // Verde esmeralda
        0xff2d95, // Rosa neón
        0xb300ff, // Morado vibrante
        0x00faff, // Celeste brillante
        0xfaff00, // Amarillo neón
        0xff6b6b, // Coral
        0x4ecdc4, // Turquesa
        0x45b7d1, // Azul cielo
        0xf093fb, // Rosa lavanda
        0x4dabf7, // Azul brillante
        0x69db7c  // Verde lima
    ];
    
    // Crear hexágonos en patrón circular como los pétalos
    const hexCount = 16; // Número de hexágonos en el círculo
    const radius = 50;   // Radio del círculo (igual que los pétalos)
    const hexSize = 8;   // Tamaño de cada hexágono
    
    for (let i = 0; i < hexCount; i++) {
        const angle = (i / hexCount) * Math.PI * 2;
        
        // Crear hexágono
        const geometry = createGeometry('hexagon', { size: hexSize });
        
        // Color aleatorio de la paleta (o alternar colores como en pétalos)
        const colorIndex = Math.floor(Math.random() * concertColors.length);
        // Para alternar como en pétalos, usa: const color = (i % 2 === 0) ? 0x6ee7ff : 0x34d399;
        const hexColor = new THREE.Color(concertColors[colorIndex]);
        const material = createLineMaterial(hexColor.getHex(), 0.9, 3);
        
        const hexagon = new THREE.Line(geometry, material);
        
        // Posicionar en círculo (igual que los pétalos)
        hexagon.position.x = Math.cos(angle) * radius;
        hexagon.position.y = Math.sin(angle) * radius;
        hexagon.position.z = 0;
        
        // Rotar hexágono hacia el centro (opcional, como los pétalos se orientan radialmente)
        hexagon.rotation.z = angle + Math.PI / 2; // +90° para orientación radial
        
        hexagon.userData = {
            type: 'hexagon',
            originalColor: hexColor.clone(),
            baseX: hexagon.position.x,
            baseY: hexagon.position.y,
            angle: angle,
            index: i,
            pulseSpeed: 0.05 + Math.random() * 0.05,
            rotationSpeed: 0.005 + Math.random() * 0.01,
            offset: Math.random() * Math.PI * 2,
            intensity: 0.5 + Math.random() * 0.5
        };
        
        hexMeshes.push(hexagon);
        effectGroup.add(hexagon);
    }
    
    // Opcional: Agregar hexágono central
    const centralGeometry = createGeometry('hexagon', { size: hexSize * 1.2 });
    const centralColor = new THREE.Color(concertColors[Math.floor(Math.random() * concertColors.length)]);
    const centralMaterial = createLineMaterial(centralColor.getHex(), 1.0, 4);
    
    const centralHexagon = new THREE.Line(centralGeometry, centralMaterial);
    centralHexagon.position.set(0, 0, 0);
    
    centralHexagon.userData = {
        type: 'hexagon_center',
        originalColor: centralColor.clone(),
        baseX: 0,
        baseY: 0,
        pulseSpeed: 0.08,
        rotationSpeed: 0.02,
        offset: 0,
        intensity: 1.0
    };
    
    hexMeshes.push(centralHexagon);
    effectGroup.add(centralHexagon);
    
    // Opcional: Agregar un segundo anillo exterior
    const outerCount = 24;
    const outerRadius = 80;
    const outerSize = 6;
    
    for (let i = 0; i < outerCount; i++) {
        const angle = (i / outerCount) * Math.PI * 2;
        
        const geometry = createGeometry('hexagon', { size: outerSize });
        const colorIndex = Math.floor(Math.random() * concertColors.length);
        const hexColor = new THREE.Color(concertColors[colorIndex]);
        const material = createLineMaterial(hexColor.getHex(), 0.7, 2);
        
        const hexagon = new THREE.Line(geometry, material);
        
        hexagon.position.x = Math.cos(angle) * outerRadius;
        hexagon.position.y = Math.sin(angle) * outerRadius;
        hexagon.position.z = Math.random() * 10 - 5; // Ligera variación en Z
        
        hexagon.rotation.z = angle;
        
        hexagon.userData = {
            type: 'hexagon_outer',
            originalColor: hexColor.clone(),
            baseX: hexagon.position.x,
            baseY: hexagon.position.y,
            angle: angle,
            index: i,
            pulseSpeed: 0.03 + Math.random() * 0.04,
            rotationSpeed: 0.008 + Math.random() * 0.015,
            offset: Math.random() * Math.PI * 2,
            intensity: 0.4 + Math.random() * 0.4
        };
        
        hexMeshes.push(hexagon);
        effectGroup.add(hexagon);
    }
}
// REEMPLAZA LA FUNCIÓN createHexWaveGrid() POR ESTA VERSIÓN GIRASOL:

function createHexWaveGrid() {
    clearEffect();
    const rings = 8; // Más anillos para efecto girasol completo

    for (let ring = 1; ring <= rings; ring++) {
        const ringRadius = ring * 10; // Espaciado más compacto
        let particles;

        // Más densidad en anillos externos (como pétalos)
        if (ring <= 2) {
            particles = 8; // Centro compacto
        } else if (ring <= 5) {
            particles = ring * 6; // Zona media
        } else {
            particles = ring * 8; // Pétalos externos abundantes
        }

        for (let i = 0; i < particles; i++) {
            const angle = (i / particles) * Math.PI * 2;
            const x = Math.cos(angle) * ringRadius;
            const y = Math.sin(angle) * ringRadius;

            // Tamaños variables como girasol real
            let size, segments;
            if (ring <= 2) {
                size = 2; // Centro pequeño y denso
                segments = 16; // Círculos suaves para el centro
            } else if (ring <= 4) {
                size = 3; // Zona de transición
                segments = 8;
            } else {
                size = 4; // Pétalos más grandes
                segments = 6; // Más angulares como pétalos
            }

            const geometry = new THREE.CircleGeometry(size, segments);

            // Colores de girasol real: centro oscuro a pétalos amarillos
            let baseColor;
            if (ring <= 2) {
                // Centro oscuro/marrón como girasol real
                const centerColors = [
                    new THREE.Color(0x8b4513), // Marrón silla
                    new THREE.Color(0x654321), // Marrón oscuro
                    new THREE.Color(0x3e2723)  // Marrón muy oscuro
                ];
                baseColor = centerColors[ring % 3];
            } else if (ring <= 4) {
                // Zona de transición - amarillos/naranjas
                const transitionColors = [
                    new THREE.Color(0xb8860b), // Vara de oro oscuro
                    new THREE.Color(0xdaa520), // Vara de oro
                    new THREE.Color(0xffd700)  // Oro
                ];
                baseColor = transitionColors[ring % 3];
            } else {
                // Pétalos externos - amarillos brillantes
                const petalColors = [
                    new THREE.Color(0xffd700), // Oro
                    new THREE.Color(0xffa500), // Naranja
                    new THREE.Color(0xffb347), // Naranja suave
                    new THREE.Color(0xfff8dc)  // Crema
                ];
                baseColor = petalColors[ring % 4];
            }

            const material = createBasicMaterial(baseColor.getHex(), true, 0.8);

            const mesh = new THREE.Mesh(geometry, material);
            mesh.position.set(x, y, 0);

            mesh.userData = {
                ring: ring,
                angle: angle,
                baseRadius: ringRadius,
                baseX: x,
                baseY: y,
                offset: ring * 0.2 + i * 0.05,
                originalColor: baseColor.clone(),
                isPetal: ring > 4 // Los anillos externos son "pétalos"
            };

            hexMeshes.push(mesh);
            effectGroup.add(mesh);
        }
    }
}
// Función auxiliar para crear partículas de fuego (elimina duplicación)
function createFireParticles(colorHex, offsetX, particleCount = 200) {
    const geometry = new THREE.BufferGeometry();
    const positions = [];
    const sizes = [];
    const colors = [];

    for (let i = 0; i < particleCount; i++) {
        positions.push(
            (Math.random() - 0.5) * 20 + offsetX,
            Math.random() * 40,
            (Math.random() - 0.5) * 20
        );
        sizes.push(Math.random() * 2 + 1);

        const color = new THREE.Color(colorHex);
        colors.push(color.r, color.g, color.b);
    }

    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute('size', new THREE.Float32BufferAttribute(sizes, 1));
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

    const material = createPointMaterial();
    const particles = new THREE.Points(geometry, material);
    particles.userData.velocities = Array.from(
        { length: particleCount },
        () => Math.random() * 0.5 + 0.5
    );

    return particles;
}

function createFireEffect() {
    clearEffect();

    // Usar los colores Barça centralizados
    COLOR_PALETTES.barca.forEach((color, index) => {
        const offsetX = (index - 1) * 40; // -40, 0, 40
        const fire = createFireParticles(color, offsetX);
        effectGroup.add(fire);
    });
}

function createHearts() {
    clearEffect();
    const heartCount = 15;
    const spacing = 20;

    for (let i = 0; i < heartCount; i++) {
        const geometry = createGeometry('heart', { size: 10 });
        const material = createLineMaterial(i % 2 === 0 ? 0xff6ee7 : 0xff34a0);
        const heart = new THREE.Line(geometry, material);

        heart.userData.baseX = (i - heartCount / 2) * spacing;
        heart.userData.baseY = -30;
        heart.position.set(heart.userData.baseX, heart.userData.baseY, 0);
        heart.rotation.z = Math.PI;

        flowerPetals.push(heart);
        effectGroup.add(heart);
    }
}

// Funciones auxiliares para hexMaze (eliminan duplicación de código de formas)
function createLetterPoints(letter, size) {
    const s = size;
    const letterShapes = {
        'C': [
            new THREE.Vector3(s, -s, 0), new THREE.Vector3(-s, -s, 0),
            new THREE.Vector3(-s, s, 0), new THREE.Vector3(s, s, 0)
        ],
        'A': [
            new THREE.Vector3(-s, -s, 0), new THREE.Vector3(0, s, 0),
            new THREE.Vector3(s, -s, 0), new THREE.Vector3(s / 2, 0, 0), new THREE.Vector3(-s / 2, 0, 0)
        ],
        'R': [
            new THREE.Vector3(-s, -s, 0), new THREE.Vector3(-s, s, 0), new THREE.Vector3(s / 2, s, 0),
            new THREE.Vector3(s, s / 2, 0), new THREE.Vector3(s / 2, 0, 0), new THREE.Vector3(-s / 2, 0, 0),
            new THREE.Vector3(s, -s, 0)
        ],
        'L': [
            new THREE.Vector3(-s, s, 0), new THREE.Vector3(-s, -s, 0), new THREE.Vector3(s, -s, 0)
        ],
        'G': [
            new THREE.Vector3(s, s, 0), new THREE.Vector3(-s, s, 0), new THREE.Vector3(-s, -s, 0),
            new THREE.Vector3(s, -s, 0), new THREE.Vector3(s, 0, 0), new THREE.Vector3(0, 0, 0)
        ],
        'E': [
            new THREE.Vector3(s, s, 0), new THREE.Vector3(-s, s, 0), new THREE.Vector3(-s, 0, 0),
            new THREE.Vector3(s / 2, 0, 0), new THREE.Vector3(-s, 0, 0), new THREE.Vector3(-s, -s, 0),
            new THREE.Vector3(s, -s, 0)
        ],
        'T': [
            new THREE.Vector3(-s, s, 0), new THREE.Vector3(s, s, 0),
            new THREE.Vector3(0, s, 0), new THREE.Vector3(0, -s, 0)
        ]
    };

    if (letterShapes[letter]) {
        return letterShapes[letter];
    }

    // Hexágono por defecto
    const hexPoints = [];
    for (let i = 0; i <= 6; i++) {
        const angle = (i / 6) * Math.PI * 2;
        hexPoints.push(new THREE.Vector3(
            Math.cos(angle) * s, Math.sin(angle) * s, 0
        ));
    }
    return hexPoints;
}

function createMazePoints(type, size) {
    const mazeShapes = {
        'L': [
            new THREE.Vector3(-size, -size, 0), new THREE.Vector3(-size, size, 0),
            new THREE.Vector3(0, size, 0), new THREE.Vector3(0, 0, 0),
            new THREE.Vector3(size, 0, 0), new THREE.Vector3(size, -size, 0),
            new THREE.Vector3(-size, -size, 0)
        ],
        'T': [
            new THREE.Vector3(-size, size, 0), new THREE.Vector3(size, size, 0),
            new THREE.Vector3(size, size / 2, 0), new THREE.Vector3(size / 4, size / 2, 0),
            new THREE.Vector3(size / 4, -size, 0), new THREE.Vector3(-size / 4, -size, 0),
            new THREE.Vector3(-size / 4, size / 2, 0), new THREE.Vector3(-size, size / 2, 0),
            new THREE.Vector3(-size, size, 0)
        ],
        'S': [
            new THREE.Vector3(-size, size, 0), new THREE.Vector3(0, size, 0),
            new THREE.Vector3(0, 0, 0), new THREE.Vector3(size, 0, 0),
            new THREE.Vector3(size, -size, 0), new THREE.Vector3(size / 2, -size, 0),
            new THREE.Vector3(size / 2, -size / 2, 0), new THREE.Vector3(-size / 2, -size / 2, 0),
            new THREE.Vector3(-size / 2, size / 2, 0), new THREE.Vector3(-size, size / 2, 0),
            new THREE.Vector3(-size, size, 0)
        ]
    };

    return mazeShapes[type] || createLetterPoints('hex', size);
}
function createHexMaze() {
    clearEffect();

    const cellSize = 15;
    const rows = 20;
    const cols = 30;
    const targetWord = 'CARLAGRETA';

    // Crear letras principales - AJUSTES AQUÍ
    const letterSpacing = cellSize * 1.2; // Reducido de 1.8 a 1.2 para compactar
    const wordWidth = (targetWord.length - 1) * letterSpacing;
    const startX = -wordWidth / 2; // Esto ya centra el texto
    const textY = 0;

    for (let i = 0; i < targetWord.length; i++) {
        const letter = targetWord[i];
        const x = startX + (i * letterSpacing);

        // PRIMERA CAPA - Línea base más gruesa
        const points1 = createLetterPoints(letter, cellSize * 0.4);
        const geometry1 = new THREE.BufferGeometry().setFromPoints(points1);
        const material1 = createLineMaterial(0x8000ff, 1.0, 8); // Línea más gruesa
        const letterLine1 = new THREE.Line(geometry1, material1);

        letterLine1.position.set(x, textY, -0.1); // Ligeramente atrás
        letterLine1.userData = {
            originalColor: new THREE.Color(0x8000ff),
            baseOpacity: 1.0,
            isMainText: true,
            phase: i * 0.1,
            row: -1,
            col: i,
            layer: 'base'
        };

        hexMeshes.push(letterLine1);
        effectGroup.add(letterLine1);

        // SEGUNDA CAPA - Línea superior con puntos ligeramente diferentes
        const points2 = createLetterPoints(letter, cellSize * 0.42); // Ligeramente más grande
        // Añadir pequeña variación a los puntos
        for (let p = 0; p < points2.length; p++) {
            points2[p].x += (Math.random() - 0.5) * 0.3;
            points2[p].y += (Math.random() - 0.5) * 0.3;
        }

        const geometry2 = new THREE.BufferGeometry().setFromPoints(points2);
        const material2 = createLineMaterial(0x9500ff, 0.9, 5); // Color ligeramente diferente y más delgada
        const letterLine2 = new THREE.Line(geometry2, material2);

        letterLine2.position.set(x + 0.2, textY + 0.1, 0.1); // Offset muy pequeño y al frente
        letterLine2.userData = {
            originalColor: new THREE.Color(0x9500ff),
            baseOpacity: 0.9,
            isMainText: true,
            phase: i * 0.1 + 0.05,
            row: -1,
            col: i,
            layer: 'top'
        };

        hexMeshes.push(letterLine2);
        effectGroup.add(letterLine2);
    }

    // Crear formas de fondo
    const shapeTypes = ['L', 'T', 'S', 'C', 'Z', 'hex'];
    const randomLetters = ['B', 'D', 'F', 'H', 'I', 'J', 'K', 'M', 'N', 'O', 'P', 'Q', 'S', 'U', 'V', 'W', 'X', 'Y', 'Z'];

    for (let i = 0; i < rows; i++) {
        for (let j = 0; j < cols; j++) {
            const x = (j - cols / 2) * cellSize + (Math.random() - 0.5) * cellSize * 0.3;
            const y = (i - rows / 2) * cellSize + (Math.random() - 0.5) * cellSize * 0.3;

            // Evitar área del texto - AJUSTE AQUÍ para el nuevo tamaño
            const textAreaMargin = cellSize * 1.5; // Reducido de 2 a 1.5 por las letras más pequeñas
            if (Math.abs(y - textY) < textAreaMargin &&
                x > startX - textAreaMargin &&
                x < startX + wordWidth + textAreaMargin) {
                continue;
            }

            let geometry, shapeType, isLetter = false;

            if (Math.random() < 0.2) {
                const letter = randomLetters[Math.floor(Math.random() * randomLetters.length)];
                const points = createLetterPoints(letter, cellSize * 0.4);
                geometry = new THREE.BufferGeometry().setFromPoints(points);
                shapeType = letter;
                isLetter = true;
            } else {
                shapeType = shapeTypes[Math.floor(Math.random() * shapeTypes.length)];
                const size = cellSize * 0.3 + Math.random() * cellSize * 0.2;
                const points = createMazePoints(shapeType, size);
                geometry = new THREE.BufferGeometry().setFromPoints(points);
            }

            const baseColor = isLetter ?
                COLOR_PALETTES.vibrant[Math.floor(Math.random() * 5)] :
                COLOR_PALETTES.vibrant[Math.floor(Math.random() * COLOR_PALETTES.vibrant.length)];

            const material = createLineMaterial(
                baseColor.getHex(),
                isLetter ? 0.7 : 0.5 + Math.random() * 0.3,
                isLetter ? 2 : 1
            );

            const mazeLine = new THREE.Line(geometry, material);
            mazeLine.position.set(x, y, 0);
            mazeLine.rotation.z = (Math.random() * 4) * Math.PI / 2;

            mazeLine.userData = {
                originalColor: baseColor.clone(),
                baseOpacity: material.opacity,
                row: i,
                col: j,
                phase: (i + j) * 0.2,
                shapeType: shapeType,
                isLetter: isLetter,
                isMainText: false
            };

            hexMeshes.push(mazeLine);
            effectGroup.add(mazeLine);
        }
    }
}
// ================================
// SISTEMA DE CUMPLEAÑOS (SIMPLIFICADO PERO FUNCIONAL)
// ================================

function initializeCeilingSlots() {
    for (let i = 0; i < maxSlots; i++) {
        ceilingSlots.push({
            x: -70 + i * slotSpacing,
            y: ceilingY,
            z: 0,
            taken: false
        });
    }
}

function createBalloon(colorHex, x, y, z) {
    const geometry = createGeometry('sphere');
    const material = createBasicMaterial(colorHex);
    const balloon = new THREE.Mesh(geometry, material);

    const stickPoints = [new THREE.Vector3(0, -5, 0), new THREE.Vector3(0, -15, 0)];
    const stickGeometry = new THREE.BufferGeometry().setFromPoints(stickPoints);
    const stickMaterial = createLineMaterial(0x000000);
    const stick = new THREE.Line(stickGeometry, stickMaterial);

    const group = new THREE.Group();
    group.add(balloon);
    group.add(stick);
    group.position.set(x, y, z);
    group.userData = {
        velocityY: Math.random() * 0.2 + 0.1,
        stuck: false
    };

    effectGroup.add(group);
    balloons.push(group);
}

function launchConfetti() {
    const barcaColors = COLOR_PALETTES.barca.map(color => `#${color.toString(16).padStart(6, '0')}`);

    confetti({
        particleCount: 80, spread: 60, angle: 60,
        origin: { x: 0, y: 1 }, colors: barcaColors
    });

    confetti({
        particleCount: 80, spread: 60, angle: 120,
        origin: { x: 1, y: 1 }, colors: barcaColors
    });
}

function showBirthdayOverlay() {
    let overlay = document.getElementById('birthday-overlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'birthday-overlay';
        overlay.style.cssText = `
        position: absolute;
        top: 30%;
        left: 50%;
        transform: translate(-50%, -50%);
        font-size: 3rem;
        font-weight: bold;
        color: #ffffff; /* relleno de la letra en blanco */
        -webkit-text-stroke: 2px #8b5cf6; /* borde morado */
        font-family: 'Courier New', monospace;
        pointer-events: none;
        opacity: 0;
        transition: opacity 0.5s;
        z-index: 2000;
        white-space: pre;
        
        `;
        document.body.appendChild(overlay);
    }

    overlay.style.opacity = 1;
    overlay.textContent = "";

    const message = "FELIZ CUMPLEAÑOS CARLAGRETA!!";
    let index = 0;

    const interval = setInterval(() => {
        overlay.textContent = message.slice(0, index + 1);
        index++;
        if (index === message.length) {
            clearInterval(interval);
            
            // Después de 6 segundos, mover a la parte inferior en lugar de desaparecer
            if (birthdayOverlayTimeout) clearTimeout(birthdayOverlayTimeout);
            birthdayOverlayTimeout = setTimeout(() => {
                // Mover a la parte inferior en lugar de hacer opacity = 0
                overlay.style.top = 'auto';
                overlay.style.bottom = '20px';
                overlay.style.fontSize = '1.8rem';
                overlay.style.opacity = '0.9';
            }, 6000);
        }
    }, 120);
}

function activateBirthdayEffect() {
    launchConfetti();
    setEffect('fire');

    for (let i = 0; i < 8; i++) {
        const side = i % 2 === 0 ? -1 : 1;
        const x = side * (50 + Math.random() * 20);
        const y = -50;
        const z = (Math.random() - 0.5) * 50;
        const color = COLOR_PALETTES.barca[i % 3];
        createBalloon(color, x, y, z);
    }

    showBirthdayOverlay();
}

// ================================
// SISTEMA PRINCIPAL
// ================================

function init() {
    const canvas = document.getElementById('threejs-canvas');
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 120;

    renderer = new THREE.WebGLRenderer({ canvas, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);

    effectGroup = new THREE.Group();
    scene.add(effectGroup);

    initializeCeilingSlots();
    loadEffect(currentEffect);
    animate();
}

function loadEffect(effectName) {
    const effects = {
        "flower": createFlowerPetals,
        "hexagon": createHexagons,
        "hexWave": createHexWaveGrid,
        "fire": createFireEffect,
        "hearts": createHearts,
        "hexMaze": createHexMaze
    };

    effects[effectName]?.();
}

function setEffect(effect) {
    if (autoInterval) clearInterval(autoInterval);

    if (effect === "auto") {
        const effects = ["flower", "hexagon", "hexWave", "fire", "hearts", "hexMaze"];
        let index = 0;

        autoInterval = setInterval(() => {
            currentEffect = effects[index];
            loadEffect(currentEffect);
            index = (index + 1) % effects.length;
        }, 10000);
    } else {
        currentEffect = effect;
        loadEffect(effect);
    }
}

// ================================
// ANIMACIÓN (MANTENIENDO FUNCIONALIDAD ORIGINAL)
// ================================

function animate() {
    requestAnimationFrame(animate);
    const freqData = window.getFrequencyData();

    // Animaciones específicas por efecto (SIN CAMBIOS FUNCIONALES)
    if (currentEffect === "flower") {
        effectGroup.rotation.z += 0.01;
        flowerPetals.forEach((petal, i) => {
            const intensity = freqData ? freqData[i % freqData.length] / 255 : 0.5;
            petal.material.color.setHSL(intensity, 1, 0.5);
        });
    }
    else if (currentEffect === "hexagon") {
        // DETECTAR SI HAY MÚSICA
        let avgIntensity = 0;
        let maxIntensity = 0;
        let hasMusic = false;
        
        if (freqData && freqData.length > 0) {
            let sum = 0;
            for (let i = 0; i < freqData.length; i++) {
                const val = freqData[i] / 255;
                sum += val;
                if (val > maxIntensity) maxIntensity = val;
            }
            avgIntensity = sum / freqData.length;
            hasMusic = avgIntensity > 0.03 || maxIntensity > 0.15;
        }
        
        const currentTime = Date.now() * 0.001;
        
        hexMeshes.forEach((item, i) => {
            const intensity = hasMusic ? (freqData[i % freqData.length] / 255) : 0;
            
            if (item.userData.type === 'triangle') {
                if (hasMusic) {
                    // CON MÚSICA - Patrón de luces de concierto
                    
                    // Pulso sincronizado con la música
                    const pulse = Math.sin(currentTime * item.userData.pulseSpeed + item.userData.offset) * 0.5 + 0.5;
                    const musicPulse = intensity * 2;
                    const totalPulse = (pulse + musicPulse) * 0.5;
                    
                    // Brillo dinámico como luces LED
                    const brightness = 0.3 + totalPulse * 1.5;
                    const dynamicColor = item.userData.originalColor.clone();
                    dynamicColor.multiplyScalar(brightness);
                    item.material.color.copy(dynamicColor);
                    
                    // Opacidad que pulsa
                    item.material.opacity = 0.5 + totalPulse * 0.5;
                    
                    // Movimiento sutil en Z para profundidad
                    item.position.z = Math.sin(currentTime * 2 + item.userData.row * 0.3 + item.userData.col * 0.2) * 5 * intensity;
                    
                    // Escala que pulsa ligeramente
                    const scale = 1 + totalPulse * 0.3;
                    item.scale.setScalar(scale);
                    
                    // Ondas que se propagan por filas
                    const waveDelay = item.userData.row * 0.1 + item.userData.col * 0.05;
                    const wave = Math.sin(currentTime * 3 - waveDelay) * intensity;
                    
                    // Color que cambia con las ondas
                    if (wave > 0.7) {
                        // Picos de intensidad - colores brillantes alternados
                        const peakColors = [0xff2d95, 0x00faff, 0xfaff00, 0xb300ff];
                        const peakColor = new THREE.Color(peakColors[i % peakColors.length]);
                        item.material.color.copy(peakColor);
                        item.material.opacity = 1.0;
                    }
                    
                } else {
                    // SIN MÚSICA - Luces tenues como standby
                    const dimColor = item.userData.originalColor.clone();
                    dimColor.multiplyScalar(0.2);
                    item.material.color.copy(dimColor);
                    item.material.opacity = 0.3;
                    
                    // Retornar a posición y escala normal
                    item.position.z *= 0.95;
                    const targetScale = 1.0;
                    item.scale.x += (targetScale - item.scale.x) * 0.1;
                    item.scale.y += (targetScale - item.scale.y) * 0.1;
                    item.scale.z += (targetScale - item.scale.z) * 0.1;
                }
                
            } else if (item.userData.type === 'hexagon') {
                // Hexágonos más grandes con comportamiento especial
                if (hasMusic) {
                    // CON MÚSICA - Hexágonos giratorios y pulsantes
                    item.rotation.z += item.userData.rotationSpeed * (1 + intensity * 2);
                    
                    const hexPulse = Math.sin(currentTime * item.userData.pulseSpeed + item.userData.offset);
                    const brightness = 0.5 + (hexPulse * 0.5 + intensity) * 0.8;
                    
                    const hexColor = item.userData.originalColor.clone();
                    hexColor.multiplyScalar(brightness);
                    item.material.color.copy(hexColor);
                    item.material.opacity = 0.7 + intensity * 0.3;
                    
                    // Escala dinámica
                    const hexScale = 1 + (hexPulse * 0.3 + intensity * 0.4);
                    item.scale.setScalar(hexScale);
                    
                } else {
                    // SIN MÚSICA - Rotación lenta y tenue
                    item.rotation.z += item.userData.rotationSpeed * 0.3;
                    
                    const dimHexColor = item.userData.originalColor.clone();
                    dimHexColor.multiplyScalar(0.3);
                    item.material.color.copy(dimHexColor);
                    item.material.opacity = 0.4;
                    
                    // Escala normal
                    const targetScale = 1.0;
                    item.scale.x += (targetScale - item.scale.x) * 0.1;
                    item.scale.y += (targetScale - item.scale.y) * 0.1;
                    item.scale.z += (targetScale - item.scale.z) * 0.1;
                }
            }
        });
        
        // Rotación global muy sutil del patrón completo
        if (hasMusic) {
            effectGroup.rotation.z += avgIntensity * 0.001;
        }
    }
    else if (currentEffect === "hexWave") {
        let avgIntensity = 0;
        let hasMusic = false;

        // Detectar si hay música
        if (freqData && freqData.length > 0) {
            avgIntensity = freqData.reduce((a, b) => a + b, 0) / freqData.length / 255;
            hasMusic = avgIntensity > 0.05; // Solo se activa con música notable
        }

        hexMeshes.forEach((mesh, i) => {
            const ring = mesh.userData.ring;

            if (hasMusic) {
                // CON MÚSICA - Ondas suaves
                const freqIndex = Math.floor((ring / 15) * freqData.length);
                const intensity = freqData[freqIndex] / 255;

                // Ondas muy suaves desde el centro
                const currentTime = Date.now() * 0.0008; // Más lento
                const waveDelay = ring * 0.2;
                const wave = Math.sin(currentTime * 2 - waveDelay) * intensity * 0.5; // Amplitud reducida

                // Expansión sutil
                const radiusMultiplier = 1 + wave * 0.1; // Máximo 10% de expansión
                const newRadius = mesh.userData.baseRadius * radiusMultiplier;

                mesh.position.x = Math.cos(mesh.userData.angle) * newRadius;
                mesh.position.y = Math.sin(mesh.userData.angle) * newRadius;
                mesh.position.z = wave * 6; // Movimiento Z reducido

                // Color suave
                const colorIntensity = 0.6 + intensity * 0.3;
                const color = mesh.userData.originalColor.clone().multiplyScalar(colorIntensity);
                mesh.material.color.copy(color);

                mesh.material.opacity = 0.6 + intensity * 0.2;

            } else {
                // SIN MÚSICA - Completamente estático
                mesh.position.x = mesh.userData.baseX;
                mesh.position.y = mesh.userData.baseY;
                mesh.position.z = 0;

                // Color tenue y fijo
                const color = mesh.userData.originalColor.clone().multiplyScalar(0.4);
                mesh.material.color.copy(color);
                mesh.material.opacity = 0.3;
            }
        });

        // Rotación del grupo solo con música y muy lenta
        if (hasMusic) {
            effectGroup.rotation.z += avgIntensity * 0.002; // Súper lento
        }
    }
    else if (currentEffect === "fire") {
        let avgIntensity = 0;
        if (freqData && freqData.length > 0) {
            avgIntensity = freqData.reduce((a, b) => a + b, 0) / freqData.length / 255;
        }

        effectGroup.children.forEach(group => {
            if (group.isPoints) {
                const positions = group.geometry.attributes.position;
                for (let i = 0; i < positions.count; i++) {
                    const velocity = group.userData.velocities[i] * avgIntensity * 3;
                    positions.setY(i, positions.getY(i) + velocity);
                    if (positions.getY(i) > 50) positions.setY(i, 0);
                }
                positions.needsUpdate = true;
            }
        });
    }
    else if (currentEffect === "hearts") {
        if (freqData && freqData.length > 0) {
            flowerPetals.forEach((heart, i) => {
                const intensity = freqData[i % freqData.length] / 255;
                heart.position.y = heart.userData.baseY + intensity * 40 * Math.sin(Date.now() * 0.005 + i);
                heart.position.x = heart.userData.baseX + Math.sin(Date.now() * 0.002 + i) * 10;

                const baseColor = COLOR_PALETTES.neon[i % COLOR_PALETTES.neon.length];
                const brightened = baseColor.clone().lerp(new THREE.Color(0xffffff), intensity * 0.7);
                heart.material.color.copy(brightened);
            });
        } else {
            flowerPetals.forEach((heart, i) => {
                heart.position.y = heart.userData.baseY;
                heart.position.x = heart.userData.baseX;
                heart.material.color.copy(COLOR_PALETTES.neon[i % COLOR_PALETTES.neon.length]);
            });
        }
    }
    else if (currentEffect === "hexMaze") {
        const currentTime = Date.now() * 0.001;
        let avgIntensity = 0;
        let maxIntensity = 0;
        let hasMusic = false;

        if (freqData && freqData.length > 0) {
            let sum = 0;
            for (let i = 0; i < freqData.length; i++) {
                const val = freqData[i] / 255;
                sum += val;
                if (val > maxIntensity) maxIntensity = val;
            }
            avgIntensity = sum / freqData.length;
            hasMusic = avgIntensity > 0.02 || maxIntensity > 0.1;
        }

        hexMeshes.forEach((line, i) => {
            let finalIntensity = 0;

            if (hasMusic && freqData) {
                const freqIndex = Math.floor((i / hexMeshes.length) * freqData.length);
                const rawIntensity = freqData[freqIndex] / 255;
                const localWeight = 0.7;
                const globalWeight = 0.3;
                finalIntensity = (rawIntensity * localWeight) + (avgIntensity * globalWeight);
                finalIntensity = Math.min(finalIntensity * 2, 1);
            } else {
                finalIntensity = 0.1;
            }

            // Opacidad
            if (hasMusic) {
                const baseOpacity = line.userData.isLetter ? 0.8 : 0.5;
                const opacityRange = line.userData.isLetter ? 0.4 : 0.6;
                const targetOpacity = baseOpacity + (finalIntensity * opacityRange);
                line.material.opacity = targetOpacity;
            } else {
                line.material.opacity = line.userData.isLetter ? 0.4 : 0.2;
            }

            // Color
            if (hasMusic) {
                const brightness = 0.5 + (finalIntensity * 1.5);
                const currentColor = line.userData.originalColor.clone();
                currentColor.multiplyScalar(brightness);
                line.material.color.copy(currentColor);
            } else {
                const dimColor = line.userData.originalColor.clone();
                dimColor.multiplyScalar(0.3);
                line.material.color.copy(dimColor);
            }

            // Movimiento Z
            if (hasMusic) {
                const zMovement = Math.sin(currentTime * 3 + line.userData.row * 0.2) *
                    (line.userData.isLetter ? 8 : 5) * finalIntensity;
                line.position.z = zMovement;
            } else {
                line.position.z *= 0.9;
            }

            // Rotación
            if (hasMusic) {
                const rotationSpeed = 1 + finalIntensity * 2;
                line.rotation.z += Math.sin(currentTime * rotationSpeed + i * 0.2) * 0.05 * finalIntensity;
            }
        });

        // Movimiento del grupo
        if (hasMusic) {
            const groupIntensity = maxIntensity;
            effectGroup.position.x = Math.sin(currentTime * 0.5) * 5 * groupIntensity;
            effectGroup.position.y = Math.cos(currentTime * 0.3) * 3 * groupIntensity;
        } else {
            effectGroup.position.x *= 0.98;
            effectGroup.position.y *= 0.98;
        }
    }

    // Animación de globos
    balloons.forEach(balloon => {
        if (!balloon.userData.stuck) {
            balloon.position.y += balloon.userData.velocityY;

            if (balloon.position.y >= ceilingY) {
                if (Math.random() < 0.4) {
                    const freeSlot = ceilingSlots.find(s => !s.taken);
                    if (freeSlot) {
                        balloon.position.set(freeSlot.x, freeSlot.y, freeSlot.z);
                        balloon.userData.stuck = true;
                        freeSlot.taken = true;
                    }
                } else {
                    balloon.position.y = -50;
                    balloon.position.x = (Math.random() - 0.5) * 100;
                }
            }
        }
    });

    renderer.render(scene, camera);
}

// ================================
// EVENT LISTENERS Y INICIALIZACIÓN
// ================================

document.querySelectorAll("#effect-options .chip")?.forEach(chip => {
    chip.addEventListener("click", () => {
        setEffect(chip.dataset.effect);
    });
});

document.getElementById('birthday-btn')?.addEventListener('click', activateBirthdayEffect);

window.addEventListener("resize", () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// Auto-activar cumpleaños el 23 de septiembre
function checkBirthday() {
    const today = new Date();
    if (today.getDate() === 23 && today.getMonth() === 8) {
        activateBirthdayEffect();
    }
}

document.addEventListener('DOMContentLoaded', checkBirthday);

// Inicializar
init();