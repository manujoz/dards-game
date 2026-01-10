---
id: juego-dardos-nextjs-shadcn
date: 2026-01-10
status: proposed
authors: [Implementation Planner]
---

# Implementation Plan - Juego de dardos (Next.js + shadcn/ui) táctil y multijugador

## 1. Context & Analysis

- **Goal**: Crear un juego de dardos táctil a pantalla completa (mouse + touch) con diana circular, multijugador por turnos, efectos (sonido/confeti/flash) y rankings persistentes por modo de juego.
- **Tech Stack**: Next.js (App Router) + TypeScript + Tailwind + shadcn/ui + Prisma + SQLite + Zod + Vitest + Docker.
- **Architecture**: App Router con Server Components por defecto; mutaciones y consultas via Server Actions (prohibido API routes). Lógica de juego aislada en dominio puro (sin React) y testeada.

### Decisiones cerradas (según feedback)

#### Plataformas y pantallas

- Objetivo principal: **PC** (navegador moderno).
- Soporte también: **tablets Android e iPad (Safari/Chrome)**.
- Debe funcionar en **landscape (16:9)** y **portrait**; UI totalmente responsive.
- Incluir opción de **Fullscreen API** (ideal para modo kiosco), con fallback si el navegador lo bloquea.

#### Input y registro del dardo

- Registrar impacto en `pointerdown` (touch/pen/mouse) y soportar `mousedown` para modo pruebas.
- Añadir **modo calibración** (obligatorio) para ajustar centro/radio/rotación/offset y compensar marcos del display.
- Añadir **corrección manual**: al menos **undo del último dardo** y opcional **editar último dardo** desde menú oculto.

#### Multijugador

- Máximo **8 jugadores**.
- Soportar **individual** y **equipos 2v2**.
- Soportar formato **partida única** y **legs/sets** (configurable en setup).

#### Menú oculto

- Triple tap/click dentro de **900ms**.
- Auto-ocultar barra tras **6s** de inactividad.
- Acciones mínimas: alta jugadores, iniciar partida, reiniciar, undo, ajustes, rankings, historial. Se proponen extras más abajo.

#### Audio

- No hay audios propios: usar **placeholders** (generados o libres) y encapsularlos para fácil reemplazo.

#### Rankings

- Separar rankings por **modo** y por **variante**.
- Añadir filtros por rango temporal.

#### Despliegue

- **Una sola pantalla/instalación local** con SQLite (persistencia por volumen Docker).
- Persistencia de calibración y preferencias del dispositivo: **SQLite** (no localStorage).

### Principios de UX (táctil) específicos

- Targets táctiles mínimos 44px.
- Prevenir scroll/zoom accidental durante el juego (CSS `touch-action`, listeners pasivos donde aplique).
- Mostrar feedback inmediato: marcador de impacto (punto) + puntuación + sonido.
- Soportar "modo demo" con mouse para desarrollo.

### Catálogo de juegos (objetivo: “cuantos más, mejor”)

Para evitar reglas ambiguas, el catálogo se divide en:

- **MVP (v1)**: juegos con reglas bien definidas y testables desde el inicio.
- **Backlog (v2+)**: juegos adicionales; se implementan incrementando cobertura de tests y documentando reglas en un fichero de reglas.

#### MVP (v1) recomendados

1. **X01**: 301 / 501 / 701 / 901

- Objetivo: bajar a 0.
- Variantes configurables: Straight-In, Double-Out (por defecto), Master-Out.
- Bust: estándar (si se pasa de 0 o queda 1 en Double-Out).

2. **Cricket**

- Números por defecto: 20–15 + Bull.
- Variantes: Standard (con puntos, por defecto), Cut-Throat (puntos “penalizan” al rival).

3. **Round the Clock / Around the Clock**

- Objetivo: impactar 1→20 en orden, y opcional Bull al final.
- Variantes: singles/dobles/triples obligatorios (configurable).

4. **High Score / Count Up**

- Objetivo: sumar máximos puntos en N rondas (por defecto 7) o hasta objetivo.

5. **Shanghai**

