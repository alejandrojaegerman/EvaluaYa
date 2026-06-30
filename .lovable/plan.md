# Mejorar copy de paredes + 5 ilustraciones del checklist

Objetivo: que el residente entienda visual y semánticamente cada pregunta. Cambiamos el copy de "moneda de canto" y rehacemos 5 ilustraciones que no comunican bien. Mismo estilo de dos paneles ❌/❌ vs ✅, fondo crema, trazo verde/teal, 1024×512. No se toca el algoritmo.

## 1. Copy de Paredes (P1) — quitar "moneda de canto"

En Venezuela no se usa esa referencia. Se reemplaza por **dedo meñique** (≈ 1 cm, siempre a mano).

En `src/lib/i18n.tsx`:
- ES `item.walls.q`: "...en diagonal, en X, o **más anchas que tu dedo meñique**)?"
- ES `item.walls.example.yes`: "Grietas nuevas en diagonal o en forma de X, **o tan anchas que entra tu dedo meñique**."
- EN `item.walls.q`: "...diagonal, X-shaped, or **wider than your pinky finger**)?"
- EN `item.walls.example.yes`: "New diagonal or X-shaped cracks, **or wide enough to fit your pinky finger**."
- Por consistencia, también el legacy `item.interior_walls.example.yes` (ES) cambia "lápiz o moneda de canto" → "tu dedo meñique (más de 1 cm)".

## 2. Ilustraciones a rehacer

Cada una mantiene el formato actual (círculo rojo ❌ arriba-izq, verde ✅ arriba-der, divisor punteado).

**a) Puertas/ventanas (P3)** — `src/assets/checklist/doors_windows.jpg`
La actual no muestra que la puerta esté trabada.
- ❌: marco de puerta deformado (romboidal/torcido), puerta atascada sin poder cerrar, con cuña/sombra de roce en el borde y flechita de "no abre".
- ✅: marco rectangular a escuadra, puerta cerrando perfecto.

**b) Inclinación / desplome (P4)** — nuevo `src/assets/checklist/tilt.jpg`
Hoy reusa `foundation.jpg` (una caja agrietada) que parece pared, no inclinación.
- ❌: edificio de varios pisos claramente inclinado hacia un lado, con línea vertical punteada (plomada) de referencia que evidencia el desplome; un piso hundido.
- ✅: el mismo edificio recto y a nivel junto a la línea vertical.
- Se remapea `tilt` a este nuevo asset en `checklist-illustrations.ts`. `foundation.jpg` se deja intacto para registros antiguos.

**c) Techo** — `src/assets/checklist/roof.jpg`
La de dos casitas no comunica colapso/hundimiento.
- ❌: línea de techo hundida/pandeada con una sección caída y hueco (vista clara del techo cediendo).
- ✅: techo recto y parejo.

**d) Escaleras** — `src/assets/checklist/stairs.jpg`
La grieta tipo "culebra" y la escalera flotando no se entienden.
- ❌: escalera con grieta horizontal marcada en los escalones **y** separada del muro (se ve la pared a un lado y el espacio/gap).
- ✅: escalera firme, pegada al muro, sin grietas.

**e) Suelo / licuefacción** — `src/assets/checklist/liquefaction.jpg`
El panel ✅ muestra una casa (incoherente con un panel de "suelo").
- ❌: terreno con agua y arena brotando (volcanes de arena), grietas en el suelo y un poste/objeto inclinado hundiéndose.
- ✅: el **mismo terreno** firme y seco, plano, sin grietas (comparación suelo-suelo, sin casa).

## 3. Verificación
- Abrir `/assess/checklist`, expandir cada "¿Cómo se ve?" y confirmar que las 5 imágenes comunican la señal correcta.
- Confirmar el nuevo copy de la P1 (meñique) en ES y EN.
- Los tests del algoritmo siguen pasando (sin cambios de lógica).

### Detalles técnicos
- Imágenes generadas con la herramienta de imágenes a sus rutas en `src/assets/checklist/` (imports estáticos de Vite; solo `tilt.jpg` requiere un import nuevo + cambio de mapeo en `checklist-illustrations.ts`).
- `foundation.jpg` permanece para back-compat de `foundation` (id legacy ya no preguntado).

## Siguiente paso
Cuando compartas el documento oficial venezolano, comparamos estas ilustraciones contra sus imágenes y ajustamos lo que haga falta.