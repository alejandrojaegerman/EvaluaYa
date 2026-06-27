# Cambiar "edificios evaluados" → "evaluaciones"

## Problema
La tarjeta de estadísticas del Home muestra el número total de filas de evaluación, pero lo etiqueta como "edificios evaluados". Como varias evaluaciones pueden venir del mismo edificio (distintos apartamentos), el conteo no representa edificios distintos. Debe decir "evaluaciones".

## Cambio principal (solo texto / i18n)
En `src/lib/i18n.tsx`, la clave `home.statBuildings`:
- Español: `"edificios evaluados"` → `"evaluaciones realizadas"`
- Inglés: `"buildings assessed"` → `"assessments"`

(Se cambia solo el texto visible; la clave interna `home.statBuildings` se mantiene para no tocar `src/routes/index.tsx`.)

## Auditoría de consistencia (todas las superficies)
Revisé dónde se cuentan o resumen evaluaciones en la app. Estado actual:

```
Superficie            Etiqueta actual            Acción
--------------------  -------------------------  ----------------------------
Home (stat total)     "edificios evaluados"      CAMBIAR → "evaluaciones"
Home (stat zonas)     "zonas con reportes"       OK (mide zonas, no edificios)
Mapa (métrica total)  "Evaluaciones"             OK (ya correcto)
Mapa (top zonas)      "reportes"                 OK
Zona/estado           "Reportes en el estado"    OK
Admin (dashboard)     "Evaluaciones"             OK (ya correcto)
Admin "Edificios con  conteo de agrupación       OK (mide edificios a
varios reportes"      por edificio               propósito — es la función
                                                 de clustering)
Tarjeta social/OG     "Daños estructurales       OK (no cuenta edificios)
                      reportados"
```

Conclusión: la única etiqueta que confunde un conteo de evaluaciones con edificios distintos es la del Home. Las demás ya usan "evaluaciones" o "reportes" correctamente, así que no requieren cambios.

## Consistencia opcional de redacción
El CTA del mapa `map.startCta` dice "Evalúa tu edificio" (ES) / "Assess your building" (EN). No es un conteo, pero para alinear con el héroe del Home ("Evalúa la seguridad de tu vivienda") se puede cambiar a "Evalúa tu vivienda" / "Assess your home". Lo incluyo solo si lo apruebas; no afecta el problema central.

## Notas técnicas
- Único archivo a editar: `src/lib/i18n.tsx` (1 par de strings, +1 opcional).
- Sin cambios en lógica, datos, ni nombres de claves i18n; no rompe `index.tsx`.
- Verificación: typecheck y revisión visual del Home (ES e EN) confirmando que la tarjeta muestra "evaluaciones".