- Objetivo: rondas por número; puntos solo en número activo.
- Config: 7 rondas (1–7) por defecto, opcional 20 rondas.

6. **Killer**

- Versión elegida (por defecto): “soft-tip friendly” tipo **double-to-become-killer**.
- Asignación de número: cada jugador obtiene un número único (1–20) al inicio.
- Vidas: cada jugador empieza con 5 vidas.
- Convertirse en killer: impactar el **doble** de tu número te convierte en killer.
- Ataque: siendo killer, impactar el número de un rival le resta vidas (single=1, double=2, triple=3). No se puede bajar de 0.
- Gana el último jugador/equipo con vidas > 0.
- Nota: para 2v2, las vidas pueden ser por jugador (recomendado) o pool por equipo (config).

7. **Halve-It**

- Secuencia de objetivos seleccionable en setup.
- Regla base: si no cumples objetivo del turno, tu score se divide entre 2.

#### Backlog (v2+) sugerido (añadir tantos como se desee)

- **Baseball** (en diana estándar; reglas a documentar).
- **Golf/Dolf-style** (reglas variables; definir versión del proyecto).
- **9 Lives** (eliminar por fallos/vidas).
- **Eliminator / Knockout** (variantes por confirmar).
- **Bob’s 27** (dobles; reglas a documentar y testear).
- **Double Down** (dobles; por confirmar).
- **Split Score** (por confirmar).
- **Tactics / Tactics Cricket**, **Crazy Cricket**, **Wild Cricket**, **Scram** (variantes de Cricket; implementar progresivamente).

### Reglas por defecto (principio: “las más usadas”)

Para reducir fricción al usuario final:

- El setup propone valores por defecto, pero permite cambiar variantes.
- El UI siempre muestra puntuación/estado, incluso en juegos por “marcas”.

**Defaults propuestos**:

- X01: 501, Straight-In, **Double-Out**, Bust estándar.
- Cricket: Standard (con puntos), 20–15+Bull.
- Round the Clock: 1→20 + Bull final, sin dobles/triples obligatorios por defecto.
- High Score: 7 rondas.
- Shanghai: 7 rondas.
- Halve-It: plantilla “estándar” editable.

### Acciones extra recomendadas para el menú oculto

- **Calibrar diana** (modo guiado).
- **Pantalla completa** (toggle).
- **Modo zurdo** (rotación UI/indicadores, no cambia scoring).
- **Bloquear partida** (evitar toques accidentales; requiere confirmar en modal para reanudar).
- **Exportar/limpiar histórico** (solo local).

### Fuentes consultadas (resumen)

- Reglas y variantes generales: Wikipedia ES `Dardos` (301/501/Cricket/High Score/Contabilización/Round the Clock/Killer).
- Resumen de Cricket y variantes: Wikipedia EN `Cricket (darts)`.
- Reglas de puntuación estándar del tablero: Wikipedia EN/ES `Darts/Dardos`.

## 2. Proposed Changes

### File Structure

