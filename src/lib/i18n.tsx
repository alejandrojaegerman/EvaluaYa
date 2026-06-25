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
  "home.how2Desc": "Responde 7 preguntas y sube una foto de cada área.",
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
  "property.floors": "Número de pisos",
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
  "checklist.changePhoto": "Cambiar foto",
  "checklist.removePhoto": "Quitar foto",
  "checklist.photoHint": "Una foto clara mejora el análisis.",
  "checklist.morePhotos": "Otra foto",
  "checklist.answerAll": "Responde todas las preguntas para continuar.",
  "checklist.analyze": "Analizar daños",

  "item.foundation.area": "Cimientos",
  "item.foundation.q": "¿Hay grietas visibles o hundimientos en los cimientos?",
  "item.exterior_walls.area": "Muros exteriores",
  "item.exterior_walls.q":
    "¿Hay grietas diagonales o separación respecto a edificios vecinos?",
  "item.interior_walls.area": "Muros interiores",
  "item.interior_walls.q": "¿Hay grietas más anchas de 1 cm?",
  "item.columns_beams.area": "Columnas / vigas",
  "item.columns_beams.q":
    "¿Hay concreto desprendido (descascarado) o acero (cabilla) expuesto?",
  "item.doors_windows.area": "Puertas / ventanas",
  "item.doors_windows.q": "¿Hay puertas o ventanas que ya no abren o cierran?",
  "item.roof.area": "Techo",
  "item.roof.q": "¿Hay deformación visible o colapso del techo?",
  "item.stairs.area": "Escaleras",
  "item.stairs.q": "¿Hay escaleras agrietadas o separadas de los muros?",

  "analyze.title": "Analizando",
  "analyze.uploading": "Procesando fotos…",
  "analyze.thinking": "Evaluando el riesgo estructural…",
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
  "home.statBuildings": "edificios evaluados",
  "home.statAreas": "zonas con reportes",
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
  "map.lastUpdated": "Actualizado",
  "map.empty": "Aún no hay evaluaciones suficientes para mostrar el mapa.",
  "map.startCta": "Evalúa tu edificio",
  "map.download": "Descargar datos (CSV)",
  "map.dataNote":
    "Datos abiertos y anónimos para autoridades, ONG y prensa.",

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
  "home.how2Desc": "Answer 7 questions and add a photo for each area.",
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
  "property.floors": "Number of floors",
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
  "checklist.changePhoto": "Change photo",
  "checklist.removePhoto": "Remove photo",
  "checklist.photoHint": "A clear photo improves the analysis.",
  "checklist.morePhotos": "Another photo",
  "checklist.answerAll": "Answer all questions to continue.",
  "checklist.analyze": "Analyze damage",

  "item.foundation.area": "Foundation",
  "item.foundation.q": "Are there visible cracks or shifts in the foundation?",
  "item.exterior_walls.area": "Exterior walls",
  "item.exterior_walls.q":
    "Are there diagonal cracks or separation from neighboring buildings?",
  "item.interior_walls.area": "Interior walls",
  "item.interior_walls.q": "Are there cracks wider than 1 cm?",
  "item.columns_beams.area": "Columns / beams",
  "item.columns_beams.q": "Is there spalling concrete or exposed rebar?",
  "item.doors_windows.area": "Doors / windows",
  "item.doors_windows.q": "Are there doors or windows that no longer open or close?",
  "item.roof.area": "Roof",
  "item.roof.q": "Is there visible deformation or roof collapse?",
  "item.stairs.area": "Stairs",
  "item.stairs.q": "Are the stairs cracked or separated from the walls?",

  "analyze.title": "Analyzing",
  "analyze.uploading": "Processing photos…",
  "analyze.thinking": "Assessing structural risk…",
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
  "home.statBuildings": "buildings assessed",
  "home.statAreas": "areas with reports",
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
  "map.lastUpdated": "Updated",
  "map.empty": "Not enough assessments yet to show the map.",
  "map.startCta": "Assess your building",
  "map.download": "Download data (CSV)",
  "map.dataNote": "Open, anonymized data for authorities, NGOs and press.",

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
