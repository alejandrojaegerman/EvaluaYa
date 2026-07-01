## Objetivo

Mejorar el subtítulo del hero de la home, quitando "Sin registro. Funciona con poca señal." por copy que comunique mejor el valor.

## Cambio (solo copy)

En `src/lib/i18n.tsx`, actualizar `home.heroSubtitle` en ES (línea 33) y EN (línea 1631). El título (`home.heroTitle`) se mantiene igual.

### Opción recomendada (A) — enfoque en rapidez + ingeniero

- **ES:** "Revisa los daños de tu casa en minutos con una guía paso a paso y conéctate con un ingeniero civil voluntario."
- **EN:** "Review your home's damage in minutes with a step-by-step guide and connect with a volunteer civil engineer."

### Opción B — enfoque en tranquilidad/seguridad

- **ES:** "En pocos minutos, revisa los daños de tu vivienda paso a paso y sabe qué hacer después del sismo."
- **EN:** "In a few minutes, review your home's damage step by step and know what to do after the quake."

### Opción C — más directo/urgente

- **ES:** "Guía paso a paso para revisar daños estructurales y recibir orientación después de un temblor."
- **EN:** "Step-by-step guide to review structural damage and get guidance after a tremor."

Recomiendo la **Opción A** porque resalta lo rápido y el respaldo del ingeniero voluntario (diferenciador clave). Dime cuál prefieres o ajusto el texto. 

Vamos con opción A por favor

## Notas

- No cambia estructura, botón ni la ilustración.
- Verificaré que el texto quepa bien en el hero móvil.