```tree
# Nuevo proyecto Next.js en /home/apps/dards
.
  package.json  (new)
  pnpm-lock.yaml  (new)
  next.config.ts  (new)
  tsconfig.json  (new)
  eslint.config.mjs  (new)
  postcss.config.mjs  (new)
  tailwind.config.ts  (new)
  components.json  (new, shadcn)
  docker/
    Dockerfile  (new)
    Dockerfile.dev  (new)
  docker-compose.yml  (new)
  docker-compose.dev.yml  (new)
  .env.example  (new)
  docs/
    rules/
      README.md  (new)
      x01.md  (new)
      cricket.md  (new)
      round-the-clock.md  (new)
      high-score.md  (new)
      shanghai.md  (new)
      killer.md  (new)
      halve-it.md  (new)
  prisma/
    schema.prisma  (new)
  src/
    app/
      layout.tsx  (new)
      page.tsx  (new)
      globals.css  (new)
      (game)/
        game/page.tsx  (new)
      (admin)/
        players/page.tsx  (new)
        rankings/page.tsx  (new)
        matches/page.tsx  (new)
    app/actions/
      players.ts  (new)
      matches.ts  (new)
      rankings.ts  (new)
      device-config.ts  (new)
    components/
      ui/  (new, shadcn)
      game/
        DartboardCanvas.tsx  (new)
        TurnHud.tsx  (new)
        HiddenTopBar.tsx  (new)
      players/
        PlayerPickerModal.tsx  (new)
        PlayerCreateModal.tsx  (new)
      matches/
        StartMatchModal.tsx  (new)
        MatchSummaryModal.tsx  (new)
    lib/
      db/prisma.ts  (new)
      game/
        board-geometry.ts  (new)
        score-mapper.ts  (new)
        game-engine.ts  (new)
        games/  (new)
        calibration.ts  (new)
      audio/
        sounds.ts  (new)
      effects/
        confetti.ts  (new)
        flash.ts  (new)
      validation/
        players.ts  (new)
        matches.ts  (new)
        device-config.ts  (new)
    types/
      index.ts  (new)
      components/
        game.ts  (new)
        players.ts  (new)
        matches.ts  (new)
      models/
        darts.ts  (new)
      actions/
        players.ts  (new)
        matches.ts  (new)
        rankings.ts  (new)
      shared/
        api.ts  (new)
  tests/
    game/
      score-mapper.test.ts  (new)
      x01.test.ts  (new)
      cricket.test.ts  (new)
      round-the-clock.test.ts  (new)
      high-score.test.ts  (new)
      shanghai.test.ts  (new)
      killer.test.ts  (new)
      halve-it.test.ts  (new)
```

## 3. Implementation Steps

### Phase 0: Especificación ejecutable (reglas, variantes, UX) — antes de codear

- [x] **Step 0.1**: Crear “Rules Pack” en `docs/rules/README.md`
- **Details**: Documentar qué juegos están en v1 vs backlog y, para v1, fijar objetivo, estado, condiciones de victoria, configuración y ejemplos. `docs/rules` es la fuente de verdad funcional; los tests del motor se derivan de aquí.
- **Verification**: El README enlaza todos los `.md` de reglas de v1.

- [x] **Step 0.2**: Documentar reglas de cada juego v1 (`docs/rules/*.md`)
- **Details**: Escribir reglas concretas de: X01, Cricket, Round the Clock, High Score, Shanghai, Killer y Halve-It. Incluir ejemplos de 2–3 turnos, reglas de bust/cierre y scoreboard esperado.
- **Verification**: Cada doc tiene sección “Inputs”, “Scoring”, “Win”, “Edge cases”.

- [x] **Step 0.3**: Definir contratos del motor (tipos + interfaz) en `src/types/models/darts.ts`
- **Details**: Definir `GameId`, `GameVariant`, `GameConfig`, `GameState`, `Hit`, `Throw`, `Turn`, `Scoreboard`. Diseñar para serializar a DB sin perder info.
- **Verification**: No hay `any` y los tipos se re-exportan en `src/types/index.ts`.

- [x] **Step 0.4**: Cerrar “decisiones de precisión” en docs de reglas
- **Details**: En `docs/rules/halve-it.md` fijar redondeo tras dividir y tratamiento de negativos. En `docs/rules/x01.md` fijar bull como double para Double-Out y reglas exactas de bust/revert.
- **Verification**: Cada decisión aparece en “Edge cases” con al menos 1 ejemplo.

- [x] **Step 0.5**: Definir escenarios canónicos (golden) por juego v1
- **Details**: Para cada juego v1, añadir 3–5 escenarios mínimos (secuencia de hits por jugador) y el scoreboard esperado por turno. Estos escenarios se usarán como base directa de tests.
- **Verification**: Cada `*.md` en `docs/rules/` incluye tabla “Scenario → Expected”.

### Phase 1: Base del proyecto (Next.js + shadcn/ui + Docker)

- [x] **Step 1.1**: Inicializar Next.js en raíz `/home/apps/dards` (`package.json`, `src/`)
- **Details**: Crear app App Router con TypeScript, Tailwind, ESLint, alias `@/* -> ./src/*`, 4 espacios y comillas dobles. Usar pnpm.
- **Verification**: `pnpm lint` y `pnpm build` pasan.

