[← Volver al Principal](../README.md) | [← Componentes](./README.md) | [Motor de Juego](../architecture/game-engine.md)

---

## Índice

- [Responsabilidades](#responsabilidades)
- [Sistema de Calibración](#sistema-de-calibración)
- [Detección de Toques](#detección-de-toques)
- [Renderizado Visual](#renderizado-visual)

---

## Responsabilidades

`DartboardCanvas` (`src/components/game/DartboardCanvas.tsx`) es un componente client que gestiona la interacción táctil con el tablero de dardos virtual.

### Funcionalidades Clave

1. Renderizado de tablero en Canvas HTML5
2. Captura de eventos touch/click
3. Transformación de coordenadas (pantalla → tablero lógico)
4. Detección de segmento golpeado
5. Feedback visual de tiros

## Sistema de Calibración

### Flujo de Calibración

1. **Usuario inicia calibración** → `CalibrationModal` se abre
2. **Solicitud de 3 puntos**:
    - Bull (centro)
    - 20 (arriba)
    - 3 (abajo-derecha)
3. **Usuario toca cada zona** → Se capturan coordenadas `(x, y)`
4. **Cálculo de transformación affine** → `calculateTransform()`
5. **Guardado en DB** → `saveDeviceConfig()`

### Estructura de Datos

```typescript
type CalibrationPoint = {
    x: number; // Coordenadas de pantalla
    y: number;
    segment: string; // "bull" | "20" | "3"
};

type DeviceConfig = {
    screenWidth: number;
    screenHeight: number;
    calibrationPoints: CalibrationPoint[];
    transform?: TransformMatrix; // Matriz 3x3 para affine transform
};
```

### Transformación Affine

`src/lib/game/calibration.ts` calcula una matriz de transformación que corrige:

- **Traslación**: Descentrado del tablero
- **Rotación**: Tablero no alineado verticalmente
- **Escala**: Tamaño de pantalla vs tamaño lógico del tablero

```typescript
// Mapeo: pantalla (x, y) → tablero lógico (x', y')
const { x: logicalX, y: logicalY } = applyTransform(screenX, screenY, transform);
```

## Detección de Toques

### Flujo de Evento

1. **Touch/Click** → `handleCanvasClick(event)`
2. **Extraer coordenadas** → `event.clientX`, `event.clientY`
3. **Aplicar transformación** → `applyTransform(x, y, calibration)`
4. **Convertir a polar** → `(angle, radius)`
5. **Mapear a segmento** → `mapCoordinatesToSegment(angle, radius)`

### Mapping de Segmentos

`src/lib/game/score-mapper.ts` convierte coordenadas polares en segmentos del tablero:

```typescript
type Segment = {
    number: number;      // 1-20 | 25 (bull)
    multiplier: 1 | 2 | 3; // Single, Double, Triple
    points: number;      // Puntaje resultante
};

// Ejemplo
mapCoordinatesToSegment(90°, 0.95)
// → { number: 20, multiplier: 3, points: 60 } (Triple 20)
```

### Zonas del Tablero

| Radio Normalizado | Zona          | Multiplicador |
| :---------------- | :------------ | :-----------: |
| 0.00 - 0.05       | Inner Bull    |      50       |
| 0.05 - 0.15       | Outer Bull    |      25       |
| 0.15 - 0.55       | Single        |      x1       |
| 0.55 - 0.65       | Triple        |      x3       |
| 0.65 - 0.90       | Single        |      x1       |
| 0.90 - 1.00       | Double        |      x2       |
| > 1.00            | Out of bounds |       0       |

## Renderizado Visual

### Canvas Layers

El canvas dibuja múltiples capas:

1. **Fondo** → Imagen del tablero (SVG o PNG)
2. **Números** → Labels 1-20 alrededor del tablero
3. **Tiros** → Marcadores de dardos lanzados en el turno actual
4. **Highlight** → Zona objetivo (modo Round the Clock)

### Patrón de Dibujo

```typescript
useEffect(() => {
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;

    // Clear
    ctx.clearRect(0, 0, width, height);

    // Draw board
    drawDartboard(ctx, width, height);

    // Draw throws
    currentTurn.throws.forEach(throw => {
        drawDartMarker(ctx, throw.x, throw.y, throw.points);
    });

    // Highlight target (condicional)
    if (targetNumber) {
        highlightSegment(ctx, targetNumber);
    }
}, [currentTurn, targetNumber]);
```

### Optimización

- **RequestAnimationFrame** para animaciones suaves
- **Debounce** en resize para evitar re-renders excesivos
- **Memoización** de imagen del tablero base

---
