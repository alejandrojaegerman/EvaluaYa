## Objetivo

Ajustar el copy del bloque "Ingenieros voluntarios" (`/voluntarios`) para reflejar lo acordado: **cada familia que pide ayuda siempre recibe la evaluación/orientación de un ingeniero voluntario** (no es opcional ni condicionado). Se mantiene la nota legal como está.

## Cambio (solo copy)

En `src/lib/i18n.tsx`, actualizar `vol.subtitle` en ES (línea 1189) y EN (línea 2777). No se toca la nota legal (`vol.legalNote`, línea 102) ni `vol.how3`.

### Propuesta ES
> "Iniciativa comunitaria. Cada familia que pide ayuda tras su autoevaluación siempre recibe la evaluación de un ingeniero voluntario: la orientas primero por videollamada y, si hace falta, con una visita presencial."

### Propuesta EN
> "A community initiative. Every family that asks for help after their self-assessment always gets a volunteer engineer's assessment: you guide them first over a video call, and with an in-person visit if needed."

## Notas
- No cambia estructura, ícono ni el enlace al aviso legal.
- Mantiene el término "ingeniero voluntario" (sin "verificado", coherente con cambios previos).
- Verificaré que el texto se vea bien en el bloque en móvil y escritorio.