- [x] **Step 1.2**: Instalar y configurar shadcn/ui
- **Details**: Añadir `components.json` y generar componentes shadcn necesarios (Button, Dialog, Sheet, Tabs, Tooltip, Switch, Select, Toast). Mantener `src/components/ui/`.
- **Verification**: Se renderiza un `Dialog` de ejemplo.

- [x] **Step 1.3**: Dockerizar entorno dev y prod
- **Details**: Crear `docker-compose.dev.yml` con hot-reload y volumen para SQLite; `docker-compose.yml` para prod. Añadir healthcheck HTTP.
- **Verification**: En dev, recarga al editar; la DB persiste tras restart.

- [x] **Step 1.4**: Variables de entorno
- **Details**: Crear `.env.example` con `DATABASE_URL` y flags (sonido/efectos, modo demo). Documentar valores default.
- **Verification**: App arranca solo con `.env` derivado del ejemplo.

### Phase 2: Modelo de datos (Prisma + SQLite) — jugadores, partidas, lanzamientos, dispositivo

- [x] **Step 2.1**: Definir schema Prisma en `prisma/schema.prisma`
- **Details**: Modelos mínimos: `Player` (nickname unique, avatar), `DeviceConfig` (calibration JSON, prefs), `Match` (gameId, variant JSON, format single/legs/sets), `MatchTeam`, `MatchParticipant`, `Throw` (hit + coords + computed points), `Leg`/`Set` si se requiere.
- **Verification**: `pnpm prisma validate` pasa.

- [x] **Step 2.2**: Migraciones y seed
- **Details**: Añadir primera migración y seed opcional de 2 jugadores demo. Definir estrategia de reset local.
- **Verification**: `pnpm prisma migrate dev` crea sqlite y tablas.

- [x] **Step 2.3**: Cliente Prisma singleton
- **Details**: Crear `src/lib/db/prisma.ts` con patrón singleton para Next dev.
- **Verification**: No hay warning de múltiples clientes en dev.

### Phase 3: Validación (Zod) + tipos de acciones

- [x] **Step 3.1**: Zod schemas de dominio
- **Details**: Crear `src/lib/validation/players.ts`, `matches.ts` y `device-config.ts`. Validar nickname único, formatos, límites (8 jugadores), y configs por juego.
- **Verification**: Tests unitarios de esquemas aceptan defaults y rechazan inputs inválidos.

- [x] **Step 3.2**: Tipos de retorno de Server Actions
- **Details**: Definir `src/types/actions/*.ts` para retornos consistentes (`success`, `error`, `data`).
- **Verification**: No hay tipos inline en Server Actions.

### Phase 4: Server Actions (sin API routes) — jugadores, partidas, device config, rankings

- [x] **Step 4.1**: Actions de jugadores `src/app/actions/players.ts`
- **Details**: CRUD mínimo: crear y listar. Validar con Zod. Manejar colisiones de nickname con mensaje claro.
- **Verification**: UI de admin crea jugador y lo lista.

- [x] **Step 4.2**: Actions de configuración de dispositivo (calibración/prefs)
- **Details**: Crear `src/app/actions/device-config.ts` para leer/guardar calibración y preferencias. Persistir en SQLite (tabla `DeviceConfig`).
- **Verification**: Guardar calibración y recargar página conserva valores.

- [x] **Step 4.3**: Actions de partidas `src/app/actions/matches.ts`
- **Details**: Crear partida con config (modo, variante, single/legs/sets, 2v2). Registrar `Throw`, hacer undo del último, cerrar leg/set/match y persistir resumen.
- **Verification**: Flujo completo: crear -> 3 throws -> undo -> cerrar match.

- [x] **Step 4.4**: Actions de rankings `src/app/actions/rankings.ts`
- **Details**: Agregaciones por modo+variante y filtro temporal. Métricas: wins, win rate, puntos totales, avg/partida, avg/dardo, bull rate, checkout stats (X01), rachas.
- **Verification**: Top N por modo+variante cambia al cambiar filtro.

