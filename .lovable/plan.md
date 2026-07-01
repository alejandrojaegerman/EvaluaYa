# Rework de Nav bar + Home

Meta: que en el inicio lo único protagonista sea **hacer la evaluación**. Todo lo demás pasa a segundo plano u opcional. No se elimina ninguna ruta: solo se reorganizan botones y se reduce texto.

## 1. Nav bar superior (`TopNav.tsx`)

Reordenar por prioridad. Las acciones principales quedan visibles; lo demás se agrupa en el dropdown **"Más"**.

**Visible (izquierda → derecha):**
```text
[Logo EvalúaYa]   Evaluar   Ingenieros voluntarios   ¿Tembló hoy?      [Más ▾]   [🌐 idioma]
```

- **Evaluar** → `/assess/property` (acción #1, destacada). Ícono `ClipboardCheck`.
- **Ingenieros voluntarios** → `/voluntarios`. Ícono `HandHeart`.
- **¿Tembló hoy?** → ruta según idioma (`/temblo-en-venezuela-hoy` / `/earthquake-in-venezuela-today`). Ícono `Waves`.
- Se mantiene el logo (link a Inicio) y el toggle de idioma.

**Dropdown "Más" (todo lo secundario, sin perder rutas):**
- Mapa (`/mapa`)
- Datos (`/datos`)
- Metodología (`/metodologia`)
- Ayuda (`/ayuda`)
- Enviar comentarios (`/feedback`)
- Separador
- Aviso legal (`/legal`)
- Privacidad (`/privacidad`)
- Mis reportes (`/mis-reportes`) — solo si `hasReports`

Se retira el indicador de "online/offline" del top bar (ruido); se mantiene el estado offline vía el `OfflineBanner` existente.

## 2. Nav inferior móvil (`BottomNav.tsx`) — alineación de consistencia

Para que móvil y escritorio prioricen lo mismo (es un PWA mobile-first), ajustar las 4 pestañas fijas a:
```text
[Inicio]   [Evaluar]   [¿Tembló hoy?]   [Más]
```
Dentro de "Más" se agrupan: Mapa, Datos, Voluntarios, Metodología, Mis reportes, Ayuda, Comentarios, **Aviso legal, Privacidad** e idioma. (Hoy faltan legal/privacidad en el sheet; se agregan.)

## 3. Home (`index.tsx`) — menos texto, elegibilidad clara

**a) Eliminar los tags de confianza**
Se quita por completo la fila de píldoras "Gratis · Sin registro · Funciona sin conexión · Anónimo" y la microcopia "Gratis · 2 minutos · sin registro" bajo el hero. Reduce texto y ruido visual (lo señalado en la imagen).

**b) Fila de 2 botones (mismo row)**
Reemplazar las dos tarjetas separadas ("¿Tembló hoy?" y "Mapa comunitario") por **una sola fila con 2 botones lado a lado**:
```text
[ 〰 Acaba de temblar ]   [ 🗺 Mapa comunitario de daños ]
```
- Botón 1 → ¿Tembló hoy? (ruta por idioma)
- Botón 2 → `/mapa`
- En pantallas muy angostas se apilan (grid 2 col → 1 col).

**c) "Explora tu estado" como dropdown**
Cambiar la nube de ~24 chips de estados por un **selector (dropdown)** compacto:
- Un `Select` "Elige tu estado" que al elegir navega a `/zona/$estado` (usando `estadoSlug`).
- Mantiene los estados ordenados por impacto (como hoy) y ocupa mucho menos espacio.

**d) "¿Cómo funciona?" actualizado al proceso actual (2 pasos + resultado)**
Hoy describe 3 pasos con textos algo viejos. Actualizar a los pasos reales:
1. **Datos de la propiedad** — dónde estás y tipo de edificación.
2. **Observa y reporta** — responde y sube fotos de cada área.
3. **Recibe tu resultado** — nivel de riesgo y pasos recomendados.

(Se ajustan las claves `home.how*` en `i18n.tsx` para ES/EN.)

**e) Aviso importante → ícono de información con link legal**
Reemplazar el recuadro grande de "Aviso importante" por un elemento discreto: **ícono `Info` + texto corto** que redirige a **`/legal`** (aviso legal), en lugar del bloque de párrafo actual.

**Se mantiene sin cambios:** hero + CTA principal "Empezar evaluación", tarjeta de envío pendiente (offline), contadores en vivo, sección de ingenieros voluntarios, ShareApp, y evaluaciones recientes.

## Detalles técnicos
- `src/components/TopNav.tsx`: reordenar links, añadir items al `DropdownMenuContent` (incluye legal/privacidad), quitar indicador online.
- `src/components/BottomNav.tsx`: cambiar pestañas fijas y añadir legal/privacidad al sheet.
- `src/routes/index.tsx`: eliminar bloque de trust pills y `timePromise`; fusionar las 2 tarjetas en una fila `grid grid-cols-2` de botones; sustituir chips de estado por `Select` (de `@/components/ui/select`) con `useNavigate`; actualizar sección "cómo funciona"; sustituir el bloque disclaimer por ícono `Info` + `Link` a `/legal`.
- `src/lib/i18n.tsx`: actualizar `home.how3Title`/`home.how3Desc` (y equivalentes) al nuevo paso "Recibe tu resultado"; añadir claves nuevas si hacen falta (ej. label del select, texto corto del aviso legal). Las claves `home.trust*` y `home.timePromise` quedan sin uso (se pueden dejar o limpiar).
- No se elimina ninguna ruta; solo se reubican enlaces.
