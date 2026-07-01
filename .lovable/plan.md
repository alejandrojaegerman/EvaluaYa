## Objetivo

Hacer el aviso corto de la home (`home.legalNotice`) más explícito y consistente con el copy legal que ya existe (`legal.s1.body`), dejando claro que la herramienta **no reemplaza** ni la ayuda de un ingeniero civil colegiado ni la evaluación oficial de FUNVISIS o Protección Civil.

## Cambio (solo copy)

En `src/lib/i18n.tsx`, actualizar dos claves:

- **ES** (`home.legalNotice`, ~línea 855): de
  > "Esto no reemplaza la evaluación de un ingeniero. Lee el aviso legal."  
  > a algo como:  
  > "Orientación preliminar. No reemplaza a un ingeniero civil colegiado ni la evaluación oficial de FUNVISIS o Protección Civil. Lee el aviso legal." Prefiero yo rodrigo estte
- **EN** (`home.legalNotice`, ~línea 2446): de
  > "This does not replace an engineer's assessment. Read the legal notice."
  > a:
  > "Preliminary guidance. It does not replace a licensed civil engineer or an official assessment by FUNVISIS or Civil Protection. Read the legal notice."

## Notas

- No cambia estructura ni la ruta del enlace (sigue a `/legal`).
- El texto queda alineado con `legal.s1.body`, que ya menciona ingeniero colegiado, FUNVISIS y Protección Civil.
- Verificaré que el bloque en la home se siga viendo bien con el texto un poco más largo (icono + texto + chevron).