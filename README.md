# 🎯 Dards Game

Videojuego de dardos para pantallas táctiles con soporte multijugador por turnos. Motor de juego puro en TypeScript con 7 modos de juego distintos.

## 🚀 Inicio Rápido

```bash
# Instalar dependencias
pnpm install

# Configurar base de datos
pnpm dlx prisma migrate dev
pnpm dlx prisma db seed

# Desarrollo local
pnpm dev
```

**Accesos**:

- **Juego**: http://localhost:3010/game
- **Admin Jugadores**: http://localhost:3010/players
- **Admin Partidas**: http://localhost:3010/matches
- **Rankings**: http://localhost:3010/rankings

## 📚 Documentación

La documentación completa está disponible en **español** en [docs/README.md](./docs/README.md):

- [**🎯 Documentación Principal**](./docs/README.md) - Visión general del proyecto
- [**📐 Arquitectura**](./docs/architecture/README.md) - Motor de juego, flujo de datos
- [**🔌 API**](./docs/api/README.md) - Server Actions, validación
- [**🎨 Componentes**](./docs/components/README.md) - DartboardCanvas, calibración
- [**🚀 Despliegue**](./docs/deployment/README.md) - Netlify + Supabase, variables de entorno
- [**📖 Reglas de Juego**](./docs/rules/README.md) - Especificaciones de los 7 modos

## 🎮 Modos de Juego (v1)

| Modo                | Descripción                                                   |
| :------------------ | :------------------------------------------------------------ |
| **X01**             | Countdown clásico (301, 501, etc.)                            |
| **Cricket**         | Cerrar números 15-20 + Bull para puntuar                      |
| **Round the Clock** | Golpear números 1-20 en secuencia                             |
| **High Score**      | Máximo puntaje en rondas fijas                                |
| **Shanghai**        | Puntuar en número activo 1-7. Combo gana instantáneo          |
| **Killer**          | Eliminar oponentes golpeando su número asignado               |
| **Halve-It**        | Golpear objetivos específicos o dividir tu puntaje a la mitad |

## 🛠️ Stack Tecnológico

- **Framework**: Next.js 16 (App Router) + React 19
- **UI**: Shadcn/ui + Tailwind CSS
- **Base de Datos**: Prisma + Supabase (Postgres)
- **Validación**: Zod
- **Testing**: Vitest
- **Deploy**: Netlify (plugin Next.js)
- **Audio**: Web Audio API

## 📂 Estructura del Proyecto

```
src/
├── app/                    # Next.js App Router
│   ├── (admin)/           # Rutas de administración
│   ├── (game)/            # Ruta del juego
│   └── actions/           # Server Actions
├── components/
│   ├── admin/             # Componentes de admin
│   ├── game/              # Componentes del juego
│   └── ui/                # Shadcn/ui primitivos
├── lib/
│   ├── game/              # Motor de juego (lógica pura)
│   │   ├── games/         # Handlers por modo de juego
│   │   ├── game-engine.ts # Orquestador de turnos
│   │   ├── score-mapper.ts # Mapeo de coordenadas
│   │   └── calibration.ts # Sistema de calibración
│   ├── db/                # Cliente Prisma
│   ├── audio/             # Sistema de sonidos
│   └── validation/        # Schemas Zod
├── types/                 # Definiciones TypeScript
└── tests/                 # Tests con Vitest
```

## 🧪 Testing

```bash
# Ejecutar tests
pnpm test

# Watch mode
pnpm test --watch

# Coverage
pnpm test --coverage
```

Tests disponibles:

- `game-engine.test.ts` - Flujo de turnos, inmutabilidad
- `x01.test.ts` - Lógica de X01 (bust, double out)
- `cricket.test.ts` - Marcas y cierre de números
- `calibration.test.ts` - Transformaciones affine

## 📋 Scripts Disponibles

```bash
pnpm dev              # Next.js dev server (Turbopack)
pnpm build            # Build de producción
pnpm start            # Servidor de producción
pnpm lint             # ESLint
pnpm lint:fix         # ESLint con auto-fix
pnpm test             # Vitest
```

## 🎯 Características Clave

### Motor de Juego Puro

- **Inmutabilidad**: Todas las operaciones retornan nuevo estado
- **Sin dependencias UI**: Lógica testeable independiente del frontend
- **Handlers modulares**: Cada modo de juego tiene su propio handler
- **Validación de reglas**: Win conditions y validación de tiros por modo

### Sistema de Calibración

- **3 puntos de referencia**: Bull, 20, 3
- **Transformación affine**: Corrección de perspectiva y rotación
- **Detección polar**: Conversión a ángulo/radio para mapping preciso
- **Persistencia**: Configuración guardada por dispositivo

### Server Actions

- **Sin API Routes**: Mutaciones directas con `"use server"`
- **Validación Zod**: Schemas definidos en `/lib/validation`
- **Transacciones Prisma**: Consistencia de datos
- **Cache invalidation**: `revalidatePath()` tras mutaciones

## 🔧 Configuración

### Variables de Entorno

```env
# .env.local
DATABASE_URL="postgresql://USER:PASSWORD@POOLER_HOST:6543/postgres?pgbouncer=true&sslmode=require&connection_limit=1&pool_timeout=0"
DIRECT_URL="postgresql://USER:PASSWORD@DB_HOST:5432/postgres?sslmode=require"
NODE_ENV="development"
```

### Prisma

```bash
# Aplicar migraciones
pnpm dlx prisma migrate dev

# Abrir Prisma Studio
pnpm dlx prisma studio

# Regenerar cliente
pnpm dlx prisma generate

# Seed de datos iniciales
pnpm dlx prisma db seed
```

## 📝 Convenciones

### Commits (Commitlint)

Formato: `type(scope): prefix subject`

**Types**: `feat`, `fix`, `refactor`, `docs`, `test`, `chore`, `style`, `perf`

**Prefixes**: `add`, `fix`, `update`, `remove`, `change`, `create`, `test`

**Ejemplos**:

```bash
feat(game): add Shanghai mode implementation
fix(calibration): update affine transform calculation
refactor(engine): change turn validation logic
```

### Código

- **Indentación**: 4 espacios
- **Quotes**: Dobles (`"string"`)
- **Max Line Length**: 150 caracteres
- **Naming**:
    - Componentes: PascalCase (`GameController`)
    - Funciones: camelCase (`processThrow`)
    - Constantes: UPPER_SNAKE_CASE (`MAX_THROWS`)

## 🤝 Contribución

1. Crear branch desde `master`
2. Seguir convenciones de commits
3. Escribir tests para nueva lógica
4. Ejecutar `pnpm lint:fix` antes de commit
5. Verificar build con `pnpm build`
6. Crear Pull Request

## 📄 Licencia

---

**Desarrollado con**: Next.js 16 • React 19 • TypeScript • Prisma • Tailwind CSS
