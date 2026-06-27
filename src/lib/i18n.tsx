import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

export type Lang = "es" | "en";

const STORAGE_KEY = "evaluaya.lang";

type Dict = Record<string, string>;

const es: Dict = {
  "app.name": "EvalúaYa",
  "app.tagline": "Autoevaluación de daños estructurales tras un sismo",
  "app.lang": "Idioma",
  "common.next": "Continuar",
  "common.back": "Atrás",
  "common.start": "Iniciar evaluación",
  "common.cancel": "Cancelar",
  "common.retry": "Reintentar",
  "common.optional": "opcional",
  "common.step": "Paso",
  "common.of": "de",
  "common.required": "Este campo es obligatorio",
  "common.offline": "Sin conexión",
  "common.online": "En línea",

  "home.heroTitle": "Evalúa la seguridad de tu vivienda",
  "home.heroSubtitle":
    "Una guía paso a paso para revisar daños estructurales después de un terremoto. Sin registro. Funciona con poca señal.",
  "home.startCta": "Iniciar evaluación",
  "home.howTitle": "Cómo funciona",
  "home.how1Title": "Datos de la propiedad",
  "home.how1Desc": "Registra el tipo de edificación, pisos y antigüedad.",
  "home.behalfTitle": "¿Fuera del país o en un refugio?",
  "home.behalfBody":
    "No necesitas estar en el edificio. Un familiar o vecino puede hacer la inspección por ti y compartirte el resultado para decidir si es seguro regresar.",
  "home.how2Title": "Inspección guiada",
  "home.how2Desc": "Responde el cuestionario y sube una foto de cada área.",
  "home.how3Title": "Análisis con IA",
  "home.how3Desc": "Recibe un nivel de riesgo y pasos recomendados.",
  "home.recentTitle": "Evaluaciones recientes",
  "home.recentEmpty": "Aún no has guardado evaluaciones en este dispositivo.",
  "home.viewResult": "Ver resultado",

  "disclaimer.title": "Aviso importante",
  "disclaimer.body":
    "Esta herramienta ofrece una orientación preliminar y no sustituye la inspección de un ingeniero estructural autorizado ni de Protección Civil. Ante peligro inminente, evacúa y llama a emergencias.",

  "property.title": "Datos de la propiedad",
  "property.subtitle": "Esta información ayuda a interpretar los hallazgos.",
  "property.address": "Dirección / sector",
  "property.addressPlaceholder": "Ej.: Av. Bolívar, sector La Candelaria",
  "property.buildingName": "Nombre del edificio o torre",
  "property.buildingNamePlaceholder": "Ej.: Torre Mara, Res. Doral Plaza",
  "property.buildingNameHint":
    "Opcional. Ayuda a agrupar reportes del mismo edificio en el mapa. No incluyas el número de apartamento.",
  "property.behalfHint":
    "¿No estás en el sitio? Un familiar o vecino puede hacer esta inspección por ti y compartirte el resultado.",
  "property.buildingType": "Tipo de edificación",
  "property.type.house": "Casa",
  "property.type.apartment": "Apartamento",
  "property.type.commercial": "Comercial",
  "property.structuralType": "Sistema estructural",
  "property.structuralType.help":
    "Si no estás seguro, déjalo en “No estoy seguro”.",
  "property.structToggle": "Especificar sistema estructural (opcional)",
  "property.structHide": "Ocultar opciones",
  "property.struct.URM": "Mampostería sin refuerzo (paredes de bloque/ladrillo)",
  "property.struct.URM.desc":
    "Paredes de bloque o ladrillo sin columnas ni vigas de concreto que las sostengan.",
  "property.struct.CMF": "Pórtico de concreto (columnas y vigas)",
  "property.struct.CMF.desc": "Estructura de columnas y vigas de concreto armado.",
  "property.struct.CIW": "Pórtico de concreto con paredes de relleno",
  "property.struct.CIW.desc":
    "Columnas y vigas de concreto con paredes de bloque entre ellas.",
  "property.struct.PCF": "Concreto prefabricado",
  "property.struct.PCF.desc": "Elementos de concreto fabricados y luego montados.",
  "property.struct.RML": "Mampostería reforzada (baja altura)",
  "property.struct.RML.desc":
    "Paredes de bloque/ladrillo con refuerzo de acero, pocos pisos.",
  "property.struct.unknown": "No estoy seguro",
  "property.struct.unknown.desc": "No sé de qué está hecha la estructura.",
  "property.floors": "Número de pisos",
  "property.floorsHigh": "Más de 7 pisos: se recomienda precaución adicional.",
  "property.intensityDetected": "Intensidad sísmica estimada en esta ubicación",
  "property.intensityHigh": "Intensidad alta (VII+): precaución adicional.",
  "property.age": "Antigüedad aproximada",
  "property.age.pre1970": "Antes de 1970",
  "property.age.1970to2000": "1970 – 2000",
  "property.age.post2000": "Después de 2000",

  "checklist.title": "Inspección guiada",
  "checklist.subtitle": "Revisa cada área con cuidado.",
  "checklist.answer.yes": "Sí",
  "checklist.answer.no": "No",
  "checklist.answer.unsure": "No sé",
  "checklist.addPhoto": "Agregar foto",
  "checklist.takePhoto": "Tomar foto",
  "checklist.fromGallery": "Desde la galería",
  "checklist.changePhoto": "Cambiar foto",
  "checklist.removePhoto": "Quitar foto",
  "checklist.photoHint": "Una foto clara mejora el análisis. Puedes usar fotos que ya tengas.",
  "checklist.morePhotos": "Otra foto",
  "checklist.answerAll": "Responde las preguntas esenciales para continuar.",
  "checklist.analyze": "Analizar daños",
  "checklist.sectionStructure": "Revisión estructural",
  "checklist.sectionUtilities": "Servicios e interiores",
  "checklist.optionalTag": "opcional",
  "checklist.optionalNote":
    "Mientras más respondas, más preciso será el análisis. Las preguntas opcionales puedes omitirlas.",
  "checklist.showOptional": "Agregar revisión de servicios (opcional)",
  "checklist.hideOptional": "Ocultar revisión de servicios",
  "checklist.coreProgress": "esenciales",
  "checklist.remaining": "Te falta {n} para poder analizar",
  "checklist.remainingOne": "pregunta esencial",
  "checklist.remainingMany": "preguntas esenciales",
  "checklist.photosOptional": "Las fotos son opcionales, pero mejoran el análisis.",

  "factors.title": "Por qué estos resultados",
  "factors.flagged": "Problemas reportados",
  "factors.age": "Antigüedad de la edificación",
  "factors.type": "Tipo de edificación",
  "factors.intensity": "Intensidad sísmica",
  "factors.rules": "Reglas de seguridad activadas",
  "factors.empty": "Aún no hay suficientes datos para esta zona.",
  "factors.unknown": "Sin especificar",
  "factors.why": "Ver por qué",
  "factors.hideWhy": "Ocultar",
  "factors.reportsWord": "reportes",
  "factors.intensity.light": "Leve",
  "factors.intensity.moderate": "Moderada",
  "factors.intensity.strong": "Fuerte",
  "factors.intensity.severe": "Severa",
  "factors.intensity.unknown": "Sin dato",
  "factors.rule.urm": "Mampostería sin refuerzo",
  "factors.rule.liquefaction": "Licuefacción del suelo",
  "factors.rule.pounding": "Golpeteo entre edificios",
  "factors.rule.plumbing": "Fuga de gas / plomería",
  "factors.rule.severe_shaking": "Sacudida muy fuerte",
  "dash.recentReports": "Reportes recientes",
  "dash.issuesWord": "problemas",

  "item.foundation.area": "Cimientos",
  "item.foundation.q": "¿Hay grietas visibles o hundimientos en los cimientos?",
  "item.liquefaction.area": "Suelo / licuefacción",
  "item.liquefaction.q":
    "¿Hay señales de licuefacción del suelo? (agua y arena brotando, charcos donde no había agua, grietas grandes en suelo inclinado, tuberías o tanques que salieron a la superficie, o estructuras hundidas o inclinadas)",
  "item.exterior_walls.area": "Muros exteriores",
  "item.exterior_walls.q":
    "¿Hay grietas diagonales o separación respecto a edificios vecinos?",
  "item.pounding.area": "Golpeteo entre edificios",
  "item.pounding.q":
    "¿El edificio chocó o golpeó contra una edificación vecina durante el sismo?",
  "item.interior_walls.area": "Muros interiores",
  "item.interior_walls.q": "¿Hay grietas más anchas de 1 cm?",
  "item.flooring.area": "Pisos",
  "item.flooring.q":
    "¿Hay pisos pandeados, baldosas levantadas o nuevos espacios entre el piso y el rodapié?",
  "item.plumbing.area": "Plomería / gas",
  "item.plumbing.q":
    "¿Hay tuberías con fugas, grietas o separadas? ¿Escuchas agua corriendo o hueles gas? (Si hueles gas, cierra la llave principal)",
  "item.electrical.area": "Electricidad",
  "item.electrical.q":
    "¿Hay breakers disparados, tomacorrientes dañados o cables expuestos?",
  "item.fixtures.area": "Lámparas / accesorios",
  "item.fixtures.q":
    "¿Hay lámparas colgando torcidas o cajas eléctricas separadas por el sismo?",
  "item.columns_beams.area": "Columnas / vigas",
  "item.columns_beams.q":
    "¿Hay concreto desprendido (descascarado) o acero (cabilla) expuesto?",
  "item.doors_windows.area": "Puertas / ventanas",
  "item.doors_windows.q": "¿Hay puertas o ventanas que ya no abren o cierran?",
  "item.roof.area": "Techo",
  "item.roof.q": "¿Hay deformación visible o colapso del techo?",
  "item.stairs.area": "Escaleras",
  "item.stairs.q": "¿Hay escaleras agrietadas o separadas de los muros?",

  "checklist.exampleToggle": "¿Cómo se ve?",
  "checklist.exampleYes": "Sí (señal de daño)",
  "checklist.exampleNo": "No (se ve bien)",
  "item.foundation.example.yes": "La base tiene grietas nuevas, se ve hundida o el piso quedó disparejo.",
  "item.foundation.example.no": "La base sigue pareja y sin grietas nuevas.",
  "item.liquefaction.example.yes": "Brotó agua o arena, hay charcos donde no había, o el terreno se hundió o inclinó.",
  "item.liquefaction.example.no": "El suelo alrededor sigue firme y seco, igual que antes.",
  "item.exterior_walls.example.yes": "Grietas en diagonal (en forma de X o escalera) o la pared se separó del edificio de al lado.",
  "item.exterior_walls.example.no": "Las paredes de afuera siguen rectas y pegadas, sin grietas nuevas.",
  "item.pounding.example.yes": "Tu edificio chocó con el vecino: hay marcas, golpes o material caído entre ambos.",
  "item.pounding.example.no": "Hay separación normal con el edificio vecino, sin señales de choque.",
  "item.interior_walls.example.yes": "Grietas por las que cabe un lápiz o una moneda de canto (más de 1 cm).",
  "item.interior_walls.example.no": "Solo líneas finas, como un cabello, o ninguna grieta nueva.",
  "item.flooring.example.yes": "El piso se levantó, baldosas saltadas o se abrió un espacio junto al rodapié.",
  "item.flooring.example.no": "El piso sigue plano y firme al pisar.",
  "item.plumbing.example.yes": "Hay fugas, escuchas agua donde no debería, o hueles gas.",
  "item.plumbing.example.no": "No hay fugas, ni ruido de agua, ni olor a gas.",
  "item.electrical.example.yes": "Breakers que se disparan, tomas quemados o cables sueltos a la vista.",
  "item.electrical.example.no": "La electricidad funciona normal, sin cables expuestos.",
  "item.fixtures.example.yes": "Lámparas colgando torcidas o cajas eléctricas separadas de la pared.",
  "item.fixtures.example.no": "Lámparas y accesorios siguen firmes y derechos.",
  "item.columns_beams.example.yes": "El concreto se descascaró y se ve la cabilla (acero) por dentro.",
  "item.columns_beams.example.no": "Columnas y vigas lisas, sin concreto caído ni acero a la vista.",
  "item.doors_windows.example.yes": "Una puerta o ventana que antes abría ahora se traba o no cierra.",
  "item.doors_windows.example.no": "Puertas y ventanas abren y cierran como siempre.",
  "item.roof.example.yes": "El techo se ve hundido, pandeado o se cayó una parte.",
  "item.roof.example.no": "El techo sigue parejo, sin hundimientos nuevos.",
  "item.stairs.example.yes": "La escalera tiene grietas o se separó de la pared.",
  "item.stairs.example.no": "La escalera sigue firme y pegada a la pared.",

  "checklist.newDamageTitle": "Reporta solo daños NUEVOS",
  "checklist.newDamageBody": "Responde pensando solo en daños que aparecieron con este sismo. Si una grieta ya existía antes, no la marques. Si no sabes si es nueva, elige \"No estoy seguro\".",



  "rule.urm.finding":
    "Edificación de mampostería sin refuerzo: muy vulnerable tras un sismo fuerte.",
  "rule.urm.step":
    "No la consideres segura para entrar. Espera la evaluación de un ingeniero o Protección Civil.",
  "rule.liquefaction.finding":
    "Señales de licuefacción del suelo: el terreno perdió capacidad de soporte.",
  "rule.liquefaction.step":
    "No entres. La estructura puede asentarse o inclinarse. Evacúa y reporta a las autoridades.",
  "rule.pounding.finding":
    "Golpeteo con un edificio vecino: posible daño estructural severo.",
  "rule.pounding.step": "No entres y evacúa la zona de contacto entre edificios.",
  "rule.plumbing.finding":
    "Daño severo de plomería o posible fuga de gas: riesgo inmediato.",
  "rule.plumbing.step":
    "Cierra la llave principal de gas y agua, no enciendas luces ni llamas, y evacúa.",
  "rule.intensity.finding":
    "Sacudida sísmica moderada (intensidad VI o aceleración ≥0.25g) en esta ubicación.",
  "rule.intensity.step":
    "Aumenta la precaución: revisa con más cuidado y prioriza una evaluación profesional.",
  "rule.intensity_severe.finding":
    "Sacudida sísmica muy fuerte (intensidad VIII+ o aceleración ≥0.50g) en esta ubicación.",
  "rule.intensity_severe.step":
    "Esta zona recibió una de las sacudidas más fuertes del sismo. Trata cualquier daño con máxima cautela.",
  "rule.spectral.finding":
    "La demanda sísmica para edificaciones de esta altura fue alta (aceleración espectral ≥0.40g).",
  "rule.spectral.step":
    "Edificios de esta altura sintieron la sacudida con especial fuerza. Prioriza una revisión profesional.",
  "rule.softsoil.finding":
    "Suelo blando: amplifica la sacudida y aumenta el riesgo de licuefacción.",
  "rule.softsoil.step":
    "Vigila asentamientos o inclinaciones del terreno y de la edificación.",
  "rule.softsoil_severe.finding":
    "Suelo muy blando: fuerte amplificación de la sacudida y alto riesgo de licuefacción.",
  "rule.softsoil_severe.step":
    "Observa con cuidado el terreno y los cimientos; prioriza una evaluación profesional.",
  "rule.combo_shaking.finding":
    "Sacudida muy fuerte combinada con daño estructural reportado: riesgo crítico para la vida.",
  "rule.combo_shaking.step":
    "No la consideres segura. Evacúa y espera la confirmación de un ingeniero o Protección Civil.",
  "rule.floors.finding":
    "Edificación de más de 7 pisos: requiere precaución adicional.",
  "rule.floors.step":
    "Limita el uso hasta que un ingeniero confirme la seguridad de los pisos superiores.",
  "rule.structure.finding":
    "El sistema estructural de esta edificación requiere precaución adicional.",
  "rule.structure.step":
    "Limita el uso y prioriza una evaluación profesional.",

  "soil.rock": "Suelo firme / roca",
  "soil.stiff": "Suelo rígido",
  "soil.soft": "Suelo blando",
  "soil.very_soft": "Suelo muy blando",





  "analyze.title": "Analizando",
  "analyze.uploading": "Procesando fotos…",
  "analyze.thinking": "Evaluando el riesgo estructural…",
  "analyze.savedHint":
    "Tus respuestas están guardadas. Puedes esperar aunque la señal sea lenta.",
  "analyze.waitingTitle": "Esperando conexión",
  "analyze.waitingBody":
    "Tus respuestas están guardadas. El análisis se ejecutará automáticamente cuando vuelva la señal.",
  "analyze.errorTitle": "No se pudo completar el análisis",
  "analyze.rateLimited":
    "Hay demasiadas solicitudes en este momento. Espera un momento e inténtalo de nuevo.",
  "analyze.throttled":
    "Has alcanzado el límite de análisis por ahora. Espera un poco antes de evaluar otra propiedad.",
  "analyze.creditsError":
    "El servicio de IA no está disponible temporalmente. Inténtalo más tarde.",
  "analyze.genericError":
    "Ocurrió un problema al analizar. Revisa tu conexión e inténtalo de nuevo.",

  "result.title": "Resultado de la evaluación",
  "result.green.tag": "Riesgo bajo",
  "result.green.action": "Puedes permanecer",
  "result.yellow.tag": "Riesgo moderado",
  "result.yellow.action": "Monitorea y atiende",
  "result.orange.tag": "Riesgo moderado a serio",
  "result.orange.action": "Necesitas un ingeniero con urgencia",
  "result.red.tag": "Riesgo alto",
  "result.red.action": "Evacúa de inmediato",
  "result.summary": "Resumen",
  "result.findings": "Hallazgos clave",
  "result.nextSteps": "Pasos recomendados",
  // Same-building context (resident result)
  "building.title": "Otras evaluaciones de este edificio",
  "building.subtitle": "Hay {count} evaluación(es) más de {name}.",
  "building.legend.red": "rojo",
  "building.legend.orange": "naranja",
  "building.legend.yellow": "amarillo",
  "building.legend.green": "verde",
  "building.note":
    "Los problemas estructurales suelen afectar a todo el edificio. Comparte tu resultado con tus vecinos y con la administración o junta de condominio para evaluar la estructura en conjunto.",
  // Offline outbox / sync
  "offline.banner": "Sin conexión. Tu evaluación se guardó y se enviará sola al volver el internet.",
  "offline.pendingOne": "1 evaluación pendiente de enviar.",
  "offline.pendingMany": "{n} evaluaciones pendientes de enviar.",
  "offline.syncNow": "Enviar ahora",
  // Provisional (offline) result
  "provisional.title": "Resultado preliminar",
  "provisional.subtitle": "Hicimos una evaluación rápida en tu teléfono. Cuando tengas internet, generaremos el análisis completo con IA automáticamente.",
  "provisional.badge": "Preliminar · sin conexión",
  "provisional.syncing": "Generando análisis completo…",
  "provisional.viewReports": "Ver mis reportes",
  "provisional.home": "Volver al inicio",
  "provisional.multiDamage": "Se reportó daño visible en varias áreas estructurales.",
  "provisional.singleDamage": "Se reportó daño visible en un área estructural.",
  "provisional.unsure": "Hay respuestas marcadas como “No estoy seguro”; conviene una revisión.",
  "provisional.noFindings": "No se reportó daño estructural evidente en la inspección.",
  "provisional.step.evacuate": "Por precaución, evita usar el inmueble hasta una revisión profesional.",
  "provisional.step.limit": "Limita el uso de las áreas afectadas hasta una revisión.",
  "provisional.step.engineer":
    "Hay daño estructural: limita el uso y busca la revisión de un ingeniero pronto.",
  "provisional.step.stay": "Puedes permanecer, pero mantente atento a nuevos daños o réplicas.",
  "result.photos": "Fotos enviadas",
  "result.seismicContext": "Contexto sísmico",
  "result.mmi": "Intensidad (MMI)",
  "result.pga": "Aceleración pico (PGA)",
  "result.pgv": "Velocidad pico (PGV)",
  "result.spectralDemand": "Demanda para esta altura",
  "result.soil": "Suelo del sitio",
  "result.seismicContextHint":
    "Datos del mapa de sacudida (ShakeMap) del USGS para este sismo, según la ubicación. La demanda para esta altura es la aceleración espectral en el período estimado de la edificación.",
  "result.share": "Compartir",
  "result.copyLink": "Copiar enlace",
  "result.copied": "¡Enlace copiado!",
  "result.downloadPdf": "Descargar PDF",
  "result.newAssessment": "Nueva evaluación",
  "result.disclaimerShort":
    "Orientación preliminar. Confirma con un ingeniero estructural o Protección Civil.",
  "result.notFound": "No se encontró esta evaluación.",
  "result.genericError": "Algo salió mal. Inténtalo de nuevo.",
  "result.goHome": "Ir al inicio",
  "result.assessedOn": "Evaluado el",

  "pdf.title": "Resumen de evaluación estructural",
  "pdf.property": "Propiedad",
  "pdf.riskLevel": "Nivel de riesgo",
  "pdf.summary": "Resumen",
  "pdf.findings": "Hallazgos clave",
  "pdf.nextSteps": "Pasos recomendados",
  "pdf.inspection": "Respuestas de inspección",
  "pdf.generated": "Generado por EvalúaYa",

  "common.loading": "Cargando…",
  "nav.map": "Mapa",
  "nav.home": "Inicio",
  "nav.reports": "Mis reportes",
  "nav.more": "Más",
  "nav.language": "Idioma",
  "nav.help": "Ayuda",
  "nav.feedback": "Enviar comentarios",

  "feedback.title": "Enviar comentarios",
  "feedback.subtitle":
    "¿Tienes una idea, una duda o encontraste un problema? Cuéntanos y nos ayudas a mejorar EvalúaYa.",
  "feedback.messageLabel": "Tu mensaje",
  "feedback.messagePlaceholder":
    "Escribe aquí tu comentario, sugerencia o problema…",
  "feedback.emailLabel": "Tu correo",
  "feedback.emailPlaceholder": "tucorreo@ejemplo.com",
  "feedback.emailHint": "Solo si quieres que te respondamos.",
  "feedback.submit": "Enviar comentario",
  "feedback.sending": "Enviando…",
  "feedback.error": "No se pudo enviar. Intenta de nuevo en un momento.",
  "feedback.thanksTitle": "¡Gracias por tu comentario!",
  "feedback.thanksBody":
    "Leemos cada mensaje. Tu opinión nos ayuda a hacer EvalúaYa más útil para todos.",
  "feedback.backHome": "Volver al inicio",
  "feedback.privacy":
    "No registramos datos personales. Tu correo es opcional y solo se usa para responderte.",
  "feedback.promptTitle": "¿Cómo te resultó?",
  "feedback.promptBody": "Comparte tu opinión para mejorar la app.",

  "help.title": "Ayuda",
  "help.subtitle":
    "Aprende a usar EvalúaYa y resuelve las dudas más comunes.",
  "help.quickStartTitle": "Cómo hacer una evaluación",
  "help.step1Title": "1. Datos de la propiedad",
  "help.step1Desc":
    "Indica la dirección, el tipo de edificación, los pisos y la antigüedad.",
  "help.step2Title": "2. Inspección guiada",
  "help.step2Desc":
    "Responde preguntas simples (Sí / No / No estoy seguro) área por área y, si puedes, sube una foto.",
  "help.step3Title": "3. Análisis con IA",
  "help.step3Desc":
    "Recibes un nivel de riesgo (Verde / Amarillo / Rojo) con una explicación clara y pasos a seguir.",
  "help.step4Title": "4. Guarda y comparte",
  "help.step4Desc":
    "Descarga un PDF, compártelo por WhatsApp o guárdalo para consultarlo después.",
  "help.startCta": "Iniciar evaluación",
  "help.faqTitle": "Preguntas frecuentes",
  "help.faq.freeQ": "¿La app es gratis?",
  "help.faq.freeA": "Sí. EvalúaYa es completamente gratis.",
  "help.faq.signupQ": "¿Necesito registrarme?",
  "help.faq.signupA":
    "No. Puedes evaluar tu vivienda sin crear una cuenta. Si quieres guardar tus reportes para verlos más adelante, puedes crear una cuenta opcional con tu correo.",
  "help.faq.offlineQ": "¿Funciona sin internet o con poca señal?",
  "help.faq.offlineA":
    "Sí. Puedes responder el cuestionario con poca señal; tu avance se guarda en el dispositivo y el análisis se envía cuando recuperes conexión.",
  "help.faq.resultsQ": "¿Qué significan los colores del resultado?",
  "help.faq.resultsA":
    "Verde: sin señales de riesgo estructural evidente. Amarillo: usa el inmueble con precaución y busca revisión profesional. Rojo: posible peligro grave; evacúa y contacta a las autoridades.",
  "help.faq.privacyQ": "¿Mis datos son privados?",
  "help.faq.privacyA":
    "Sí. La evaluación es anónima. No pedimos tu nombre ni datos personales para usar la app.",
  "help.faq.saveQ": "¿Cómo guardo y vuelvo a ver mis reportes?",
  "help.faq.saveA":
    "En la pantalla de resultados puedes crear una cuenta con tu correo (enlace mágico, sin contraseña) para acceder a tus reportes desde “Mis reportes” cuando quieras.",
  "help.faq.photosQ": "¿Las fotos son obligatorias?",
  "help.faq.photosA":
    "No. Las fotos son opcionales, pero ayudan a que el análisis sea más preciso.",
  "help.faq.officialQ": "¿Esto reemplaza una inspección oficial?",
  "help.faq.officialA":
    "No. EvalúaYa ofrece una orientación preliminar y no sustituye la inspección de un ingeniero estructural autorizado ni de Protección Civil.",
  "help.moreTitle": "¿Necesitas más ayuda?",
  "help.moreBody":
    "Escríbenos si tienes una duda que no aparece aquí, o conoce cómo calculamos los resultados.",
  "help.contactCta": "Enviar un comentario",


  "home.timePromise": "Gratis · 2 minutos · sin registro",
  "home.trustFree": "Gratis",
  "home.trustNoSignup": "Sin registro",
  "home.trustOffline": "Funciona sin conexión",
  "home.trustAnon": "Anónimo",
  "home.seoTagline":
    "Sabe en 2 minutos si tu vivienda es segura para entrar tras el sismo.",
  "home.statBuildings": "edificios evaluados",
  "home.statAreas": "zonas con reportes",
  "home.pendingTitle": "Tienes una evaluación sin enviar",
  "home.pendingBody": "Completaste el cuestionario sin conexión. Envíalo ahora para recibir tu resultado.",
  "home.pendingOffline": "Sin conexión. Se enviará automáticamente cuando vuelva la señal.",
  "home.pendingCta": "Enviar evaluación",
  "home.mapTitle": "Mapa comunitario de daños",
  "home.mapDesc": "Mira cómo está tu zona según los reportes de otras personas.",
  "home.viewMap": "Ver mapa de daños",
  "home.exploreTitle": "Explora tu estado",
  "home.exploreDesc":
    "Consulta los reportes y evalúa tu vivienda según tu estado.",
  "zona.breadcrumbHome": "Inicio",
  "zona.eyebrow": "Reporte regional",
  "zona.h1Prefix": "Daños estructurales en",
  "zona.intro":
    "Mira cómo está {estado} según los reportes anónimos de la comunidad y evalúa tu vivienda gratis, sin registro y en pocos minutos.",
  "zona.ctaPrefix": "Evaluar mi vivienda en",
  "zona.totalReports": "Reportes en el estado",
  "zona.municipios": "Municipios con reportes",
  "zona.lastReport": "Último reporte",
  "zona.noData":
    "Aún no hay reportes en {estado}. Sé la primera persona en evaluar tu vivienda y ayudar a tu comunidad.",
  "zona.aboutTitle": "¿Cómo se calculan estos datos?",
  "zona.aboutBody":
    "Las cifras son conteos anónimos de autoevaluaciones realizadas en la app. Nunca mostramos direcciones, fotos ni datos personales.",
  "zona.viewMap": "Ver el mapa completo",
  "zona.otherStates": "Otros estados",
  "zona.notFound": "No encontramos ese estado.",

  "property.state": "Estado",
  "property.statePlaceholder": "Selecciona",
  "property.municipality": "Municipio",
  "property.municipalityPlaceholder": "Ej.: Baruta",
  "property.locationHint":
    "Solo usamos la zona (estado/municipio) para el mapa comunitario. Nunca mostramos tu dirección exacta.",
  "property.detecting": "Detectando tu ubicación…",
  "property.detected": "Ubicación detectada. Puedes cambiarla si no es correcta.",
  "property.detectFailed": "No pudimos detectar tu ubicación. Selecciona tu estado.",
  "property.stateRequired": "Selecciona tu estado para continuar.",
  "property.effortHint": "Solo toma unos minutos. Las fotos son opcionales.",
  "property.missingPrefix": "Para continuar, falta:",
  "property.miss.state": "estado",
  "property.miss.type": "tipo de edificio",
  "property.miss.age": "antigüedad",

  "map.title": "Mapa de daños",
  "map.subtitle":
    "Reportes anónimos y agregados por zona. Nunca se muestran direcciones ni fotos.",
  "map.totalAssessments": "Evaluaciones",
  "map.areasLabel": "Zonas",
  "map.high": "Riesgo alto",
  "map.urgent": "Riesgo serio",
  "map.moderate": "Riesgo moderado",
  "map.low": "Riesgo bajo",
  "map.distribution": "Distribución de riesgo",
  "map.geoTitle": "Vista geográfica",
  "map.geoHint": "El tamaño indica cantidad de reportes; el color, el riesgo predominante.",
  "map.legendSize": "Tamaño = cantidad de reportes",
  "map.legendRisk": "Color = riesgo predominante",
  "map.legendTitle": "¿Qué significa cada color?",
  "map.legendGreen": "Verde: sin daños visibles. Uso normal.",
  "map.legendYellow": "Amarillo: daños menores. Monitorea y atiende pronto.",
  "map.legendOrange": "Naranja: daños moderados a serios. Necesitas un ingeniero con urgencia.",
  "map.legendRed": "Rojo: daños graves. No entres; evacúa.",
  "map.topAreas": "Zonas con más reportes",
  "map.reports": "reportes",
  "map.unspecifiedMunicipality": "Municipio sin especificar",
  "map.unspecifiedLocation": "Ubicación sin especificar",
  "map.interactiveHint": "Acerca para ver el detalle por municipio. Toca una zona para ver sus datos.",
  "map.viewZone": "Ver zona",
  "map.mapLoading": "Cargando mapa…",
  "map.mapUnavailable": "El mapa interactivo no está disponible aquí. Mostrando vista simplificada.",
  "map.atState": "Ubicado a nivel de estado",

  "map.lastUpdated": "Actualizado",
  "map.empty": "Aún no hay evaluaciones suficientes para mostrar el mapa.",
  "map.startCta": "Evalúa tu edificio",
  "map.download": "Descargar datos (CSV)",
  "map.dataNote":
    "Datos abiertos y anónimos para autoridades, ONG y prensa.",
  "map.cardHeadline": "Daños estructurales reportados",
  "map.cardCta": "Evalúa tu vivienda gratis en EvalúaYa",

  "result.shareWhatsapp": "Compartir por WhatsApp",
  "result.whatsappMessage":
    "Evalué los daños estructurales de mi edificio con EvalúaYa. Evalúa el tuyo también, es gratis:",
  "result.inviteTitle": "Ayuda a tu comunidad",
  "result.inviteBody":
    "Comparte EvalúaYa con tus vecinos. Mientras más personas evalúan, mejor entendemos los daños de cada zona.",
  "result.inviteCta": "Invitar a un vecino",
  "result.proofText": "evaluaciones realizadas hasta ahora",
  "result.viewMap": "Ver mapa de daños de tu zona",
  "result.shareCard": "Compartir imagen de resultado",
  "result.cardFooter": "Autoevaluación estructural tras el sismo · No sustituye una inspección profesional",

  "share.title": "Ayuda a difundir EvalúaYa",
  "share.body":
    "Compártelo con tu familia y vecinos. Mientras más personas evalúan sus viviendas, mejor entendemos los daños de cada zona.",
  "share.whatsapp": "Compartir por WhatsApp",
  "share.copy": "Copiar enlace",
  "share.copied": "¡Enlace copiado!",
  "share.message":
    "Evalúa los daños de tu vivienda tras el sismo con EvalúaYa — gratis, sin registro y funciona con poca señal:",
  "share.generating": "Generando imagen…",
  "share.imageSaved": "Imagen guardada. Compártela donde quieras.",
  "share.shareStats": "Compartir estadísticas",



  "inst.title": "¿Eres autoridad u organización?",
  "inst.body":
    "Si representas a una alcaldía, Protección Civil, una ONG o el sector privado y necesitas acceso a estos datos, déjanos tus datos.",
  "inst.org": "Organización",
  "inst.orgPlaceholder": "Ej.: Protección Civil",
  "inst.name": "Nombre de contacto",
  "inst.namePlaceholder": "Tu nombre",
  "inst.email": "Correo electrónico",
  "inst.emailPlaceholder": "correo@organizacion.com",
  "inst.note": "Mensaje",
  "inst.notePlaceholder": "¿Cómo usarías los datos?",
  "inst.submit": "Enviar interés",
  "inst.success": "¡Gracias! Te contactaremos pronto.",
  "inst.error": "No se pudo enviar. Intenta de nuevo.",
  "inst.invalid": "Revisa la organización y el correo.",

  "nav.methodology": "Metodología",
  "home.methodologyLink": "Cómo se calcula el resultado",

  "methodology.title": "Cómo funciona EvalúaYa",
  "methodology.subtitle":
    "Cómo calculamos el resultado y de dónde viene nuestra credibilidad.",
  "methodology.maintainedBy":
    "Esta página la mantiene el equipo de EvalúaYa para explicar cómo funciona la herramienta. Puede actualizarse a medida que mejoramos el método.",
  "methodology.intro":
    "EvalúaYa combina reglas de seguridad comprobadas con un análisis de inteligencia artificial sobre tus respuestas y fotos para dar una orientación rápida: verde, amarillo o rojo. Aquí explicamos cada paso para que puedas validarlo antes de usarlo o compartirlo.",

  "methodology.layersTitle": "Dos capas de análisis",
  "methodology.layersIntro":
    "Cada evaluación pasa por dos capas. El resultado final siempre toma el nivel más severo de las dos.",

  "methodology.layerA.title": "Capa 1 · Reglas de seguridad",
  "methodology.layerA.body":
    "Reglas deterministas basadas en criterios profesionales de inspección rápida. Se aplican siempre y pueden anular a la IA cuando hay señales claras de peligro para la vida.",
  "methodology.red.title": "Obligan a ROJO (no entrar)",
  "methodology.red.urm":
    "Mampostería no reforzada: paredes de bloque o ladrillo sin estructura de concreto.",
  "methodology.red.liquefaction":
    "Señales de licuación del suelo: hundimientos, grietas con barro o agua.",
  "methodology.red.pounding":
    "Golpeteo entre edificios vecinos durante el sismo.",
  "methodology.red.plumbing": "Daño grave en tuberías o gas.",
  "methodology.red.combo":
    "Sacudida muy fuerte (MMI VIII+ o PGA ≥0.50g) junto con daño estructural reportado.",
  "methodology.yellow.title": "Elevan a AMARILLO (precaución)",
  "methodology.yellow.intensity":
    "Sacudida moderada en tu ubicación: intensidad MMI VI+ o aceleración pico (PGA) ≥0.25g.",
  "methodology.yellow.soil":
    "Suelo blando (vs30 bajo), que amplifica la sacudida y aumenta el riesgo de licuefacción.",
  "methodology.yellow.floors": "Edificios de más de 7 pisos.",
  "methodology.yellow.structure":
    "Sistemas estructurales más vulnerables: pórticos de concreto, paredes de relleno, prefabricado o mampostería reforzada baja.",
  "methodology.orange.title": "Elevan a NARANJA (necesitas un ingeniero pronto)",
  "methodology.orange.urm":
    "Mampostería no reforzada, aun sin daño visible ni sacudida fuerte: por su fragilidad necesita revisión profesional pronto.",
  "methodology.orange.severe":
    "Sacudida muy fuerte en tu ubicación (MMI VIII+ o PGA ≥0.50g), incluso sin daño visible.",
  "methodology.orange.spectral":
    "Demanda sísmica alta para la altura del edificio: aceleración espectral ≥0.40g en su período estimado.",
  "methodology.orange.soil":
    "Suelo muy blando (vs30 muy bajo), que amplifica fuertemente la sacudida y eleva el riesgo de licuefacción.",
  "reclassify.orange.note":
    " Actualizado a Naranja con la nueva escala de 4 niveles: los elementos estructurales reportados requieren la inspección de un ingeniero.",
  "reclassify.updated":
    "Resultado actualizado de «{from}» a «{to}» con la nueva escala de 4 niveles (🟢🟡🟠🔴), que distingue mejor el daño moderado del serio.",

  "methodology.layerB.title": "Capa 2 · Análisis con IA",
  "methodology.layerB.body":
    "Tus respuestas del cuestionario y una foto clave por área se envían a un modelo de visión por IA, que actúa como un triaje rápido tipo ATC-20 y devuelve un nivel de riesgo con hallazgos y pasos en lenguaje sencillo. La IA es conservadora: ante la duda sobre la seguridad, no elige verde.",

  "methodology.checklistTitle": "Qué inspeccionas",
  "methodology.checklistBody":
    "El cuestionario cubre 9 puntos estructurales obligatorios (fundaciones, paredes, columnas y vigas, techo, escaleras, licuación, golpeteo) y 4 puntos opcionales de servicios (pisos, plomería, electricidad, lámparas y objetos colgantes).",

  "methodology.seismicTitle": "Contexto sísmico",
  "methodology.seismicBody":
    "Si compartes tu ubicación, leemos varias capas de la malla oficial de ShakeMap del USGS para el sismo activo, interpoladas a tu punto exacto: la intensidad (MMI), la aceleración pico del suelo (PGA), la velocidad pico (PGV), la aceleración espectral en distintos períodos y la rigidez del suelo (vs30). Estimamos el período natural del edificio según su altura (T ≈ 0.1 × pisos) y lo comparamos con la aceleración espectral de ese período, para saber cuánta sacudida sintió realmente una edificación de esa altura. El suelo blando (vs30 bajo) se marca porque amplifica la sacudida y favorece la licuefacción. Estos valores elevan el nivel de precaución de forma graduada y se incluyen en el contexto que recibe la IA.",

  "methodology.sourcesTitle": "Fuentes y credibilidad",
  "methodology.sourcesIntro":
    "Nuestra lógica se modela sobre marcos públicos reconocidos:",
  "methodology.source.atc20":
    "ATC-20 — Evaluación rápida de seguridad de edificios tras un sismo (el concepto de etiqueta verde/amarillo/rojo).",
  "methodology.source.usgs":
    "USGS ShakeMap y la escala de Intensidad de Mercalli Modificada (MMI) para la intensidad de sacudida.",
  "methodology.source.urm":
    "Consenso de ingeniería sísmica sobre la vulnerabilidad de la mampostería no reforzada y los pisos blandos.",
  "methodology.source.ai":
    "Modelo de visión por IA a través de Lovable AI Gateway, usado para el triaje preliminar (no es un certificador).",

  "methodology.limitsTitle": "Límites y responsabilidad compartida",
  "methodology.limit.notCert":
    "Esto NO es una certificación ni reemplaza a un ingeniero colegiado o a Protección Civil. Es una orientación preliminar.",
  "methodology.limit.surface":
    "Solo evalúa lo visible que reportas. No inspecciona elementos ocultos, fundaciones enterradas ni el interior de los muros.",
  "methodology.limit.depends":
    "La calidad del resultado depende de tus respuestas y de la nitidez de las fotos.",
  "methodology.limit.privacy":
    "No se requiere registro. Solo usamos la zona (estado/municipio) para el mapa comunitario; nunca mostramos tu dirección exacta ni tus fotos.",

  "methodology.engineersTitle": "Para ingenieros",
  "methodology.engineersBody":
    "¿Quieres validar el algoritmo a nivel de código? Descarga la especificación técnica: incluye las reglas deterministas, la interpolación de intensidad sísmica (USGS ShakeMap), el prompt exacto del modelo de IA y la lógica de combinación.",
  "methodology.specDownload": "Descargar especificación técnica (PDF)",

  "methodology.ctaTitle": "¿Listo para evaluar?",
  "methodology.cta": "Iniciar evaluación",
  "methodology.disclaimer":
    "En una emergencia, llama a Protección Civil o a los servicios de emergencia.",

  // ----- Volunteer engineers (ES) -----
  "nav.volunteers": "Ingenieros voluntarios",

  // Result page connect section
  "connect.title": "Habla con un ingeniero voluntario",
  "connect.subtitleRed":
    "Tu resultado es ROJO. Un ingeniero voluntario puede orientarte sobre los próximos pasos. Es gratuito y sin compromiso.",
  "connect.subtitleYellow":
    "Un ingeniero voluntario puede ayudarte a interpretar estos hallazgos. Es gratuito y sin compromiso.",
  "connect.directTitle": "Ingenieros disponibles en tu zona",
  "connect.coversYourState": "Cubre tu estado",
  "connect.whatsappEngineer": "Escribir por WhatsApp",
  "connect.revealConsent":
    "Al continuar compartirás tu contacto con este voluntario por WhatsApp.",
  "connect.revealing": "Abriendo…",
  "connect.revealError": "No se pudo abrir el contacto. Intenta de nuevo.",
  "connect.orgBadge": "Organización",
  "connect.noneTitle": "Aún estamos sumando ingenieros en tu estado",
  "connect.noneBody":
    "Deja tu número y un ingeniero voluntario te contactará en cuanto haya cobertura en tu zona.",
  "connect.requestTitle": "Pedir que me contacten",
  "connect.requestBody":
    "¿Prefieres que un ingeniero te escriba? Deja tu WhatsApp y compartiremos tu reporte solo con ingenieros aprobados de tu estado.",
  "connect.requestCta": "Solicitar contacto",
  "connect.requestSending": "Enviando…",
  "connect.requestDone": "¡Listo! Un ingeniero te contactará pronto.",
  "connect.requestError": "No se pudo enviar. Intenta de nuevo.",
  "connect.yourWhatsapp": "Tu número de WhatsApp",
  "connect.whatsappPlaceholder": "Ej.: 0414 123 4567",
  "connect.whatsappHint":
    "Incluye el código de área. Si estás en Venezuela puedes usar tu número local (ej.: 0414…); le agregamos el código de país (+58) automáticamente.",
  "connect.noteOptional": "Mensaje (opcional)",
  "connect.notePlaceholder": "Ej.: Hay grietas grandes en la sala.",
  "connect.privacy":
    "Tu número solo se comparte con ingenieros voluntarios aprobados de tu estado. No se publica.",
  "connect.areEngineer": "¿Eres ingeniero? Súmate como voluntario",
  "connect.waMessage":
    "Hola, completé una evaluación con EvalúaYa y mi resultado necesita orientación. Este es mi reporte:",

  // Volunteer landing + signup
  "vol.title": "Ingenieros voluntarios",
  "vol.subtitle":
    "Suma tu experiencia para ayudar a familias a entender el daño en sus viviendas tras un sismo.",
  "vol.how1": "Te registras con tu WhatsApp y los estados que puedes cubrir.",
  "vol.how2": "Revisamos tu solicitud y te enviamos un enlace privado.",
  "vol.how3":
    "Recibes solicitudes de personas con resultados de riesgo en tu zona y respondes por WhatsApp.",
  "vol.formTitle": "Quiero ser voluntario",
  "vol.name": "Nombre completo",
  "vol.namePlaceholder": "Ej.: Ing. María Pérez",
  "vol.org": "Empresa u organización (opcional)",
  "vol.orgPlaceholder": "Ej.: Colegio de Ingenieros",
  "vol.whatsapp": "WhatsApp",
  "vol.email": "Correo electrónico",
  "vol.emailHint":
    "Lo necesitamos para enviarte tu enlace de acceso cuando te validemos.",
  "vol.states": "Estados que puedes cubrir",
  "vol.statesHint": "Selecciona uno o más.",
  "vol.specialization": "Especialidad (opcional)",
  "vol.specializationPlaceholder": "Ej.: Estructuras, geotecnia…",
  "vol.note": "Mensaje (opcional)",
  "vol.submit": "Enviar solicitud",
  "vol.sending": "Enviando…",
  "vol.successTitle": "¡Gracias por sumarte!",
  "vol.successBody":
    "Revisaremos tu solicitud y te enviaremos un enlace privado para ver las solicitudes de tu zona.",
  "vol.error": "Revisa los campos e intenta de nuevo.",
  "vol.selectStates": "Selecciona al menos un estado.",
  "vol.typeLabel": "Me sumo como",
  "vol.typeIndividual": "Ingeniero individual",
  "vol.typeOrg": "Organización / empresa",
  "vol.orgName": "Nombre de la organización",
  "vol.orgNamePlaceholder": "Ej.: Soluciones Estructurales C.A.",
  "vol.contactName": "Persona de contacto",
  "vol.contactNamePlaceholder": "Ej.: Ing. María Pérez",
  "vol.orgSpecialization": "Áreas de especialización / servicios (opcional)",
  "vol.orgRequired": "Indica el nombre de la organización.",

  // Engineer panel
  "panel.title": "Panel de ingeniero voluntario",
  "panel.welcome": "Hola",
  "panel.coverage": "Cobertura",
  "panel.invalid": "Enlace no válido o no aprobado",
  "panel.invalidBody":
    "Este enlace no corresponde a un voluntario aprobado. Si crees que es un error, contáctanos.",
  "panel.empty": "No hay solicitudes abiertas en tu zona por ahora.",
  "panel.openRequests": "Solicitudes",
  "panel.claim": "Estoy disponible",
  "panel.claimed": "La estás atendiendo",
  "panel.close": "Marcar como atendida",
  "panel.contactResident": "Escribir al residente",
  "panel.contactLocked":
    "Marca \"Estoy disponible\" para ver el contacto del residente.",
  "panel.expired": "Enlace vencido",
  "panel.expiredBody":
    "Tu enlace de acceso caducó por seguridad. Escríbenos para recibir uno nuevo.",
  "panel.viewReport": "Ver reporte",
  "panel.noLocation": "Ubicación sin especificar",
  "panel.refresh": "Actualizar",
  "panel.waResident":
    "Hola, soy ingeniero voluntario de EvalúaYa. Vi tu solicitud de orientación tras tu evaluación. ¿En qué puedo ayudarte?",

  // Admin
  "admin.title": "Administración de voluntarios",
  "admin.secret": "Clave de administrador",
  "admin.unlock": "Entrar",
  "admin.wrong": "Clave incorrecta.",
  "admin.pending": "Pendientes",
  "admin.approved": "Aprobados",
  "admin.requests": "Solicitudes de residentes",
  "admin.approve": "Aprobar",
  "admin.reject": "Rechazar",
  "admin.copyLink": "Copiar enlace del panel",
  "admin.linkCopied": "Enlace copiado",
  "admin.notifyWhatsapp": "Avisar por WhatsApp",
  "admin.noEmail": "Sin email",
  "admin.resendEmail": "Reenviar enlace por email",
  "admin.resent": "Enlace reenviado por email.",
  "admin.resendFailed": "No se pudo reenviar el email.",
  "admin.rotateLink": "Generar enlace nuevo",
  "admin.rotateConfirm":
    "Esto invalidará el enlace anterior del voluntario y generará uno nuevo. ¿Continuar?",
  "admin.rotated": "Enlace nuevo generado.",
  "admin.rotateFailed": "No se pudo generar el enlace.",
  "admin.none": "Sin registros.",

  // Panel — matching enhancements
  "panel.specialization": "Especialidad",
  "panel.ageNew": "Nueva",
  "panel.ageWaiting": "Esperando",
  "panel.ageDays": "d",

  // Admin dashboard
  "dash.title": "Panel de administración",
  "dash.subtitle": "Métricas de evaluaciones, voluntarios y conexiones.",
  "dash.toReview": "Revisar voluntarios",
  "dash.assessments": "Evaluaciones",
  "dash.totalReports": "Reportes totales",
  "dash.completion": "Tasa de análisis",
  "dash.drafts": "Borradores",
  "dash.areas": "Estados con datos",
  "dash.distribution": "Distribución de riesgo",
  "dash.trend": "Tendencia (30 días)",
  "dash.topStates": "Estados con más reportes",
  "dash.volunteers": "Voluntarios",
  "dash.buildings": "Edificios con varios reportes",
  "dash.buildingsHint":
    "Estructuras con 2 o más evaluaciones. Útil para detectar un mismo edificio que genera varias alertas.",
  "dash.reportsWord": "reportes",
  "dash.totalVolunteers": "Voluntarios totales",
  "dash.orgs": "Organizaciones",
  "dash.individuals": "individuales",
  "dash.coverage": "Cobertura por estado",
  "dash.matching": "Conexiones",
  "dash.requests": "Solicitudes",
  "dash.open": "Abiertas",
  "dash.openShort": "abiertas",
  "dash.claimRate": "Tasa de respuesta",
  "dash.avgClaim": "Tiempo prom. de respuesta",
  "dash.gaps": "Brechas de cobertura",
  "dash.gapsHint": "Estados con solicitudes abiertas y sin ingenieros aprobados.",
  "dash.noGaps": "Sin brechas de cobertura.",


  // Save / access reports (passwordless account)
  "account.saveTitle": "Guarda tus reportes",
  "account.saveBody":
    "¿Quieres volver a ver este reporte más adelante o desde otro teléfono? Recibe un enlace por correo para guardarlo. Sin contraseña.",
  "account.saveHint":
    "Solo usamos tu correo para enviarte el enlace de acceso. No es obligatorio.",
  "account.emailLabel": "Correo electrónico",
  "account.emailPlaceholder": "tucorreo@ejemplo.com",
  "account.sendLink": "Enviar enlace",
  "account.sending": "Enviando…",
  "account.invalidEmail": "Ingresa un correo válido.",
  "account.sendError": "No se pudo enviar el enlace. Intenta de nuevo.",
  "account.checkEmailTitle": "Revisa tu correo",
  "account.checkEmailBody":
    "Te enviamos un enlace de acceso. Ábrelo desde este teléfono o cualquier otro para ver tus reportes guardados.",
  "account.savedTitle": "Tus reportes están guardados",
  "account.savedBody":
    "Tu sesión está activa. Puedes ver tus reportes en cualquier momento.",
  "account.viewMyReports": "Mis reportes",
  "account.myReportsTitle": "Mis reportes",
  "account.signInBody":
    "Inicia sesión con tu correo para ver los reportes que has guardado.",
  "account.loading": "Cargando tus reportes…",
  "account.emptyReports":
    "Aún no tienes reportes guardados en esta cuenta. Cuando guardes un reporte, aparecerá aquí.",
  "account.signOut": "Cerrar sesión",
};


