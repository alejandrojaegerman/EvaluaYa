# Propuestas de mejora del algoritmo alineadas al proceso oficial

> **No cambia el scoring actual.** Este documento recopila oportunidades de
> alineación con la metodología oficial (Boletín 61 / Planilla V22b) para
> discutir y validar con un ingeniero antes de implementar.

## Contexto

El scoring actual de EvalúaYa (ver `src/lib/assessment-types.ts` y la lógica de
niveles 🟢🟡🟠🔴) es una **verificación visual rápida preliminar**, no oficial.
La Planilla V22b oficial captura señales que hoy no ponderamos explícitamente.

## Oportunidades identificadas (para validar)

1. **Inclinación / desaplome global de la estructura.**
   La planilla oficial da alto peso al desplome del edificio. Podríamos añadir
   una pregunta/foto específica de inclinación visible (marco de puerta, plomada
   improvisada) y escalarla directo a nivel alto.

2. **Daño en elementos verticales (columnas) vs. no estructurales.**
   Distinguir explícitamente daño en columnas/vigas (crítico) de daño en muros
   de relleno/tabiquería (menos crítico), en línea con la clasificación oficial.

3. **Piso blando / planta baja comercial.**
   Edificios con planta baja abierta (locales, estacionamiento) tienen mayor
   vulnerabilidad. Capturar este dato del formulario de propiedad y usarlo como
   modificador de riesgo.

4. **Falla de columna corta.**
   Señal reconocida en la práctica; grietas en X en columnas cortas junto a
   ventanas altas. Añadir ejemplo visual y ponderación.

5. **Cambio de condiciones / réplicas.**
   La propia planilla oficial reconoce que "las condiciones de estabilidad
   pueden cambiar". Recomendar re-evaluación tras réplicas fuertes.

## Principios de implementación

- Cualquier cambio de scoring debe **revisarse con un ingeniero** y documentarse.
- Mantener el lenguaje de "hallazgos visuales preliminares", nunca veredicto.
- Toda salida sigue remitiendo a Protección Civil / FUNVISIS para la etiqueta
  oficial.

## Estado

Pendiente de validación técnica. **No implementado** en el scoring vigente.
