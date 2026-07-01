# Correcciones: proceso oficial, contactos y enciclopedia

## 1. Etiquetas oficiales sin "se relaciona con EvalúaYa" (legal)
En `src/routes/guia.proceso-oficial-funvisis.tsx`, la sección "Qué significan las etiquetas oficiales" hoy dice cosas como *"Se relaciona con el 🟢 de EvalúaYa"*. Eso sugiere que EvalúaYa emite un veredicto equivalente al oficial, lo cual no debemos insinuar.

- Reescribir las descripciones de cada etiqueta (Permitido/Verde, Restringido/Amarillo, No Permitido/Rojo) **solo en términos oficiales**, describiendo qué significa cada color según FUNVISIS/Protección Civil, sin mencionar los colores de EvalúaYa.
- Quitar la nota que dice que el naranja (🟠) es "un matiz propio de EvalúaYa entre amarillo y rojo".
- Aplicar el mismo criterio (ES/EN).

## 2. Botón "Ver el proceso oficial"
En pruebas el enlace (`/guia/proceso-oficial-funvisis`) navega correctamente y hace scroll al tope. Durante el build voy a re-verificar el flujo real desde "Contactos oficiales" y, si encuentro un caso que no aterriza en la pantalla correcta (p. ej. scroll o ruta), lo corrijo. No haré cambios estructurales si el enlace ya funciona.

## 3. Contactos oficiales en la página principal
En `src/routes/index.tsx`, justo debajo del bloque hero ("Evaluar la seguridad de tu vivienda") y las acciones rápidas, agregar una tarjeta compacta **"Contactos oficiales de las autoridades"** que enlaza a `/contactos-oficiales` (Protección Civil, VEN 9-1-1, FUNVISIS). Se mantiene liviana (un card con ícono de teléfono + texto corto), sin recargar el home ni competir con el CTA principal. Textos nuevos en `src/lib/i18n.tsx` (ES/EN).

## 4. Avisos oficiales dentro del flujo de evaluación
Reforzar el encuadre "EvalúaYa es solo el Paso 0" en dos momentos:

**a) Después de la autoevaluación (al coordinar ingeniero):** en `src/components/ConnectEngineers.tsx` (formulario para solicitar ingeniero voluntario), agregar un aviso breve: la revisión del voluntario es una orientación visual y **no** reemplaza la evaluación oficial; recordar que la etiqueta la coloca la autoridad y que pueden llamar a los contactos oficiales. Enlace a `/contactos-oficiales`.

**b) Al finalizar la revisión del ingeniero:** en la vista del residente (`src/routes/a/$publicId.tsx`) cuando existe una revisión de voluntario, y en la confirmación del panel del ingeniero (`src/components/EngineerRequestCard.tsx`, estado "revisión guardada"), agregar un bloque **"Remite tu evaluación a las autoridades"**: el residente puede mostrar el reporte (PDF) y la revisión rápida del ingeniero voluntario a Protección Civil/FUNVISIS para solicitar la evaluación oficial. Enlaces a `/contactos-oficiales` y `/guia/proceso-oficial-funvisis`.

Todo el copy nuevo en `src/lib/i18n.tsx` (ES/EN). Sin cambios en la lógica de riesgo ni en el backend.

## 5. Enciclopedia: quitar "La pieza central"
En `src/routes/guia.index.tsx`, la tarjeta destacada del proceso oficial usa el badge "La pieza central" / "The core piece". Reemplazarlo por una etiqueta orientada al usuario, p. ej. **"Proceso oficial"** / **"Official process"** (o "Empieza aquí" / "Start here"). El usuario no debe ver lenguaje interno de priorización.

## 6. Ampliar la página del proceso oficial de FUNVISIS
Hacerla lo más completa posible, porque muchos usuarios se preguntarán cómo entra EvalúaYa en el proceso oficial. Agregar en `src/routes/guia.proceso-oficial-funvisis.tsx`:

- **Sección "¿Dónde entra EvalúaYa?"**: explicación clara de que EvalúaYa es el Paso 0 (orientación comunitaria previa) y que la evaluación y etiqueta oficiales las hace personal certificado.
- **Sección de Preguntas frecuentes (FAQ)** bilingüe con dudas comunes, por ejemplo:
  - ¿EvalúaYa reemplaza la evaluación oficial? (No.)
  - ¿Quién coloca la etiqueta oficial? (Personal certificado por la autoridad.)
  - ¿Cómo solicito la evaluación oficial y a quién llamo?
  - ¿Qué llevo/tengo listo para agilizarla? (fotos, ubicación, pisos/sótanos, PDF de EvalúaYa)
  - ¿Cuánto tarda / qué pasa si sale Rojo o Amarillo?
  - ¿El reporte de EvalúaYa tiene validez oficial? (No, es referencia de apoyo.)
- Agregar **JSON-LD `FAQPage`** al `head()` de la ruta para SEO (además del breadcrumb existente).

## Notas técnicas
- Cambios acotados a frontend/copywriting: rutas, componentes y `src/lib/i18n.tsx`. Sin migraciones ni cambios de esquema.
- Mantener bilingüe (ES primario, EN secundario) en cada texto nuevo.
- Verificación con Playwright (mobile 390px): home muestra la tarjeta de contactos; botón "Ver el proceso oficial" aterriza en la página correcta; etiquetas oficiales sin referencias a EvalúaYa; FAQ visible; badge de enciclopedia actualizado.
