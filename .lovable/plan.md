## Objetivo

Reestructurar EvalúaYa para blindarla legalmente combinando las recomendaciones del **ingeniero (Manuel)** y del **abogado**, sin convertirla en una herramienta que emita dictámenes ni órdenes. Donde los dos asesores coinciden, ejecutamos; donde difieren (semáforo, registro), aplicamos las decisiones ya tomadas.

> **Regla transversal innegociable:** la app procesa **hallazgos visuales preliminares y referenciales**. No certifica habitabilidad, no emite dictamen, no ordena evacuar/permanecer, no se vincula a ningún organismo oficial.

---

## Tarea 1 — Vocabulario prohibido + reencuadre del semáforo (🔴 Crítica)

Reencuadrar el resultado del residente como **"Hallazgos visuales"** (no veredicto), con sugerencias (nunca órdenes), sujeto a aprobación final de Manuel y el abogado antes de lanzar.

- **Veto de terminología** en toda la UI, PDF y datos: eliminar "habitable/inhabitable", "seguro/inseguro", "bien/mal", "puedes permanecer", "evacúa de inmediato", "no la consideres segura", "uso seguro". Barrer `src/lib/i18n.tsx` (ES+EN) incluyendo `result.*.action`, `provisional.step.*`, `rule.*.step`, `map.legend*`, `data.dict.*`.
- **Escala reetiquetada** (basada en hallazgos, no en seguridad):
  - 🟢 **Hallazgos leves** — sin daños evidentes en elementos de carga. Sugerencia: mantener observación ante réplicas y tambien hacer sugerencia de llamar a un ingeniero de funvisis o proteccion civil o los voluntarios de la aplicación. 
  - 🟡 **Hallazgos moderados** — grietas/desprendimientos menores. Sugerencia: solicitar inspección técnica presencial.
  - 🔴 **Hallazgos severos / alerta** — fallas en columnas/vigas/muros, inclinación, colapso parcial. **Sugerencia (nunca orden):** no ingresar y reportar a cuerpos oficiales y que se coloque la solicitud a los ingenieros d ela aplicación. 
- La IA/lógica determinística sigue **interna** para ordenar y clasificar; lo que se muestra se describe como "lo que observaste/reportaste".
- Quitar del residente: bloque de recomendaciones IA accionables tipo orden y contexto sísmico USGS como justificación de veredicto (queda interno).
- Ok una cosa que se debe de hacer es siempre la ssolciitudes que se hagan sin importar el semaforo, el ingeniero igualmente siempre tiene que verificar la solicitud de revisión. 

## Tarea 2 — Aviso legal bloqueante + consentimiento de datos (🔴 Crítica / 🟠 Alta)

- **Pop-up bloqueante** de visualización obligatoria que impide usar el flujo de evaluación hasta marcar aceptación. Reemplaza el `legal-ack` opcional actual; se persiste con versión y fecha.
- **Cláusulas** (reescribir `src/routes/legal.tsx` + claves `legal.*`):
  - **No oficialidad:** iniciativa privada, independiente y comunitaria; sin vínculo con FUNVISIS, Protección Civil, Bomberos ni organismos del Estado.
  - **Inexistencia de dictamen:** solo hallazgos visuales referenciales; no certifica habitabilidad ni autoriza ingreso.
  - **Fuerza mayor / réplicas:** exclusión por daños de réplicas, factores ambientales o eventos posteriores; uso bajo riesgo del usuario.
- **Consentimiento de datos:** checkbox obligatorio (separado del legal) aceptando el tratamiento de datos solo para gestión de reportes; enlace a privacidad. Guardar y hacer migración en la abse de datos para que cualquier usuario o cualquier reporte que se genere salga que se hizo el check de este consentimiento. 

## Tarea 3 — Datos de contacto del residente (🟠 Alta)

Decisión: del residente solo necesitamos **poder contactarlo** (no cédula obligatoria).

- Captura mínima obligatoria antes de enviar: **nombre + un medio de contacto** (teléfono/WhatsApp o email). Ubicación ya existente (Estado/Municipio + dirección/edificio opcional); añadir **Parroquia** opcional.
- Validación con Zod (cliente + servidor), límites de longitud, sin loguear datos sensibles.
- Persistir `consent_at`, `consent_version`, `legal_ack_at` y el contacto del residente en `assessments`.

## Tarea 4 — Régimen y nomenclatura de evaluadores (🔴 Crítica)

- Prohibir "ingeniero certificado/verificado/aprobado" en superficies públicas. Usar **"Evaluador Voluntario de la Comunidad"** / **"Colaborador Técnico"**. Reservar "ingeniero verificado (CIV)" solo para cuando exista verificación real de carnet (fuera de alcance ahora).
- Barrer `connect.*`, `result.proBadge`, `index.tsx`, `voluntarios.index.tsx`, `datos.tsx`, `mapa.tsx`, `VerifiedEngineers`.
- **Descargo del voluntario por envío:** antes de enviar cada formulario, el evaluador suscribe que el reporte es transcripción de observaciones visuales puntuales, sin dictamen pericial ni responsabilidad civil. Persistir aceptación.
- Datos completos del ingeniero (cédula/CIV/foto) se mantienen **internos** para validación nuestra, no como sello público.