### Phase 5: Geometría de diana + mapeo de impacto

- [x] **Step 5.1**: Constantes de tablero `src/lib/game/board-geometry.ts`
- **Details**: Definir radios relativos de anillos (double/triple/bull) y orden de números estándar. Añadir helpers para ángulos.
- **Verification**: Tests verifican orden y rangos.

- [x] **Step 5.2**: `score-mapper.ts` (x,y -> Hit)
- **Details**: Implementar mapping robusto para bull/outer bull, singles, doubles, triples y fuera. Debe operar con coordenadas normalizadas y un estado de calibración.
- **Verification**: `score-mapper.test.ts` cubre bull, triple 20, double 20, fuera.

### Phase 6: Calibración (persistencia SQLite)

- [x] **Step 6.1**: Modelo de calibración en dominio
- **Details**: Definir estructura: centro, radio, rotación, offsets, y opcional corrección de aspect ratio. Debe serializarse a JSON para DB.
- **Verification**: TypeScript infiere JSON-safe y no pierde campos.

- [x] **Step 6.2**: Implementar `src/lib/game/calibration.ts`
- **Details**: Convertir coordenadas de pantalla a espacio de diana aplicando calibración. Añadir helpers para “puntos de control”.
- **Verification**: Tests demuestran que aplicar calibración corrige desvíos.

- [x] **Step 6.3**: Persistir calibración en `DeviceConfig`
- **Details**: Acciones para leer/guardar calibración. Definir política “single row” (id fijo) para instalación local.
- **Verification**: Tras reiniciar contenedor, calibración sigue.

### Phase 7: Motor de juego (turnos, equipos, legs/sets, undo)

- [x] **Step 7.1**: Core de turnos `src/lib/game/game-engine.ts`
- **Details**: Turnos de 3 dardos, rotación de jugador, soporte 2v2, y control de estado (locked, active). Exponer eventos para UI (bull hit).
- **Verification**: Tests de rotación, 2v2, y undo.

- [x] **Step 7.2**: Persistencia de eventos de juego
- **Details**: Definir qué se guarda por `Throw` (hit, multiplier, puntos, coords) y cómo reconstruir estado desde DB para reanudar partida.
- **Verification**: Cargar partida a mitad reproduce scoreboard.

### Phase 8: Framework de reglas por juego (interfaz + tests “primero”) ✅ clave para evitar ambigüedad

- [x] **Step 8.1**: Interfaz común de juegos en `src/lib/game/games/`
- **Details**: Definir contrato: `init(config)`, `applyThrow(state, hit)`, `getScoreboard(state)`, `isFinished(state)`, `getWinner(state)`. Sin React.
- **Verification**: Un “dummy game” compila y pasa tests.

- [x] **Step 8.2**: Test harness para reglas
- **Details**: Crear helpers en `tests/game/` para simular turnos/throws y aserciones comunes (score, marks, bust, winner).
- **Verification**: Reutilizado por al menos 2 juegos.

### Phase 9: Implementación de juegos v1 (test-first, uno por uno, docs → tests → código)

- [x] **Step 9.1**: Escribir tests de X01 en `tests/game/x01.test.ts`
    - **Details**: Convertir los escenarios canónicos de `docs/rules/x01.md` a tests. Incluir: bust, cierre Double-Out, cierre con bull, checkout inválido.
    - **Verification**: Los tests fallan (rojo) antes de implementar X01.

- [x] **Step 9.2**: Implementar X01 en `src/lib/game/games/x01.ts`
    - **Details**: Implementar 301/501/701/901 con Double-Out default y bust estándar. Actualizar stats mínimos (checkout/bust) en el state.
    - **Verification**: `pnpm test` pasa para X01.

- [x] **Step 9.3**: Escribir tests de Cricket en `tests/game/cricket.test.ts`
    - **Details**: Basarse en `docs/rules/cricket.md`. Cubrir: marcar hasta cerrar, puntos solo tras cerrar, y Cut-Throat.
    - **Verification**: Tests fallan antes de implementar Cricket.

