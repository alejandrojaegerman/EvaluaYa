# Proceso oficial de evaluación de edificios post-sismo (Venezuela)

> Documento de referencia interno. Base para la ruta `/guia/proceso-oficial-funvisis`
> y para el módulo de contactos oficiales (`/contactos-oficiales`).
>
> **Regla clave:** solo **FUNVISIS** y **Protección Civil** (personal con el
> Certificado de Inspector de Evaluación de Daños) pueden emitir la etiqueta
> oficial. EvalúaYa documenta el proceso y canaliza al usuario, pero **nunca lo
> reemplaza**.

## Documentos oficiales incluidos en el repo

Guardados como assets versionados y descargables desde la app:

| Documento | Archivo | Uso |
|---|---|---|
| Boletín 61 — Evaluación de Daños (ANIH) | `src/assets/official/boletin-61.pdf.asset.json` | Metodología oficial: fases, niveles de daño, criterios |
| Planilla oficial V22b (FUNVISIS) | `src/assets/official/planilla-v22b.pdf.asset.json` | Formato que llena el inspector certificado |

## Las fases oficiales

| Fase | Quién la hace | Rol de EvalúaYa |
|---|---|---|
| **0. Verificación visual rápida** | Comunidad + ingeniero voluntario | **Aquí estamos.** No oficial. |
| **1. Evaluación Rápida oficial** (coloca la etiqueta) | Inspector certificado por la autoridad | El usuario debe solicitarla |
| **2. Inspección Detallada** | Ingeniero especializado | Solo si sale Roja/Amarilla |
| **3. Evaluación Detallada** | Ingeniero estructural | Para reparar/reforzar |

## Etiquetas oficiales ↔ niveles EvalúaYa

| Oficial | Significado | EvalúaYa |
|---|---|---|
| Permitido (Verde) | Uso permitido | 🟢 |
| Restringido (Amarillo) | Uso restringido/limitado | 🟡 / 🟠 |
| No Permitido (Rojo) | No se permite el uso | 🔴 |

> El naranja 🟠 es un matiz propio de EvalúaYa entre amarillo y rojo; no es una
> etiqueta oficial.

## Qué debe hacer el usuario al terminar en EvalúaYa

1. Entender que su resultado es **preliminar y no oficial**.
2. Solicitar la **Evaluación Rápida oficial** a Protección Civil del Gobierno de
   Caracas: **(0212) 575-1823**.
3. En **emergencia / peligro inminente**: VEN **9-1-1** o **0800-PCIVIL1**
   (0800-7248451).
4. Llevar su reporte PDF de EvalúaYa como contexto para el inspector.

## Directorio oficial verificado

Ver `src/lib/official-contacts.ts`. Fuente: comunicado oficial MIPPCI
(28-jun-2026) + web institucional FUNVISIS + prensa (El Diario) para el CIV.

> ⚠️ Números publicados en contexto de contingencia: **revalidar periódicamente**.
> Algunas líneas se desactivan al pasar la fase aguda. Revalidar con Manuel antes
> de cada publicación relevante.
