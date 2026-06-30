# Agrupar "Gran Caracas" bajo Distrito Capital

## Contexto verificado
- Oficialmente, **Distrito Capital tiene un solo municipio: Libertador**. Por eso el dropdown solo muestra "Libertador".
- Los municipios que la gente asocia con Caracas — **Chacao, Baruta, Sucre (Petare) y El Hatillo** — pertenecen legalmente al estado **Miranda** y ya existen ahí en los datos (`MUNICIPIOS_BY_STATE.Miranda`).
- Solución acordada: mostrarlos como grupo **"Gran Caracas"** cuando el usuario elige Distrito Capital, pero **guardarlos internamente como Miranda** para no romper el mapa, el drill-down `/zona/$estado/$municipio` ni los centroides (`resolveMunicipio`).

## Cambios

### 1. `src/lib/venezuela.ts`
- Exportar una constante `GRAN_CARACAS_MUNICIPIOS = ["Chacao", "Baruta", "Sucre", "El Hatillo"]` (municipios de Miranda que conforman el área metropolitana junto a Libertador).
- Agregar un helper `normalizeCaracasLocation(state, municipality)` que devuelva el estado efectivo: si `state === "Distrito Capital"` y el municipio está en `GRAN_CARACAS_MUNICIPIOS`, devuelve `"Miranda"`; de lo contrario devuelve el estado tal cual. Esto centraliza la corrección de datos.

### 2. `src/routes/assess/property.tsx` (solo UI + guardado)
- En el `<select>` de Municipio, cuando `state === "Distrito Capital"`, renderizar un `<optgroup label={t("picker.granCaracas")}>` con los 4 municipios de `GRAN_CARACAS_MUNICIPIOS`, ubicado después de "Libertador" y antes de "No estoy seguro". (Libertador sigue saliendo como la opción principal de Distrito Capital.)
- En `handleContinue`, antes de `saveDraft`, calcular el estado efectivo con `normalizeCaracasLocation(state, municipality)` y guardar ese valor en `property.state`. Así, si eligen "Chacao" bajo Distrito Capital, se persiste `state: "Miranda"`, `municipality: "Chacao"` y todo el resto del sistema (mapa, drill-down, sitemap) funciona correctamente.
- La validación actual (`municipalitySatisfied` = municipio no vacío) ya acepta estas opciones, no requiere cambios.

### 3. `src/lib/i18n.tsx`
- Agregar la clave `picker.granCaracas`:
  - ES: `"Gran Caracas"`
  - EN: `"Greater Caracas"`

## Notas técnicas
- No se toca la lógica del algoritmo ni los datos oficiales de `MUNICIPIOS_BY_STATE`; solo se agrega una vista de conveniencia en el dropdown y una normalización en el momento de guardar.
- Si el usuario regresa al paso 1 tras guardar, verá el estado como "Miranda" con su municipio seleccionado (comportamiento correcto y consistente con los datos almacenados).
- `resolveMunicipio` ya mapea correctamente "Sucre" en Miranda a Petare, así que el centroide del mapa queda bien.