- [x] **Step 9.4**: Implementar Cricket en `src/lib/game/games/cricket.ts`
    - **Details**: Implementar marks 15–20+bull con scoring estándar y Cut-Throat. Scoreboard con marcas por jugador y puntos.
    - **Verification**: `pnpm test` pasa para Cricket.

- [x] **Step 9.5**: Escribir tests de Round the Clock en `tests/game/round-the-clock.test.ts`
    - **Details**: Basarse en `docs/rules/round-the-clock.md`. Cubrir: avance correcto, anillo requerido (si se activa), bull final opcional.
    - **Verification**: Tests fallan antes de implementar Round the Clock.

- [x] **Step 9.6**: Implementar Round the Clock en `src/lib/game/games/round-the-clock.ts`
    - **Details**: Implementar progresión 1→20 (+bull opcional) y variantes de anillo requerido. Scoreboard muestra objetivo actual.
    - **Verification**: `pnpm test` pasa para Round the Clock.

- [x] **Step 9.7**: Escribir tests de High Score en `tests/game/high-score.test.ts`
    - **Details**: Basarse en `docs/rules/high-score.md`. Cubrir: fin por rondas, empate (si aplica) y ganador.
    - **Verification**: Tests fallan antes de implementar High Score.

- [x] **Step 9.8**: Implementar High Score en `src/lib/game/games/high-score.ts`
    - **Details**: Implementar N rondas (default 7) con sumatorio. Scoreboard muestra ronda actual y total.
    - **Verification**: `pnpm test` pasa para High Score.

- [x] **Step 9.9**: Escribir tests de Shanghai en `tests/game/shanghai.test.ts`
    - **Details**: Basarse en `docs/rules/shanghai.md`. Cubrir: scoring por ronda y victoria instantánea “Shanghai” cuando esté habilitada.
    - **Verification**: Tests fallan antes de implementar Shanghai.

- [x] **Step 9.10**: Implementar Shanghai en `src/lib/game/games/shanghai.ts`
    - **Details**: Implementar rondas por número con scoring solo del objetivo actual y victoria “Shanghai” opcional.
    - **Verification**: `pnpm test` pasa para Shanghai.

- [x] **Step 9.11**: Escribir tests de Killer en `tests/game/killer.test.ts`
    - **Details**: Basarse en `docs/rules/killer.md`. Cubrir: convertirse killer con doble, daño single/double/triple, eliminación, y 2v2.
    - **Verification**: Tests fallan antes de implementar Killer.

- [x] **Step 9.12**: Implementar Killer en `src/lib/game/games/killer.ts`
    - **Details**: Implementar variante “double-to-become-killer” con vidas y daño según multiplicador. Soportar 2–8 y 2v2.
    - **Verification**: `pnpm test` pasa para Killer.

- [x] **Step 9.13**: Escribir tests de Halve-It en `tests/game/halve-it.test.ts`
    - **Details**: Basarse en `docs/rules/halve-it.md`. Cubrir: objetivo cumplido, objetivo fallido con división y redondeo, y fin de juego.
    - **Verification**: Tests fallan antes de implementar Halve-It.

- [x] **Step 9.14**: Implementar Halve-It en `src/lib/game/games/halve-it.ts`
    - **Details**: Implementar objetivos configurables por ronda. Si no se cumple objetivo del turno, dividir score entre 2 usando el redondeo definido.
    - **Verification**: `pnpm test` pasa para Halve-It.

### Phase 10: UI del juego (pantalla completa, responsive, touch) + HUD

- [x] **Step 10.1**: Página principal `src/app/(game)/game/page.tsx`
- **Details**: Layout full-screen, adaptable a portrait/landscape, safe areas, y prevención de scroll/zoom. Mostrar HUD de turno.
- **Verification**: Rotar dispositivo no rompe diana ni HUD.

- [x] **Step 10.2**: `DartboardCanvas.tsx` (input + dibujo)
- **Details**: Canvas/SVG responsive con `pointerdown`. Convertir coords con calibración leída desde SQLite. Mostrar marcador visual del impacto.
- **Verification**: Tocar bull produce hit bull consistentemente tras calibrar.