## Tarea 5 — Panel del ingeniero sin recomendaciones IA (🔴 Crítica)

- En `EngineerRequestCard`: quitar `RiskBadge`, "la IA dijo" y el flujo aceptar/ajustar veredicto. El ingeniero ve **ubicación, fotos y contacto**; el nivel queda solo para ordenar la cola. Aca es importante, el UI se va a cambiar y el triage inicial se tiene que quedar pero el ingeniero civil no necesita eso, solo deben ayudarle a priorizar. 
- Mantener USGS del reporte que ve el ingeniero, para verificar como podemos usar esa información, no se elimina luego se reestructura el UI. 

## Tarea 6 — Módulo SOS + directorio de emergencia (🟠 Alta)

- **Banner/botón rojo SOS informativo** sobre peligros evidentes (inclinación, colapso parcial, desprendimientos, crujidos) exhortando al desalojo inmediato.
- **Directorio de emergencia** con marcado directo (911, Bomberos de Caracas, Protección Civil), dejando claro que la app **no gestiona, enruta ni se responsabiliza** por esas comunicaciones.
- **Verificar la veracidad de los números con fuentes oficiales antes de publicarlos** (paso bloqueante).

## Tarea 7 — Glosario visual de educación estructural (🟡 Media)

- Infografía interactiva que distinga **estructural** (columnas, vigas, muros de carga) de **no estructural** (tabiquería, drywall, frisos), reusando lo ya creado en la guía de grietas.
- Patrones de grietas: asentamiento menor vs fallas graves (diagonales 45°, "X" en concreto armado).
- **Notas al pie con fuentes** (FUNVISIS, Protección Civil u homólogos), reiterando carácter ilustrativo.
- Investigar y conseguir estas imagenes por favor. 

## Tarea 8 — Datos públicos, PDF y documentación interna

- **Datos públicos agregados:** mantener agregados **anónimos** por zona, reetiquetados como "hallazgos visuales" (mapa, `/datos`, `/zona`, API), sin veredictos por residente.
- **PDF → "ficha del caso" neutra:** datos del inmueble, fotos, ubicación, contacto y nuevo aviso legal; sin veredictos ni recomendaciones IA.
- **WhatsApp/compartir:** reescribir mensajes para que no incluyan nivel de riesgo como orden ni instrucción de evacuar/permanecer.
- **Docs internas:** actualizar `README.md` y `AGENTS.md` con el posicionamiento legal (no dictamen, no certificación, no órdenes, nomenclatura de evaluadores) y guardar memoria de constraint.

---

## Detalles técnicos

- **Migración** en `assessments`: `resident_name`, `resident_contact`, `resident_contact_type`, `parroquia` (opcional), `consent_at`, `consent_version`, `legal_ack_at`. Incluir GRANTs y revisar RLS (contacto del residente es PII: no exponerlo en lecturas públicas/anon ni en agregados).
- **Descargo del voluntario:** persistir aceptación por envío en `help_requests` (o tabla de auditoría) con versión y timestamp.
- Reescritura de copy concentrada en `src/lib/i18n.tsx` (ES primario, EN espejo). Componentes afectados: `RiskBadge`/`RiskGauge`, `a/$publicId.tsx`, `assess/analyze.tsx`, `assess/checklist.tsx`, `assess/property.tsx`, `EngineerRequestCard.tsx`, `ConnectEngineers.tsx`, `voluntarios.index.tsx`, `datos.tsx`, `mapa.tsx`, `pdf.ts`, `share-card.ts`, `volunteer-links.ts`, `legal.tsx`, `legal-ack.ts`.
- Validación de inputs con Zod en cliente y servidor; encodeURIComponent en enlaces WhatsApp/email; sin logging de datos personales.

## Orden sugerido

1. Tareas 1–2 y 4–5 (eliminar veredictos/órdenes y lenguaje "verificado") → 2) Tarea 3 + migración + consentimiento → 3) Tarea 6 (verificar números antes de publicar) → 4) Tareas 7–8 → 5) Documentación/memoria.

## Fuera de alcance (planes posteriores)

Verificación programática con el CIV, simplificación del formulario, panel tipo Tinder, video de 15s.

## Requiere visto bueno antes de lanzar

- Texto final del aviso legal y del consentimiento (abogado).
- Etiquetas y umbrales del semáforo de "hallazgos visuales" (Manuel + abogado).
- Veracidad de los números de emergencia (fuente oficial).