# Documento de Trabajo #2 — Simplificación + rework del algoritmo

Reestructurar sin romper. El producto central del algoritmo para el ingeniero es el `risk_level` (es la llave de prioridad del panel), así que el rework preserva las señales validadas por ingenieros civiles.

## Decisiones cerradas

- Fotos: **carrusel único acumulativo** estilo WhatsApp; **fachada obligatoria**; etiqueta por foto **opcional** (solo para la IA).
- Disparadores ROJO perdidos → **1 pregunta consolidada opcional** tratada como **único disparador ROJO** (cualquier "sí" = rojo).
- Sistema estructural → **campo avanzado 100% opcional** (la regla URM/CMF aplica solo si se llena).
- "¿Se ve inclinado desde afuera?" → **sí = ROJO directo** (apoyado por foto de fachada).
- Prioridad del panel: por ahora **riesgo desc + más antiguo**; cercanía/zona más impactada se evalúa luego (vista del ingeniero, Doc #3).
- Google Maps: **conectado**.

---

## Fase 1 — 🔴 Las dos fotos críticas

### 1A. Carrusel del residente (`PhotoCarousel`)

- Repositorio **único acumulativo** (varias tandas sin borrar lo previo).
- Galería múltiple + cámara directa, mezclables.
- Thumbnails con scroll horizontal, eliminar con "X", reordenar, **contador "X de N"**, tope **10**.
- **Slot de Fachada obligatorio** marcado aparte; etiqueta opcional por foto (estructura/paredes/vías/fachada/otra).
- Robustez: compresión cliente (`compressImageToDataUrl`), **progreso por foto**, **reintento automático**, sin congelar ni perder lo cargado.

### 1B. Visor del ingeniero (`PhotoLightbox`)

- Pantalla completa con **zoom (pinch + doble-tap)** y **navegación carrusel** (swipe/flechas) + contador.
- Thumbnail ligero en lista, imagen full bajo demanda.
- Integrado en reporte `/a/$publicId` y en `EngineerRequestCard` (**mín. 3 thumbnails** por caso).

---

## Fase 2 — 🔴 Dos páginas + ubicación con Maps

### Página 1 — Solicitante y edificación

**Solicitante:** Nombre y Apellido*, Contacto WhatsApp*, ¿Vive en el edificio? sí/no, ¿Junta de condominio? sí/no, **Cédula opcional**.
**Edificación:** Estado*, Municipio*, **Parroquia*** (sube a obligatorio), **Ubicación corta OBLIGATORIA** + geolocalización (placeholder "Cebucán, Edificio Los Álamos"), Nombre del edificio, Tipo, Nº pisos + **Nº sótanos** (nuevo), Antigüedad **opcional**, Sistema estructural **avanzado/opcional colapsado**.
**Maps:** geolocalización del dispositivo + autocomplete (Places API New) por nombre+localidad → guardar `place_id` + lat/lng; pin manual o GPS de respaldo → el ingeniero recibe **pin + "Cómo llegar"**.

### Página 2 — Daños y fotos

4 preguntas sí/no/no sé + 1 consolidada opcional:

1. ¿Daños en estructura (columnas, vigas, losas)?
2. ¿Daños en paredes?
3. ¿Daños en vías de escape?
4. Desde afuera, ¿el edificio se ve inclinado?
5. Coloquemos esta como obligatorio por favor, necesitamos tooltips a lo que se refiere esto, nadie entiende esto recuerda que tiene que ser rapido para la persona.  ¿Grietas en el suelo, edificios chocando, u olor a gas?

Más: **carrusel de fotos (Fase 1)** + **Comentarios adicionales**.
**Quitar:** cimientos/licuefacción/suelo como ítems separados, servicios, "reporta solo daños nuevos", "¿No puedes entrar?", "gratis 2 min".

---

## Fase 3 — Rework del algoritmo (preservando lo validado)

### Mapeo preguntas viejas → nuevas

```text
foundation + columns_beams + roof      → Q1 structure_damage
exterior_walls + interior_walls        → Q2 walls_damage
stairs + doors_windows                 → Q3 egress_damage
(nuevo)                                → Q4 building_tilt
liquefaction + pounding + plumbing     → Q5 severe_signs (opcional, 1 trigger ROJO)
flooring/electrical/fixtures           → se retiran (bajo valor de triaje)
```

### Reglas determinísticas reescritas (`safety-rules.ts`)

- **RED forzado:** Q4 tilt=sí · Q5 severe_signs=sí · sismo severo + cualquier (Q1/Q2/Q3)=sí · (Q1 estructura=sí Y Q3 vías=sí) · URM(si se dio) + (daño o sismo moderado).
- **ORANGE:** Q1 o Q3 = sí (un sistema estructural) · URM solo (si se dio) · sismo severo solo · demanda espectral ≥0.4g · suelo muy blando.
- **YELLOW:** Q2 paredes solo · sismo moderado · suelo blando · pisos>7 · CMF/CIW/PCF/RML (si se dio).
- Final = `maxRisk(IA, reglas)` (sin cambios en la mecánica).

### Señales internas conservadas (no se muestran como campos técnicos)

ShakeMap (MMI/PGA/PGV/espectral/suelo) automático, nº pisos, antigüedad (cuando exista), nº sótanos. 

IA y provisional

- Prompt (`assessment.functions.ts`) actualizado a las 4+1 preguntas, **fachada + set completo de fotos**, `structuralType="unknown"` cuando no se dio. Mantiene contexto sísmico y de "mismo edificio".
- `provisional.ts`: heurística sobre Q1/Q3 (sí→orange, dos→red), Q4/Q5 sí→red, Q2 sí→yellow.

### Resultado (sin dictamen)

"Hallazgos preliminares" + mensaje "Recibimos tu solicitud… un ingeniero voluntario la revisará y se contactará contigo. Hay muchas solicitudes, paciencia." Ruteo obligatorio al ingeniero. El `risk_level` sigue siendo la llave de prioridad del panel (orden actual intacto).

---

## Detalles técnicos

- **Modelo de datos:** `photos[]` a nivel de assessment (`label?`, `isFacade`) en vez de fotos por ítem. Migración aditiva en `assessments`/`help_requests`: `subasements`, `lives_in_building`, `is_condo_board`, `cedula`, `short_location`, `place_id`, `lat`, `lng`; `parroquia` requerida. **Se conservan** columnas e ids viejos para que los reportes existentes sigan mostrándose (fallback).
- **Tipos:** `ChecklistItemId` se extiende con los nuevos ids; enum Zod en `assessment.functions.ts` y `draft-store` actualizados. Cédula: obligatoria ingeniero / opcional residente; lógica "vivienda ya revisada" por cédula para evitar duplicados.
- **Almacenamiento:** bucket `assessment-photos`, layout `${publicId}/photo-${i}.jpg`; key-photo + presupuesto para la IA (mismo costo de créditos).
- **i18n ES/EN:** nuevas claves de campos, microcopys del carrusel (contador, errores, reintento, fachada), reglas reescritas y mensaje de hallazgos preliminares.
- **PDF y reporte:** usan `photos[]` + lightbox.

## Nota Google Maps (acción tuya)

La conexión administrada solo carga en `*.lovable.app`. En **evaluaya.app** el mapa/autocomplete no funcionará hasta conectar **tu propia API key** de Google con `https://evaluaya.app/*` y `https://*.evaluaya.app/*` en restricciones de referente. Te guío al llegar a la Fase 2; en preview funciona.

## Criterios de aceptación

- Carrusel acumulativo fluido (8–10 fotos como WhatsApp), fachada obligatoria, eliminar/contador/reintento.
- Ingeniero abre foto → pantalla completa con zoom y navegación; ≥3 thumbnails en lista.
- Form ≤ 2 páginas; ubicación corta obligatoria + "Cómo llegar".
- Algoritmo: ningún disparador ROJO de vida-seguridad se pierde; tilt=rojo; URM vive vía campo opcional; prioridad del panel intacta.
- Hallazgos preliminares + ruteo a ingeniero, sin dictamen.