- [x] **Step 10.3**: `TurnHud.tsx`
- **Details**: Mostrar jugador/Equipo activo, dardos restantes, score/marks, y feedback del último tiro.
- **Verification**: Cambia correctamente al finalizar turno.

### Phase 11: Menú oculto + modales (setup, calibración, control)

- [x] **Step 11.1**: Detector triple tap/click
- **Details**: Implementar lógica 900ms con tolerancia touch/mouse. Auto-hide 6s si no hay interacción.
- **Verification**: No se activa accidentalmente durante juego normal.

- [x] **Step 11.2**: `HiddenTopBar.tsx` + acciones
- **Details**: Botones: iniciar, reiniciar, undo/editar, fullscreen, sonido, lock, calibrar, rankings, historial.
- **Verification**: Cada botón abre modal (shadcn Dialog) y no navega.

- [x] **Step 11.3**: Modal de inicio de partida
- **Details**: Selector: juego, variante, jugadores (hasta 8), modo 2v2, formato single/legs/sets, defaults preseleccionados.
- **Verification**: Iniciar crea partida y entra en pantalla de juego.

- [x] **Step 11.4**: Modal de calibración guiada
- **Details**: Flujo por pasos para tocar puntos (centro + varios anillos) y derivar parámetros. Guardar en SQLite.
- **Verification**: Tras calibrar, un toque en bull se detecta como bull.

### Phase 12: Sonidos y efectos

- [x] **Step 12.1**: Audio placeholders
- **Details**: Implementar `sounds.ts` con assets placeholder y API simple (hit, bull). Permitir mute/volumen.
- **Verification**: En iOS, audio se activa tras primera interacción.

- [x] **Step 12.2**: Confeti + flash
- **Details**: Efectos 2–3s en bull interno (50). No bloquear input.
- **Verification**: Bull dispara audio+flash+confetti.

### Phase 13: Admin (jugadores, historial, rankings)

- [ ] **Step 13.1**: Pantalla jugadores `src/app/(admin)/players/page.tsx`
- **Details**: Crear/listar jugadores, avatar picker y validación de nickname.
- **Verification**: Nick duplicado se rechaza con mensaje.

- [ ] **Step 13.2**: Pantalla historial `src/app/(admin)/matches/page.tsx`
- **Details**: Listado con filtros por juego/variante/fecha; detalle en modal.
- **Verification**: Abrir detalle muestra throws/resumen.

- [ ] **Step 13.3**: Pantalla rankings `src/app/(admin)/rankings/page.tsx`
- **Details**: Tabs por juego+variante; filtros por rango temporal; top N configurable.
- **Verification**: Cambiar filtro recalcula.

### Phase 14: QA (tests) + documentación

- [ ] **Step 14.1**: Tests del dominio
- **Details**: Asegurar cobertura de score-mapper, calibración, motor y 7 juegos v1. Añadir tests de regresión para bugs encontrados.
- **Verification**: `pnpm test` estable.

- [ ] **Step 14.2**: Checklist táctil
- **Details**: Manual: 30 impactos seguidos, orientación, fullscreen, modales, undo, bull effects, iOS audio.
- **Verification**: Checklist completado y documentado en PR.

- [ ] **Step 14.3**: Documentación `docs/`
- **Details**: Añadir docs de Docker y motor de juego siguiendo estándares del repo.
- **Verification**: Links bidireccionales y footer correcto.

## 4. Verification Plan

- [ ] `pnpm lint` y `pnpm build` sin errores.
- [ ] `pnpm test` (Vitest) pasando.
- [ ] Verificación manual táctil: 30 impactos seguidos sin scroll/zoom (Android + iPad si posible).
- [ ] Verificación de orientación: rotar portrait/landscape y mantener calibración.
- [ ] Verificación de fullscreen: entrar/salir sin romper input.
- [ ] Verificación de bull: sonido especial + flash + confeti 2–3s.
- [ ] Docker dev/prod: build y run exitosos con volumen persistente SQLite.