const en: Dict = {
  "app.name": "EvalúaYa",
  "app.tagline": "Post-earthquake structural damage self-assessment",
  "app.lang": "Language",
  "common.next": "Continue",
  "common.back": "Back",
  "common.start": "Start assessment",
  "common.cancel": "Cancel",
  "common.retry": "Retry",
  "common.optional": "optional",
  "common.step": "Step",
  "common.of": "of",
  "common.required": "This field is required",
  "common.offline": "Offline",
  "common.online": "Online",

  "home.heroTitle": "Check whether your home is safe",
  "home.heroSubtitle":
    "A step-by-step guide to review structural damage after an earthquake. No sign-up. Works on low bandwidth.",
  "home.startCta": "Start assessment",
  "home.howTitle": "How it works",
  "home.how1Title": "Property details",
  "home.how1Desc": "Record building type, floors and age.",
  "home.behalfTitle": "Outside the country or in a shelter?",
  "home.behalfBody":
    "You don't have to be in the building. A relative or neighbor can run the inspection for you and share the result so you can decide whether it's safe to return.",
  "home.how2Title": "Guided inspection",
  "home.how2Desc": "Answer the questionnaire and add a photo for each area.",
  "home.how3Title": "AI analysis",
  "home.how3Desc": "Get a risk level and recommended next steps.",
  "home.recentTitle": "Recent assessments",
  "home.recentEmpty": "You have not saved any assessments on this device yet.",
  "home.viewResult": "View result",

  "disclaimer.title": "Important notice",
  "disclaimer.body":
    "This tool gives preliminary guidance and is not a substitute for inspection by a licensed structural engineer or Civil Protection. If there is imminent danger, evacuate and call emergency services.",

  "property.title": "Property details",
  "property.subtitle": "This information helps interpret the findings.",
  "property.address": "Address / neighborhood",
  "property.addressPlaceholder": "e.g. Av. Bolívar, La Candelaria district",
  "property.buildingName": "Building or tower name",
  "property.buildingNamePlaceholder": "e.g. Torre Mara, Res. Doral Plaza",
  "property.buildingNameHint":
    "Optional. Helps group reports from the same building on the map. Don't include your apartment number.",
  "property.behalfHint":
    "Not on site? A relative or neighbor can run this inspection for you and share the result.",
  "property.buildingType": "Building type",
  "property.type.house": "House",
  "property.type.apartment": "Apartment",
  "property.type.commercial": "Commercial",
  "property.structuralType": "Structural system",
  "property.structuralType.help": "If unsure, leave it on “Not sure”.",
  "property.structToggle": "Specify structural system (optional)",
  "property.structHide": "Hide options",
  "property.struct.URM": "Unreinforced masonry (block/brick walls)",
  "property.struct.URM.desc":
    "Block or brick walls with no concrete columns or beams supporting them.",
  "property.struct.CMF": "Concrete moment frame (columns & beams)",
  "property.struct.CMF.desc": "A frame of reinforced concrete columns and beams.",
  "property.struct.CIW": "Concrete frame with infill walls",
  "property.struct.CIW.desc":
    "Concrete columns and beams with block walls filling between them.",
  "property.struct.PCF": "Precast concrete",
  "property.struct.PCF.desc": "Concrete elements made elsewhere and assembled on site.",
  "property.struct.RML": "Reinforced masonry (low-rise)",
  "property.struct.RML.desc":
    "Block/brick walls with steel reinforcement, few floors.",
  "property.struct.unknown": "Not sure",
  "property.struct.unknown.desc": "I don't know what the structure is made of.",
  "property.floors": "Number of floors",
  "property.floorsHigh": "Over 7 floors: extra caution is recommended.",
  "property.intensityDetected": "Estimated shaking intensity at this location",
  "property.intensityHigh": "High intensity (VII+): extra caution.",
  "property.age": "Approximate age",
  "property.age.pre1970": "Before 1970",
  "property.age.1970to2000": "1970 – 2000",
  "property.age.post2000": "After 2000",

  "checklist.title": "Guided inspection",
  "checklist.subtitle": "Inspect each area carefully.",
  "checklist.answer.yes": "Yes",
  "checklist.answer.no": "No",
  "checklist.answer.unsure": "Unsure",
  "checklist.addPhoto": "Add photo",
  "checklist.takePhoto": "Take photo",
  "checklist.fromGallery": "From gallery",
  "checklist.changePhoto": "Change photo",
  "checklist.removePhoto": "Remove photo",
  "checklist.photoHint": "A clear photo improves the analysis. You can use photos you already have.",
  "checklist.morePhotos": "Another photo",
  "checklist.answerAll": "Answer the essential questions to continue.",
  "checklist.analyze": "Analyze damage",
  "checklist.sectionStructure": "Structural checks",
  "checklist.sectionUtilities": "Utilities & interior",
  "checklist.optionalTag": "optional",
  "checklist.optionalNote":
    "The more you answer, the more accurate the analysis. Optional questions can be skipped.",
  "checklist.showOptional": "Add utility checks (optional)",
  "checklist.hideOptional": "Hide utility checks",
  "checklist.coreProgress": "essential",
  "checklist.remaining": "{n} left before you can analyze",
  "checklist.remainingOne": "essential question",
  "checklist.remainingMany": "essential questions",
  "checklist.photosOptional": "Photos are optional, but they improve the analysis.",

  "factors.title": "Why these results",
  "factors.flagged": "Flagged issues",
  "factors.age": "Building age",
  "factors.type": "Building type",
  "factors.intensity": "Seismic intensity",
  "factors.rules": "Safety rules triggered",
  "factors.empty": "Not enough data for this area yet.",
  "factors.unknown": "Unspecified",
  "factors.why": "Why",
  "factors.hideWhy": "Hide",
  "factors.reportsWord": "reports",
  "factors.intensity.light": "Light",
  "factors.intensity.moderate": "Moderate",
  "factors.intensity.strong": "Strong",
  "factors.intensity.severe": "Severe",
  "factors.intensity.unknown": "No data",
  "factors.rule.urm": "Unreinforced masonry",
  "factors.rule.liquefaction": "Soil liquefaction",
  "factors.rule.pounding": "Building pounding",
  "factors.rule.plumbing": "Gas / plumbing risk",
  "factors.rule.severe_shaking": "Very strong shaking",
  "dash.recentReports": "Recent reports",
  "dash.issuesWord": "issues",

  "item.foundation.area": "Foundation",
  "item.foundation.q": "Are there visible cracks or shifts in the foundation?",
  "item.liquefaction.area": "Ground / liquefaction",
  "item.liquefaction.q":
    "Are there signs of soil liquefaction? (water and sand bubbling up, pooling water where there was none, large fissures on sloping ground, pipes or tanks pushed to the surface, or sunken/tilted structures)",
  "item.exterior_walls.area": "Exterior walls",
  "item.exterior_walls.q":
    "Are there diagonal cracks or separation from neighboring buildings?",
  "item.pounding.area": "Building pounding",
  "item.pounding.q":
    "Did the building collide or pound against an adjacent building during the quake?",
  "item.interior_walls.area": "Interior walls",
  "item.interior_walls.q": "Are there cracks wider than 1 cm?",
  "item.flooring.area": "Flooring",
  "item.flooring.q":
    "Is there buckling, displaced tiles, or new gaps where the floor meets the baseboards?",
  "item.plumbing.area": "Plumbing / gas",
  "item.plumbing.q":
    "Are there leaking, cracked, or separated pipes? Do you hear rushing water or smell gas? (If you smell gas, shut off the main valve)",
  "item.electrical.area": "Electrical",
  "item.electrical.q":
    "Are there tripped breakers, damaged outlets, or exposed wiring?",
  "item.fixtures.area": "Fixtures",
  "item.fixtures.q":
    "Are light fixtures hanging unevenly or junction boxes pulled apart by the shaking?",
  "item.columns_beams.area": "Columns / beams",
  "item.columns_beams.q": "Is there spalling concrete or exposed rebar?",
  "item.doors_windows.area": "Doors / windows",
  "item.doors_windows.q": "Are there doors or windows that no longer open or close?",
  "item.roof.area": "Roof",
  "item.roof.q": "Is there visible deformation or roof collapse?",
  "item.stairs.area": "Stairs",
  "item.stairs.q": "Are the stairs cracked or separated from the walls?",

  "checklist.exampleToggle": "What does it look like?",
  "checklist.exampleYes": "Yes (sign of damage)",
  "checklist.exampleNo": "No (looks fine)",
  "item.foundation.example.yes": "The base has new cracks, looks sunken, or the floor is now uneven.",
  "item.foundation.example.no": "The base is still level with no new cracks.",
  "item.liquefaction.example.yes": "Water or sand bubbled up, there's pooling where there wasn't, or the ground sank or tilted.",
  "item.liquefaction.example.no": "The surrounding ground is still firm and dry, same as before.",
  "item.exterior_walls.example.yes": "Diagonal cracks (X or stair-step shape) or the wall pulled away from the building next door.",
  "item.exterior_walls.example.no": "Outside walls are still straight and connected, with no new cracks.",
  "item.pounding.example.yes": "Your building hit the neighbor: there are scuff marks, dents, or fallen material between them.",
  "item.pounding.example.no": "Normal gap with the neighboring building, no signs of collision.",
  "item.interior_walls.example.yes": "Cracks wide enough to fit a pencil or a coin on edge (more than 1 cm).",
  "item.interior_walls.example.no": "Only hairline lines, or no new cracks at all.",
  "item.flooring.example.yes": "The floor lifted, tiles popped up, or a gap opened next to the baseboard.",
  "item.flooring.example.no": "The floor is still flat and firm underfoot.",
  "item.plumbing.example.yes": "There are leaks, you hear water where there shouldn't be, or you smell gas.",
  "item.plumbing.example.no": "No leaks, no running-water sound, no gas smell.",
  "item.electrical.example.yes": "Breakers keep tripping, outlets are burnt, or loose wires are exposed.",
  "item.electrical.example.no": "Electricity works normally, with no exposed wires.",
  "item.fixtures.example.yes": "Light fixtures hang crooked or junction boxes pulled away from the wall.",
  "item.fixtures.example.no": "Fixtures and fittings are still firm and straight.",
  "item.columns_beams.example.yes": "Concrete chipped off and you can see the rebar (steel) inside.",
  "item.columns_beams.example.no": "Columns and beams are smooth, with no fallen concrete or visible steel.",
  "item.doors_windows.example.yes": "A door or window that used to open now jams or won't close.",
  "item.doors_windows.example.no": "Doors and windows open and close like always.",
  "item.roof.example.yes": "The roof looks sunken, warped, or part of it fell.",
  "item.roof.example.no": "The roof is still even, with no new sagging.",
  "item.stairs.example.yes": "The stairs are cracked or separated from the wall.",
  "item.stairs.example.no": "The stairs are still firm and attached to the wall.",

  "checklist.newDamageTitle": "Report only NEW damage",
  "checklist.newDamageBody": "Answer thinking only about damage that appeared with this earthquake. If a crack was already there before, don't mark it. If you're not sure whether it's new, choose \"Not sure\".",



  "rule.urm.finding":
    "Unreinforced masonry building: highly vulnerable after strong shaking.",
  "rule.urm.step":
    "Do not consider it safe to enter. Wait for an engineer or Civil Protection to assess it.",
  "rule.liquefaction.finding":
    "Soil liquefaction signs: the ground lost its bearing capacity.",
  "rule.liquefaction.step":
    "Do not enter. The structure may settle or tilt. Evacuate and report to authorities.",
  "rule.pounding.finding":
    "Pounding with an adjacent building: possible severe structural damage.",
  "rule.pounding.step": "Do not enter; evacuate the contact area between buildings.",
  "rule.plumbing.finding":
    "Severe plumbing damage or possible gas leak: immediate hazard.",
  "rule.plumbing.step":
    "Shut off the main gas and water valves, avoid lights or flames, and evacuate.",
  "rule.intensity.finding":
    "Moderate shaking (intensity VI or acceleration ≥0.25g) at this location.",
  "rule.intensity.step":
    "Increase caution: inspect more carefully and prioritize a professional assessment.",
  "rule.intensity_severe.finding":
    "Very strong shaking (intensity VIII+ or acceleration ≥0.50g) at this location.",
  "rule.intensity_severe.step":
    "This area received some of the strongest shaking from the quake. Treat any damage with maximum caution.",
  "rule.spectral.finding":
    "Seismic demand for buildings of this height was high (spectral acceleration ≥0.40g).",
  "rule.spectral.step":
    "Buildings of this height felt the shaking especially hard. Prioritize a professional review.",
  "rule.softsoil.finding":
    "Soft soil: amplifies shaking and raises liquefaction risk.",
  "rule.softsoil.step":
    "Watch for ground or building settlement and tilting.",
  "rule.softsoil_severe.finding":
    "Very soft soil: strong shaking amplification and high liquefaction risk.",
  "rule.softsoil_severe.step":
    "Inspect the ground and foundations carefully; prioritize a professional assessment.",
  "rule.combo_shaking.finding":
    "Very strong shaking combined with reported structural damage: critical life-safety risk.",
  "rule.combo_shaking.step":
    "Do not consider it safe. Evacuate and wait for an engineer or Civil Protection to confirm.",
  "rule.floors.finding": "Building over 7 floors: extra caution required.",
  "rule.floors.step":
    "Limit use until an engineer confirms the upper floors are safe.",
  "rule.structure.finding":
    "This building's structural system requires extra caution.",
  "rule.structure.step": "Limit use and prioritize a professional assessment.",

  "soil.rock": "Firm soil / rock",
  "soil.stiff": "Stiff soil",
  "soil.soft": "Soft soil",
  "soil.very_soft": "Very soft soil",




  "analyze.title": "Analyzing",
  "analyze.uploading": "Processing photos…",
  "analyze.thinking": "Assessing structural risk…",
  "analyze.savedHint":
    "Your answers are saved. You can wait even if the signal is slow.",
  "analyze.waitingTitle": "Waiting for connection",
  "analyze.waitingBody":
    "Your answers are saved. The analysis will run automatically when the connection returns.",
  "analyze.errorTitle": "The analysis could not be completed",
  "analyze.rateLimited":
    "Too many requests right now. Please wait a moment and try again.",
  "analyze.throttled":
    "You've reached the analysis limit for now. Please wait a bit before assessing another property.",
  "analyze.creditsError":
    "The AI service is temporarily unavailable. Please try again later.",
  "analyze.genericError":
    "Something went wrong during analysis. Check your connection and try again.",

  "result.title": "Assessment result",
  "result.green.tag": "Low risk",
  "result.green.action": "You may stay",
  "result.yellow.tag": "Moderate risk",
  "result.yellow.action": "Monitor and address",
  "result.orange.tag": "Moderate-to-serious risk",
  "result.orange.action": "You urgently need an engineer",
  "result.red.tag": "High risk",
  "result.red.action": "Evacuate immediately",
  "result.summary": "Summary",
  "result.findings": "Key findings",
  "result.nextSteps": "Recommended next steps",
  // Same-building context (resident result)
  "building.title": "Other reports from this building",
  "building.subtitle": "There are {count} more evaluation(s) from {name}.",
  "building.legend.red": "red",
  "building.legend.orange": "orange",
  "building.legend.yellow": "yellow",
  "building.legend.green": "green",
  "building.note":
    "Structural problems often affect a whole building. Share your result with your neighbors and the building's administration or condo board so the structure can be assessed together.",
  // Offline outbox / sync
  "offline.banner": "You're offline. Your assessment was saved and will send itself when the connection returns.",
  "offline.pendingOne": "1 assessment waiting to send.",
  "offline.pendingMany": "{n} assessments waiting to send.",
  "offline.syncNow": "Send now",
  // Provisional (offline) result
  "provisional.title": "Preliminary result",
  "provisional.subtitle": "We ran a quick check on your phone. When you're back online, we'll generate the full AI analysis automatically.",
  "provisional.badge": "Preliminary · offline",
  "provisional.syncing": "Generating full analysis…",
  "provisional.viewReports": "View my reports",
  "provisional.home": "Back to home",
  "provisional.multiDamage": "Visible damage was reported in several structural areas.",
  "provisional.singleDamage": "Visible damage was reported in one structural area.",
  "provisional.unsure": "Some answers were marked “Not sure”; a review is advisable.",
  "provisional.noFindings": "No obvious structural damage was reported in the inspection.",
  "provisional.step.evacuate": "As a precaution, avoid using the building until a professional review.",
  "provisional.step.limit": "Limit use of the affected areas until a review.",
  "provisional.step.engineer":
    "There is structural damage: limit use and seek an engineer's review soon.",
  "provisional.step.stay": "You may stay, but watch for new damage or aftershocks.",
  "result.photos": "Submitted photos",
  "result.seismicContext": "Seismic context",
  "result.mmi": "Intensity (MMI)",
  "result.pga": "Peak acceleration (PGA)",
  "result.pgv": "Peak velocity (PGV)",
  "result.spectralDemand": "Demand for this height",
  "result.soil": "Site soil",
  "result.seismicContextHint":
    "Data from the USGS ShakeMap for this earthquake, at this location. 'Demand for this height' is the spectral acceleration at the building's estimated natural period.",
  "result.share": "Share",
  "result.copyLink": "Copy link",
  "result.copied": "Link copied!",
  "result.downloadPdf": "Download PDF",
  "result.newAssessment": "New assessment",
  "result.disclaimerShort":
    "Preliminary guidance. Confirm with a structural engineer or Civil Protection.",
  "result.notFound": "This assessment could not be found.",
  "result.genericError": "Something went wrong. Please try again.",
  "result.goHome": "Go home",
  "result.assessedOn": "Assessed on",

  "pdf.title": "Structural assessment summary",
  "pdf.property": "Property",
  "pdf.riskLevel": "Risk level",
  "pdf.summary": "Summary",
  "pdf.findings": "Key findings",
  "pdf.nextSteps": "Recommended next steps",
  "pdf.inspection": "Inspection answers",
  "pdf.generated": "Generated by EvalúaYa",

  "common.loading": "Loading…",
  "nav.map": "Map",
  "nav.home": "Home",
  "nav.reports": "My reports",
  "nav.more": "More",
  "nav.language": "Language",
  "nav.help": "Help",
  "nav.feedback": "Send feedback",

  "feedback.title": "Send feedback",
  "feedback.subtitle":
    "Have an idea, a question, or found a problem? Tell us and help make EvalúaYa better.",
  "feedback.messageLabel": "Your message",
  "feedback.messagePlaceholder":
    "Write your comment, suggestion, or problem here…",
  "feedback.emailLabel": "Your email",
  "feedback.emailPlaceholder": "you@example.com",
  "feedback.emailHint": "Only if you'd like us to reply.",
  "feedback.submit": "Send feedback",
  "feedback.sending": "Sending…",
  "feedback.error": "Couldn't send. Please try again in a moment.",
  "feedback.thanksTitle": "Thanks for your feedback!",
  "feedback.thanksBody":
    "We read every message. Your input helps make EvalúaYa more useful for everyone.",
  "feedback.backHome": "Back to home",
  "feedback.privacy":
    "We don't collect personal data. Your email is optional and only used to reply to you.",
  "feedback.promptTitle": "How was it?",
  "feedback.promptBody": "Share your thoughts to help improve the app.",

  "help.title": "Help",
  "help.subtitle":
    "Learn how to use EvalúaYa and find answers to common questions.",
  "help.quickStartTitle": "How to run an assessment",
  "help.step1Title": "1. Property info",
  "help.step1Desc":
    "Enter the address, building type, number of floors, and approximate age.",
  "help.step2Title": "2. Guided inspection",
  "help.step2Desc":
    "Answer simple Yes / No / Unsure questions area by area and, if you can, add a photo.",
  "help.step3Title": "3. AI analysis",
  "help.step3Desc":
    "Get a risk level (Green / Yellow / Red) with a plain-language explanation and next steps.",
  "help.step4Title": "4. Save & share",
  "help.step4Desc":
    "Download a PDF, share it on WhatsApp, or save it to reference later.",
  "help.startCta": "Start assessment",
  "help.faqTitle": "Frequently asked questions",
  "help.faq.freeQ": "Is the app free?",
  "help.faq.freeA": "Yes. EvalúaYa is completely free.",
  "help.faq.signupQ": "Do I need to sign up?",
  "help.faq.signupA":
    "No. You can assess your home without creating an account. If you'd like to save your reports for later, you can create an optional account with your email.",
  "help.faq.offlineQ": "Does it work offline or with a weak signal?",
  "help.faq.offlineA":
    "Yes. You can fill out the checklist with low signal; your progress is saved on your device and the analysis is sent once you're back online.",
  "help.faq.resultsQ": "What do the result colors mean?",
  "help.faq.resultsA":
    "Green: no obvious structural risk detected. Yellow: use the building with caution and seek a professional review. Red: possible serious danger; evacuate and contact the authorities.",
  "help.faq.privacyQ": "Is my data private?",
  "help.faq.privacyA":
    "Yes. The assessment is anonymous. We don't ask for your name or personal details to use the app.",
  "help.faq.saveQ": "How do I save and revisit my reports?",
  "help.faq.saveA":
    "On the results screen you can create an account with your email (passwordless magic link) to access your reports from “My reports” anytime.",
  "help.faq.photosQ": "Are photos required?",
  "help.faq.photosA":
    "No. Photos are optional, but they help make the analysis more accurate.",
  "help.faq.officialQ": "Does this replace an official inspection?",
  "help.faq.officialA":
    "No. EvalúaYa offers preliminary guidance and does not replace an inspection by a licensed structural engineer or Civil Protection.",
  "help.moreTitle": "Need more help?",
  "help.moreBody":
    "Reach out if you have a question that isn't covered here, or learn how we calculate results.",
  "help.contactCta": "Send a message",


  "home.timePromise": "Free · 2 minutes · no sign-up",
  "home.trustFree": "Free",
  "home.trustNoSignup": "No sign-up",
  "home.trustOffline": "Works offline",
  "home.trustAnon": "Anonymous",
  "home.seoTagline":
    "Know in 2 minutes whether your home is safe to enter after the quake.",
  "home.statBuildings": "buildings assessed",
  "home.statAreas": "areas with reports",
  "home.pendingTitle": "You have an unsent assessment",
  "home.pendingBody": "You finished the checklist offline. Submit it now to get your result.",
  "home.pendingOffline": "Offline. It will be sent automatically when the signal returns.",
  "home.pendingCta": "Submit assessment",
  "home.mapTitle": "Community damage map",
  "home.mapDesc": "See how your area is doing based on reports from others.",
  "home.viewMap": "View damage map",
  "home.exploreTitle": "Explore your state",
  "home.exploreDesc":
    "Check reports and assess your home based on your state.",
  "zona.breadcrumbHome": "Home",
  "zona.eyebrow": "Regional report",
  "zona.h1Prefix": "Structural damage in",
  "zona.intro":
    "See how {estado} is doing based on anonymous community reports, and assess your home for free, with no sign-up, in just a few minutes.",
  "zona.ctaPrefix": "Assess my home in",
  "zona.totalReports": "Reports in the state",
  "zona.municipios": "Municipalities with reports",
  "zona.lastReport": "Last report",
  "zona.noData":
    "There are no reports in {estado} yet. Be the first to assess your home and help your community.",
  "zona.aboutTitle": "How is this data calculated?",
  "zona.aboutBody":
    "The figures are anonymous counts of self-assessments done in the app. We never show addresses, photos or personal data.",
  "zona.viewMap": "View the full map",
  "zona.otherStates": "Other states",
  "zona.notFound": "We couldn't find that state.",


  "property.state": "State",
  "property.statePlaceholder": "Select",
  "property.municipality": "Municipality",
  "property.municipalityPlaceholder": "e.g. Baruta",
  "property.locationHint":
    "We only use the area (state/municipality) for the community map. Your exact address is never shown.",
  "property.detecting": "Detecting your location…",
  "property.detected": "Location detected. You can change it if it's not correct.",
  "property.detectFailed": "We couldn't detect your location. Please select your state.",
  "property.stateRequired": "Select your state to continue.",
  "property.effortHint": "It only takes a few minutes. Photos are optional.",
  "property.missingPrefix": "To continue, you still need:",
  "property.miss.state": "state",
  "property.miss.type": "building type",
  "property.miss.age": "age",

  "map.title": "Damage map",
  "map.subtitle":
    "Anonymous reports aggregated by area. Addresses and photos are never shown.",
  "map.totalAssessments": "Assessments",
  "map.areasLabel": "Areas",
  "map.high": "High risk",
  "map.urgent": "Serious risk",
  "map.moderate": "Moderate risk",
  "map.low": "Low risk",
  "map.distribution": "Risk distribution",
  "map.geoTitle": "Geographic view",
  "map.geoHint": "Size shows number of reports; color shows the dominant risk.",
  "map.legendSize": "Size = number of reports",
  "map.legendRisk": "Color = dominant risk",
  "map.legendTitle": "What does each color mean?",
  "map.legendGreen": "Green: no visible damage. Normal use.",
  "map.legendYellow": "Yellow: minor damage. Monitor and address soon.",
  "map.legendOrange": "Orange: moderate-to-serious damage. You urgently need an engineer.",
  "map.legendRed": "Red: severe damage. Do not enter; evacuate.",
  "map.topAreas": "Areas with most reports",
  "map.reports": "reports",
  "map.unspecifiedMunicipality": "Municipality not specified",
  "map.unspecifiedLocation": "Location not specified",
  "map.interactiveHint": "Zoom in for municipality-level detail. Tap an area to see its data.",
  "map.viewZone": "View zone",
  "map.mapLoading": "Loading map…",
  "map.mapUnavailable": "The interactive map isn't available here. Showing a simplified view.",
  "map.atState": "Located at state level",

  "map.lastUpdated": "Updated",
  "map.empty": "Not enough assessments yet to show the map.",
  "map.startCta": "Assess your building",
  "map.download": "Download data (CSV)",
  "map.dataNote": "Open, anonymized data for authorities, NGOs and press.",
  "map.cardHeadline": "Structural damage reported",
  "map.cardCta": "Assess your home free at EvalúaYa",

  "result.shareWhatsapp": "Share on WhatsApp",
  "result.whatsappMessage":
    "I assessed my building's structural damage with EvalúaYa. Assess yours too, it's free:",
  "result.inviteTitle": "Help your community",
  "result.inviteBody":
    "Share EvalúaYa with your neighbors. The more people assess, the better we understand each area's damage.",
  "result.inviteCta": "Invite a neighbor",
  "result.proofText": "assessments completed so far",
  "result.viewMap": "View your area's damage map",
  "result.shareCard": "Share result image",
  "result.cardFooter": "Post-earthquake structural self-assessment · Not a substitute for a professional inspection",

  "share.title": "Help spread EvalúaYa",
  "share.body":
    "Share it with your family and neighbors. The more people assess their homes, the better we understand each area's damage.",
  "share.whatsapp": "Share on WhatsApp",
  "share.copy": "Copy link",
  "share.copied": "Link copied!",
  "share.message":
    "Assess your home's earthquake damage with EvalúaYa — free, no sign-up, works on low signal:",
  "share.generating": "Generating image…",
  "share.imageSaved": "Image saved. Share it anywhere.",
  "share.shareStats": "Share stats",



  "inst.title": "Are you an authority or organization?",
  "inst.body":
    "If you represent a municipality, Civil Protection, an NGO or the private sector and need access to this data, leave your details.",
  "inst.org": "Organization",
  "inst.orgPlaceholder": "e.g. Civil Protection",
  "inst.name": "Contact name",
  "inst.namePlaceholder": "Your name",
  "inst.email": "Email",
  "inst.emailPlaceholder": "you@organization.com",
  "inst.note": "Message",
  "inst.notePlaceholder": "How would you use the data?",
  "inst.submit": "Submit interest",
  "inst.success": "Thanks! We'll be in touch soon.",
  "inst.error": "Could not send. Please try again.",
  "inst.invalid": "Check the organization and email.",

  "nav.methodology": "Methodology",
  "home.methodologyLink": "How the result is calculated",

  "methodology.title": "How EvalúaYa works",
  "methodology.subtitle":
    "How we calculate the result and where our credibility comes from.",
  "methodology.maintainedBy":
    "This page is maintained by the EvalúaYa team to explain how the tool works. It may be updated as we improve the method.",
  "methodology.intro":
    "EvalúaYa combines proven safety rules with an AI analysis of your answers and photos to give quick guidance: green, yellow or red. Here we explain each step so you can validate it before using or sharing it.",

  "methodology.layersTitle": "Two layers of analysis",
  "methodology.layersIntro":
    "Every assessment runs through two layers. The final result always takes the more severe of the two.",

  "methodology.layerA.title": "Layer 1 · Safety rules",
  "methodology.layerA.body":
    "Deterministic rules based on professional rapid-assessment practice. They always apply and can override the AI when there are clear life-safety hazards.",
  "methodology.red.title": "Force RED (do not enter)",
  "methodology.red.urm":
    "Unreinforced masonry: block or brick walls without a concrete structure.",
  "methodology.red.liquefaction":
    "Signs of soil liquefaction: sinking, cracks with mud or water.",
  "methodology.red.pounding":
    "Pounding between neighboring buildings during the quake.",
  "methodology.red.plumbing": "Severe plumbing or gas damage.",
  "methodology.red.combo":
    "Very strong shaking (MMI VIII+ or PGA ≥0.50g) together with reported structural damage.",
  "methodology.yellow.title": "Escalate to YELLOW (caution)",
  "methodology.yellow.intensity":
    "Moderate shaking at your location: intensity MMI VI+ or peak ground acceleration (PGA) ≥0.25g.",
  "methodology.yellow.soil":
    "Soft soil (low vs30), which amplifies shaking and raises liquefaction risk.",
  "methodology.yellow.floors": "Buildings taller than 7 floors.",
  "methodology.yellow.structure":
    "More vulnerable structural systems: concrete moment frames, infill walls, precast, or low-rise reinforced masonry.",
  "methodology.orange.title": "Escalate to ORANGE (you need an engineer soon)",
  "methodology.orange.urm":
    "Unreinforced masonry, even with no visible damage or strong shaking: because it is so brittle it needs a professional look soon.",
  "methodology.orange.severe":
    "Very strong shaking at your location (MMI VIII+ or PGA ≥0.50g), even without visible damage.",
  "methodology.orange.spectral":
    "High seismic demand for the building's height: spectral acceleration ≥0.40g at its estimated period.",
  "methodology.orange.soil":
    "Very soft soil (very low vs30), which strongly amplifies shaking and raises liquefaction risk.",
  "reclassify.orange.note":
    " Updated to Orange under the new 4-level scale: the reported structural items need an engineer's inspection.",
  "reclassify.updated":
    "Result updated from \u201C{from}\u201D to \u201C{to}\u201D under the new 4-level scale (🟢🟡🟠🔴), which better separates moderate from serious damage.",

  "methodology.layerB.title": "Layer 2 · AI analysis",
  "methodology.layerB.body":
    "Your checklist answers and one key photo per area are sent to an AI vision model that acts as an ATC-20-style rapid triage and returns a risk level with findings and steps in plain language. The AI is conservative: when safety is uncertain, it does not choose green.",

  "methodology.checklistTitle": "What you inspect",
  "methodology.checklistBody":
    "The checklist covers 9 required structural points (foundations, walls, columns and beams, roof, stairs, liquefaction, pounding) and 4 optional utility points (floors, plumbing, electrical, hanging fixtures and objects).",

  "methodology.seismicTitle": "Seismic context",
  "methodology.seismicBody":
    "If you share your location, we read several layers of the official USGS ShakeMap grid for the active earthquake, interpolated to your exact point: intensity (MMI), peak ground acceleration (PGA), peak ground velocity (PGV), spectral acceleration at different periods, and soil stiffness (vs30). We estimate the building's natural period from its height (T ≈ 0.1 × floors) and match it to the spectral acceleration at that period, to gauge how much shaking a building of that height actually felt. Soft soil (low vs30) is flagged because it amplifies shaking and favors liquefaction. These values raise the caution level in a graduated way and are included in the context the AI receives.",

  "methodology.sourcesTitle": "Sources & credibility",
  "methodology.sourcesIntro":
    "Our logic is modeled on recognized public frameworks:",
  "methodology.source.atc20":
    "ATC-20 — Rapid post-earthquake building safety evaluation (the green/yellow/red placard concept).",
  "methodology.source.usgs":
    "USGS ShakeMap and the Modified Mercalli Intensity (MMI) scale for shaking intensity.",
  "methodology.source.urm":
    "Earthquake-engineering consensus on the vulnerability of unreinforced masonry and soft stories.",
  "methodology.source.ai":
    "AI vision model via the Lovable AI Gateway, used for preliminary triage (not a certifier).",

  "methodology.limitsTitle": "Limits & shared responsibility",
  "methodology.limit.notCert":
    "This is NOT a certification and does not replace a licensed engineer or Civil Protection. It is preliminary guidance.",
  "methodology.limit.surface":
    "It only assesses the visible things you report. It does not inspect hidden elements, buried foundations, or the inside of walls.",
  "methodology.limit.depends":
    "Result quality depends on your answers and the sharpness of the photos.",
  "methodology.limit.privacy":
    "No sign-up required. We only use the area (state/municipality) for the community map; we never show your exact address or your photos.",

  "methodology.engineersTitle": "For engineers",
  "methodology.engineersBody":
    "Want to validate the algorithm at the code level? Download the technical specification: it includes the deterministic rules, the seismic intensity interpolation (USGS ShakeMap), the exact AI model prompt, and the merge logic.",
  "methodology.specDownload": "Download technical spec (PDF)",

  "methodology.ctaTitle": "Ready to assess?",
  "methodology.cta": "Start assessment",
  "methodology.disclaimer":
    "In an emergency, call Civil Protection or emergency services.",

  // ----- Volunteer engineers (EN) -----
  "nav.volunteers": "Volunteer engineers",

  "connect.title": "Talk to a volunteer engineer",
  "connect.subtitleRed":
    "Your result is RED. A volunteer engineer can guide you on next steps. Free and no obligation.",
  "connect.subtitleYellow":
    "A volunteer engineer can help you interpret these findings. Free and no obligation.",
  "connect.directTitle": "Engineers available in your area",
  "connect.coversYourState": "Covers your state",
  "connect.whatsappEngineer": "Message on WhatsApp",
  "connect.revealConsent":
    "By continuing you'll share your contact with this volunteer on WhatsApp.",
  "connect.revealing": "Opening…",
  "connect.revealError": "Couldn't open the contact. Please try again.",
  "connect.orgBadge": "Organization",
  "connect.noneTitle": "We're still adding engineers in your state",
  "connect.noneBody":
    "Leave your number and a volunteer engineer will reach out as soon as there's coverage in your area.",
  "connect.requestTitle": "Request a callback",
  "connect.requestBody":
    "Prefer an engineer to message you? Leave your WhatsApp and we'll share your report only with approved engineers in your state.",
  "connect.requestCta": "Request contact",
  "connect.requestSending": "Sending…",
  "connect.requestDone": "Done! An engineer will contact you soon.",
  "connect.requestError": "Could not send. Please try again.",
  "connect.yourWhatsapp": "Your WhatsApp number",
  "connect.whatsappPlaceholder": "e.g. 0414 123 4567",
  "connect.whatsappHint":
    "Include your area code. If you're in Venezuela you can use your local number (e.g. 0414…); we add the country code (+58) automatically.",
  "connect.noteOptional": "Message (optional)",
  "connect.notePlaceholder": "e.g. Large cracks in the living room.",
  "connect.privacy":
    "Your number is only shared with approved volunteer engineers in your state. It's never published.",
  "connect.areEngineer": "Are you an engineer? Join as a volunteer",
  "connect.waMessage":
    "Hi, I completed an EvalúaYa assessment and my result needs guidance. Here's my report:",

  "vol.title": "Volunteer engineers",
  "vol.subtitle":
    "Lend your expertise to help families understand the damage to their homes after an earthquake.",
  "vol.how1": "Sign up with your WhatsApp and the states you can cover.",
  "vol.how2": "We review your request and send you a private link.",
  "vol.how3":
    "You receive requests from people with risk results in your area and respond over WhatsApp.",
  "vol.formTitle": "I want to volunteer",
  "vol.name": "Full name",
  "vol.namePlaceholder": "e.g. Eng. María Pérez",
  "vol.org": "Company or organization (optional)",
  "vol.orgPlaceholder": "e.g. Engineering Association",
  "vol.whatsapp": "WhatsApp",
  "vol.email": "Email",
  "vol.emailHint":
    "We need it to send you your access link once you're validated.",
  "vol.states": "States you can cover",
  "vol.statesHint": "Select one or more.",
  "vol.specialization": "Specialty (optional)",
  "vol.specializationPlaceholder": "e.g. Structures, geotechnics…",
  "vol.note": "Message (optional)",
  "vol.submit": "Submit request",
  "vol.sending": "Sending…",
  "vol.successTitle": "Thanks for joining!",
  "vol.successBody":
    "We'll review your request and send you a private link to see requests in your area.",
  "vol.error": "Check the fields and try again.",
  "vol.selectStates": "Select at least one state.",
  "vol.typeLabel": "I'm joining as",
  "vol.typeIndividual": "Individual engineer",
  "vol.typeOrg": "Organization / company",
  "vol.orgName": "Organization name",
  "vol.orgNamePlaceholder": "e.g. Structural Solutions C.A.",
  "vol.contactName": "Contact person",
  "vol.contactNamePlaceholder": "e.g. Eng. María Pérez",
  "vol.orgSpecialization": "Areas of expertise / services (optional)",
  "vol.orgRequired": "Please enter the organization name.",

  "panel.title": "Volunteer engineer panel",
  "panel.welcome": "Hi",
  "panel.coverage": "Coverage",
  "panel.invalid": "Invalid or unapproved link",
  "panel.invalidBody":
    "This link doesn't match an approved volunteer. If you think this is a mistake, contact us.",
  "panel.empty": "No open requests in your area right now.",
  "panel.openRequests": "Requests",
  "panel.claim": "I'm available",
  "panel.claimed": "You're handling this",
  "panel.close": "Mark as handled",
  "panel.contactResident": "Message resident",
  "panel.contactLocked":
    "Tap \"I'm available\" to see the resident's contact.",
  "panel.expired": "Link expired",
  "panel.expiredBody":
    "Your access link expired for security. Contact us to get a new one.",
  "panel.viewReport": "View report",
  "panel.noLocation": "Location not specified",
  "panel.refresh": "Refresh",
  "panel.waResident":
    "Hi, I'm a volunteer engineer from EvalúaYa. I saw your request for guidance after your assessment. How can I help?",

  "admin.title": "Volunteer administration",
  "admin.secret": "Admin key",
  "admin.unlock": "Enter",
  "admin.wrong": "Incorrect key.",
  "admin.pending": "Pending",
  "admin.approved": "Approved",
  "admin.requests": "Resident requests",
  "admin.approve": "Approve",
  "admin.reject": "Reject",
  "admin.copyLink": "Copy panel link",
  "admin.linkCopied": "Link copied",
  "admin.notifyWhatsapp": "Notify via WhatsApp",
  "admin.noEmail": "No email",
  "admin.resendEmail": "Resend link by email",
  "admin.resent": "Link resent by email.",
  "admin.resendFailed": "Couldn't resend the email.",
  "admin.rotateLink": "Generate new link",
  "admin.rotateConfirm":
    "This invalidates the volunteer's previous link and creates a new one. Continue?",
  "admin.rotated": "New link generated.",
  "admin.rotateFailed": "Couldn't generate the link.",
  "admin.none": "No records.",

  // Panel — matching enhancements
  "panel.specialization": "Specialty",
  "panel.ageNew": "New",
  "panel.ageWaiting": "Waiting",
  "panel.ageDays": "d",

  // Admin dashboard
  "dash.title": "Admin dashboard",
  "dash.subtitle": "Assessment, volunteer and matching metrics.",
  "dash.toReview": "Review volunteers",
  "dash.assessments": "Assessments",
  "dash.totalReports": "Total reports",
  "dash.completion": "Analysis rate",
  "dash.drafts": "Drafts",
  "dash.areas": "States with data",
  "dash.distribution": "Risk distribution",
  "dash.trend": "Trend (30 days)",
  "dash.topStates": "States with most reports",
  "dash.volunteers": "Volunteers",
  "dash.buildings": "Buildings with multiple reports",
  "dash.buildingsHint":
    "Structures with 2 or more evaluations. Useful for spotting a single building generating several alerts.",
  "dash.reportsWord": "reports",
  "dash.totalVolunteers": "Total volunteers",
  "dash.orgs": "Organizations",
  "dash.individuals": "individual",
  "dash.coverage": "Coverage by state",
  "dash.matching": "Matching",
  "dash.requests": "Requests",
  "dash.open": "Open",
  "dash.openShort": "open",
  "dash.claimRate": "Response rate",
  "dash.avgClaim": "Avg. response time",
  "dash.gaps": "Coverage gaps",
  "dash.gapsHint": "States with open requests and no approved engineers.",
  "dash.noGaps": "No coverage gaps.",


  // Save / access reports (passwordless account)
  "account.saveTitle": "Save your reports",
  "account.saveBody":
    "Want to see this report later or from another phone? Get a link by email to save it. No password needed.",
  "account.saveHint":
    "We only use your email to send you the access link. It's optional.",
  "account.emailLabel": "Email address",
  "account.emailPlaceholder": "you@example.com",
  "account.sendLink": "Send link",
  "account.sending": "Sending…",
  "account.invalidEmail": "Enter a valid email.",
  "account.sendError": "Couldn't send the link. Please try again.",
  "account.checkEmailTitle": "Check your email",
  "account.checkEmailBody":
    "We sent you an access link. Open it on this phone or any other to see your saved reports.",
  "account.savedTitle": "Your reports are saved",
  "account.savedBody":
    "You're signed in. You can view your reports anytime.",
  "account.viewMyReports": "My reports",
  "account.myReportsTitle": "My reports",
  "account.signInBody":
    "Sign in with your email to see the reports you've saved.",
  "account.loading": "Loading your reports…",
  "account.emptyReports":
    "You don't have any saved reports in this account yet. Once you save a report, it will appear here.",
  "account.signOut": "Sign out",
};


const dictionaries: Record<Lang, Dict> = { es, en };

export function translate(lang: Lang, key: string): string {
  return dictionaries[lang][key] ?? dictionaries.es[key] ?? key;
}

type LanguageContextValue = {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: (key: string) => string;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("es");

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY) as Lang | null;
      if (stored === "es" || stored === "en") setLangState(stored);
    } catch {
      /* ignore */
    }
  }, []);

  const setLang = (next: Lang) => {
    setLangState(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* ignore */
    }
    if (typeof document !== "undefined") {
      document.documentElement.lang = next;
    }
  };

  const value: LanguageContextValue = {
    lang,
    setLang,
    t: (key: string) => translate(lang, key),
  };

  return (
    <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
  );
}

export function useLang(): LanguageContextValue {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLang must be used within LanguageProvider");
  return ctx;
}
