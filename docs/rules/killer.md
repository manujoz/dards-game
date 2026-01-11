# Killer

## Visión General

Killer es un juego de eliminación y supervivencia. Cada jugador tiene asignado un número único en la diana y debe convertirse en "Killer" para poder atacar a sus oponentes. El último jugador con vidas restantes gana.

## Configuración

### Vidas

- **3 vidas**: Partida rápida
- **5 vidas**: Estándar (por defecto)

### Asignación de Números

Cada jugador recibe un número único del 1 al 20:

- **Selección Manual**: Cada jugador elige su número
- **Aleatoria**: El sistema asigna números al azar

### Opciones Adicionales

- **Auto-Suicidio**: Desactivado por defecto (golpear tu propio número como Killer no te quita vidas)

## Mecánica del Juego

### Estados del Jugador

**Estado Normal**

- No puedes atacar a otros jugadores
- Tu objetivo: Golpear el **doble** de tu número asignado para convertirte en Killer
- Los impactos en otros números no tienen efecto

**Estado Killer**

- Puedes atacar a otros jugadores
- Una vez que eres Killer, permaneces como Killer el resto de la partida
- Tu objetivo: Eliminar a todos los oponentes

### Cómo Convertirse en Killer

Debes acertar el **doble** de tu número asignado:

- Si tu número es el 10, debes golpear el **Doble 10**
- Los simples o triples de tu número no te convierten en Killer
- Una vez que aciertas tu doble, inmediatamente te conviertes en Killer

### Sistema de Ataque

Cuando eres Killer, cada impacto en el número de un oponente le quita vidas:

- **Simple**: -1 vida
- **Doble**: -2 vidas
- **Triple**: -3 vidas

### Eliminación

Un jugador es eliminado cuando sus vidas llegan a 0 o menos.

## Cómo Ganar

El último jugador (o equipo) que conserve al menos 1 vida es el ganador.

## Reglas Especiales

- **Exceso de daño**: Si un ataque quita más vidas de las que le quedan al oponente, simplemente es eliminado (sin bonificación extra)
- **Golpear tu propio número siendo Killer**: No tiene efecto (salvo que se active la opción Auto-Suicidio)
- **Golpear tu propio número siendo Normal**: No tiene efecto
- **Golpear a un jugador eliminado**: No tiene efecto

## Ejemplos de Juego

### Ejemplo 1: Convertirse en Killer

**Configuración**: 5 vidas. Número del Jugador A: 10  
**Estado inicial**: Jugador A es Normal

**Turno del Jugador A:**

1. **Primer dardo**: 10 Simple → Sin efecto (necesitas el doble)
2. **Segundo dardo**: 10 Doble → **¡Te conviertes en Killer!**
3. **Tercer dardo**: 10 Simple → Sin efecto (golpeas tu propio número siendo Killer)

**Resultado**: A es ahora Killer con 5 vidas.

---

### Ejemplo 2: Atacar y eliminar

**Configuración**: 5 vidas  
**Situación**:

- Jugador A es Killer (número 10)
- Jugador B tiene el número 20 y le quedan 3 vidas

**Turno del Jugador A:**

1. **Primer dardo**: 20 Simple → B pierde 1 vida (le quedan 2)
2. **Segundo dardo**: 20 Triple → B pierde 3 vidas (resultado: -1)

**Resultado**: Jugador B es **eliminado**.

---

### Ejemplo 3: Turno mixto (convertirse y atacar)

**Configuración**: 5 vidas  
**Situación**:

- Jugador A (número 10) es Normal
- Jugador B (número 20) es Normal con 5 vidas

**Turno del Jugador A:**

1. **Primer dardo**: 20 Triple → Sin efecto (A aún no es Killer)
2. **Segundo dardo**: 10 Doble → **A se convierte en Killer**
3. **Tercer dardo**: 20 Simple → B pierde 1 vida

**Resultado**: A es Killer. B tiene 4 vidas.
