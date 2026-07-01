## Objetivo

Hoy los chips de "Comentarios adicionales" son poco claros: "+ Réplicas", "+ Áreas comunes" no dicen qué agregan ni por qué importan, y al tocarlos insertan una pregunta dentro del textarea (raro). Los reemplazamos por un **mini-checklist autoexplicativo** ("Marca lo que aplique") con frases claras. Lo marcado se guarda como **señales aparte del texto libre**, y el textarea queda solo para lo que el residente escriba.

## Comportamiento nuevo

- En vez de pills/chips ambiguos, una lista corta de casillas seleccionables (mismo estilo visual que "Otras señales a revisar", con círculo/check), bajo el encabezado **"Marca lo que aplique (opcional)"**.
- Cada ítem es una frase completa y clara; marcarla = "esto sí aplica en mi caso":
  - "Hubo réplicas fuertes después del sismo"
  - "Se escuchan crujidos o ruidos nuevos en la estructura"
  - "Hay daños en áreas comunes (escaleras, ascensor, tanque, estacionamiento)"
  - "Hay personas mayores, niños o con movilidad reducida en la edificación"
  - "La edificación ya fue evacuada o señalizada por las autoridades"
- Lo marcado NO se escribe en el textarea; se guarda como lista aparte.
- El textarea queda limpio para texto libre, con placeholder de ejemplos (materiales, detalles que la foto no muestra, etc.). El `commentsHint` deja de decir "toca una sugerencia".

```text
Comentarios adicionales (opcional)

Marca lo que aplique:
  ◯ Hubo réplicas fuertes después del sismo
  ◉ Se escuchan crujidos o ruidos nuevos en la estructura
  ◯ Hay daños en áreas comunes (escaleras, ascensor, tanque…)
  ◉ Hay personas mayores, niños o con movilidad reducida
  ◯ La edificación ya fue evacuada o señalizada

Cuéntale al ingeniero lo que la foto no muestra:
┌──────────────────────────────────────────────┐
│  (texto libre)                                 │
└──────────────────────────────────────────────┘
```

## Dónde viajan las señales marcadas

- Se guardan en el borrador y en la evaluación, aparte del texto libre.
- Entran en el prompt de la IA como "Señales adicionales reportadas por el residente".
- Aparecen en el PDF / resumen para el ingeniero como una lista corta, separada del bloque de comentarios.

## Detalles técnicos

1. **`src/lib/assessment-types.ts`**: agregar `contextTags?: string[]` a `PropertyInfo` (guarda las claves: `aftershock`, `noises`, `common`, `people`, `evacuated`).
2. **`src/lib/i18n.tsx`** (ES/EN): reemplazar los textos `checklist.suggest.<key>.text` (hoy preguntas) por las frases afirmativas de arriba; renombrar la etiqueta corta si hace falta. Añadir clave para el encabezado "Marca lo que aplique". Ajustar `commentsHint` y `commentsPlaceholder` para texto libre.
3. **`src/routes/assess/checklist.tsx`**:
   - Estado `selectedTags: string[]`, inicializado desde `draft.property.contextTags`.
   - Sustituir los chips por filas de casilla toggle (reutilizando el patrón visual de "Otras señales a revisar").
   - Eliminar la lógica que concatenaba texto en el textarea.
   - Al continuar: `contextTags: selectedTags.length ? selectedTags : undefined`.
4. **`src/routes/assess/analyze.tsx`**: reenviar `contextTags` (resueltos a las frases localizadas) al server function, junto a `comments`.
5. **`src/lib/assessment.functions.ts`**: `contextTags: z.array(z.string()).max(20).optional()` en el schema, e incluir las frases en el prompt como señales adicionales.
6. **`src/lib/outbox-sync.ts`**: propagar `contextTags` al guardar (igual que `comments`).
7. **`src/lib/pdf.ts`**: renderizar las señales marcadas como lista corta, separada de los comentarios libres.

## Verificación

- Typecheck (`tsgo`) y test `safety-rules`.
- Playwright: marcar/desmarcar ítems, confirmar que el textarea queda intacto y que el estado seleccionado se resalta bien.
