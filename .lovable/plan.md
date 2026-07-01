## Objetivo

El bloque "Apoyo de ingenieros voluntarios" en la home hoy le habla al residente ("Primero haces tu autoevaluación…") pero su CTA lleva a `/voluntarios` (registro de ingenieros). Vamos a alinear todo el bloque para que hable al **ingeniero/organización** e invite a registrarse, dejando claro que siempre conectamos y siempre revisa un profesional verificado.

## Cambios (solo copy)

Todo en `src/lib/i18n.tsx`, en español e inglés. No cambia la estructura del componente `src/routes/index.tsx` (título + cuerpo + CTA que apunta a `/voluntarios`).

### Español

- **Título** (`engineers.sectionTitle`, ~línea 50): de "Apoyo de ingenieros voluntarios" → algo dirigido al profesional, p. ej. **"¿Eres ingeniero? Únete a la red"**.
- **Cuerpo** (`engineers.homeBody`, ~línea 54): reemplazar el texto actual por uno que hable al profesional y afirme el compromiso, p. ej.:
  > "Cuando una familia lo pide tras su autoevaluación, siempre la conectamos con un ingeniero civil voluntario . Súmate para acompañar a más comunidades."
- **CTA** (`engineers.learnMore`, ~línea 64): mantener "Únete como ingeniero voluntario" (ya coincide con el nuevo enfoque). Sin cambios. 
- IMPORTANTE, NO TENEMOS METODO DE VERIFICACIÓN OFICOAL POR LO TANTO NO PODEMOS DECIR EN LA APLICACIÓN QUE SON INGENIEROS CIVILES VERIFICADOS. 

### Inglés

- Actualizar las mismas tres claves en la sección EN con equivalentes:
  - Título: "Are you an engineer? Join the network"
  - Cuerpo: "When a family asks after their self-assessment, we always connect them with a verified volunteer engineer. Join us to reach more communities."
  - CTA: sin cambios.

## Notas

- El copy afirma "siempre conectamos" y "verificado", como pediste.
- No se toca ninguna ruta ni lógica; el CTA sigue llevando a `/voluntarios`.
- Confirmaré que no queden otras superficies que dependan de `engineers.homeBody` con el sentido anterior (se usa solo en la home).