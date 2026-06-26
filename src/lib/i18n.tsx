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
  "result.yellow.action": "Limita el uso",
  "result.red.tag": "Riesgo alto",
  "result.red.action": "Evacúa de inmediato",
  "result.summary": "Resumen",
  "result.findings": "Hallazgos clave",
  "result.nextSteps": "Pasos recomendados",
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

  "map.title": "Mapa de daños",
  "map.subtitle":
    "Reportes anónimos y agregados por zona. Nunca se muestran direcciones ni fotos.",
  "map.totalAssessments": "Evaluaciones",
  "map.areasLabel": "Zonas",
  "map.high": "Riesgo alto",
  "map.moderate": "Riesgo moderado",
  "map.low": "Riesgo bajo",
  "map.distribution": "Distribución de riesgo",
  "map.geoTitle": "Vista geográfica",
  "map.geoHint": "El tamaño indica cantidad de reportes; el color, el riesgo predominante.",
  "map.legendSize": "Tamaño = cantidad de reportes",
  "map.legendRisk": "Color = riesgo predominante",
  "map.topAreas": "Zonas con más reportes",
  "map.reports": "reportes",
  "map.unspecifiedMunicipality": "Municipio sin especificar",
  "map.unspecifiedLocation": "Ubicación sin especificar",

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
  "methodology.yellow.spectral":
    "Demanda sísmica alta para la altura del edificio: aceleración espectral ≥0.40g en su período estimado.",
  "methodology.yellow.soil":
    "Suelo blando o muy blando (vs30 bajo), que amplifica la sacudida y aumenta el riesgo de licuefacción.",
  "methodology.yellow.floors": "Edificios de más de 7 pisos.",
  "methodology.yellow.structure":
    "Sistemas estructurales más vulnerables: pórticos de concreto, paredes de relleno, prefabricado o mampostería reforzada baja.",

  "methodology.layerB.title": "Capa 2 · Análisis con IA",
  "methodology.layerB.body":
    "Tus respuestas del cuestionario y una foto clave por área se envían a un modelo de visión por IA, que actúa como un triaje rápido tipo ATC-20 y devuelve un nivel de riesgo con hallazgos y pasos en lenguaje sencillo. La IA es conservadora: ante la duda sobre la seguridad, no elige verde.",

  "methodology.checklistTitle": "Qué inspeccionas",
  "methodology.checklistBody":
    "El cuestionario cubre 9 puntos estructurales obligatorios (fundaciones, paredes, columnas y vigas, techo, escaleras, licuación, golpeteo) y 4 puntos opcionales de servicios (pisos, plomería, electricidad, lámparas y objetos colgantes).",

  "methodology.seismicTitle": "Contexto sísmico",
  "methodology.seismicBody":
    "Si compartes tu ubicación, estimamos la intensidad de sacudida (escala de Mercalli Modificada, MMI) interpolando la malla oficial de ShakeMap del USGS para el sismo activo. Una mayor intensidad eleva el nivel de precaución.",

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
  "result.yellow.action": "Limit use",
  "result.red.tag": "High risk",
  "result.red.action": "Evacuate immediately",
  "result.summary": "Summary",
  "result.findings": "Key findings",
  "result.nextSteps": "Recommended next steps",
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

  "map.title": "Damage map",
  "map.subtitle":
    "Anonymous reports aggregated by area. Addresses and photos are never shown.",
  "map.totalAssessments": "Assessments",
  "map.areasLabel": "Areas",
  "map.high": "High risk",
  "map.moderate": "Moderate risk",
  "map.low": "Low risk",
  "map.distribution": "Risk distribution",
  "map.geoTitle": "Geographic view",
  "map.geoHint": "Size shows number of reports; color shows the dominant risk.",
  "map.legendSize": "Size = number of reports",
  "map.legendRisk": "Color = dominant risk",
  "map.topAreas": "Areas with most reports",
  "map.reports": "reports",
  "map.unspecifiedMunicipality": "Municipality not specified",
  "map.unspecifiedLocation": "Location not specified",

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
  "methodology.yellow.title": "Escalate to YELLOW (caution)",
  "methodology.yellow.intensity":
    "Estimated shaking intensity MMI VII or higher at your location.",
  "methodology.yellow.floors": "Buildings taller than 7 floors.",
  "methodology.yellow.structure":
    "More vulnerable structural systems: concrete moment frames, infill walls, precast, or low-rise reinforced masonry.",

  "methodology.layerB.title": "Layer 2 · AI analysis",
  "methodology.layerB.body":
    "Your checklist answers and one key photo per area are sent to an AI vision model that acts as an ATC-20-style rapid triage and returns a risk level with findings and steps in plain language. The AI is conservative: when safety is uncertain, it does not choose green.",

  "methodology.checklistTitle": "What you inspect",
  "methodology.checklistBody":
    "The checklist covers 9 required structural points (foundations, walls, columns and beams, roof, stairs, liquefaction, pounding) and 4 optional utility points (floors, plumbing, electrical, hanging fixtures and objects).",

  "methodology.seismicTitle": "Seismic context",
  "methodology.seismicBody":
    "If you share your location, we estimate the shaking intensity (Modified Mercalli Intensity, MMI) by interpolating the official USGS ShakeMap grid for the active earthquake. Higher intensity raises the caution level.",

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
