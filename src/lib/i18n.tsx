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
  "home.behalfTitle": "¿No puedes entrar al edificio?",
  "home.behalfBody":
    "No tienes que estar dentro. Un familiar o vecino puede hacer la inspección por ti y compartirte el resultado para decidir si es seguro entrar.",
  "home.how2Title": "Inspección guiada",
  "home.how2Desc": "Responde el cuestionario y sube una foto de cada área.",
  "home.how3Title": "Análisis con IA",
  "home.how3Desc": "Recibe un nivel de riesgo y pasos recomendados.",
  "home.recentTitle": "Evaluaciones recientes",
  "home.recentEmpty": "Aún no has guardado evaluaciones en este dispositivo.",
  "home.viewResult": "Ver resultado",

  // Volunteer-engineer support thread (reused across surfaces).
  "engineers.sectionTitle": "Apoyo de ingenieros voluntarios",
  "engineers.tagline":
    "Después de tu evaluación, puedes pedir ayuda de un ingeniero voluntario verificado, sin costo.",
  "engineers.homeBody":
    "Primero haces tu autoevaluación. Si lo necesitas, te conectamos con un ingeniero voluntario verificado.",
  "engineers.recruit": "Reclutamos",
  "engineers.recruitDesc":
    "Convocamos a ingenieros voluntarios y organizaciones en todo el país.",
  "engineers.validate": "Validamos",
  "engineers.validateDesc":
    "Revisamos su experiencia antes de aprobarlos y marcarlos como verificados.",
  "engineers.connect": "Conectamos",
  "engineers.connectDesc":
    "Cuando una familia lo solicita tras su autoevaluación, la enlazamos con un ingeniero voluntario verificado que la orienta por videollamada y, si hace falta, en persona. Sin costo.",
  "engineers.learnMore": "Únete como ingeniero voluntario",
  "engineers.mapNote":
    "Tras una evaluación, los residentes pueden pedir apoyo de un ingeniero voluntario verificado.",
  "engineers.footerDesc": "Reclutamos, validamos y conectamos ingenieros.",
  "engineers.methodologyTitle": "Red de ingenieros voluntarios",
  "engineers.methodologyBody":
    "La autoevaluación es el primer paso. Además, reclutamos y validamos a ingenieros voluntarios y organizaciones, y conectamos a los residentes que lo solicitan con un profesional verificado para confirmar o ajustar el resultado.",

  "disclaimer.title": "Aviso importante",
  "disclaimer.body":
    "Esta herramienta ofrece una orientación preliminar y no sustituye la inspección de un ingeniero estructural autorizado ni de Protección Civil. Ante peligro inminente, evacúa y llama a emergencias.",

  // ----- Legal / responsabilidad (ES) -----
  "nav.legal": "Aviso legal",
  "legal.title": "Aviso legal y responsabilidad",
  "legal.subtitle": "Cómo usar EvalúaYa y los límites de responsabilidad.",
  "legal.updated": "Última actualización: junio de 2026",
  "legal.intro":
    "EvalúaYa es una iniciativa comunitaria sin fines de lucro. Antes de usar la herramienta o de conectarte con un ingeniero voluntario, lee cómo funciona y cuáles son sus límites.",
  "legal.s1.title": "No reemplaza una visita oficial",
  "legal.s1.body":
    "Ni esta herramienta ni el contacto con un ingeniero voluntario reemplazan la inspección formal de un ingeniero estructural colegiado, de FUNVISIS o de Protección Civil. El resultado es solo informativo y no constituye un certificado de habitabilidad ni un dictamen oficial.",
  "legal.s2.title": "Es una orientación técnica preliminar",
  "legal.s2.body":
    "Cualquier evaluación —automática o realizada por un ingeniero voluntario— es una orientación preliminar basada en lo que se reporta y observa a simple vista. No analiza elementos ocultos, fundaciones enterradas ni el interior de los muros, y no sustituye un estudio estructural detallado.",
  "legal.s3.title": "Ingenieros voluntarios",
  "legal.s3.body":
    "Los ingenieros y organizaciones que participan lo hacen de forma voluntaria y gratuita. EvalúaYa no les paga ni mantiene una relación laboral o comercial con ellos; actúan a título personal. Verificamos sus credenciales con la información que nos suministran, pero no garantizamos sus servicios ni el resultado de sus recomendaciones.",
  "legal.s4.title": "Limitación de responsabilidad",
  "legal.s4.body":
    "EvalúaYa, sus colaboradores y los ingenieros voluntarios no se hacen responsables por las recomendaciones dadas, las decisiones tomadas a partir de ellas, ni por daños o perjuicios derivados del uso de la aplicación. La decisión final y la responsabilidad sobre el inmueble corresponden a su propietario u ocupante y a las autoridades competentes.",
  "legal.s5.title": "Emergencias",
  "legal.s5.body":
    "Ante peligro inminente, no esperes una evaluación: evacúa de inmediato y llama a Protección Civil o a los servicios de emergencia.",
  "legal.contact.title": "Contacto",
  "legal.contact.body":
    "¿Dudas sobre este aviso? Escríbenos a contacto@evaluaya.app. Consulta también nuestra Política de privacidad.",
  "legal.short":
    "Orientación preliminar de voluntarios; no reemplaza una inspección oficial. Los ingenieros son voluntarios no remunerados y EvalúaYa no se responsabiliza por sus recomendaciones.",
  "legal.readMore": "Leer el aviso legal completo",
  "legal.ack":
    "Entiendo que esto es una orientación preliminar de voluntarios no remunerados y que no reemplaza una inspección oficial.",

  // ── Blocking legal + data-consent gate (Doc #1, lawyer) ──
  "gate.title": "Antes de continuar",
  "gate.subtitle":
    "EvalúaYa es una iniciativa privada, comunitaria y sin fines de lucro. Lee y acepta para usar la herramienta.",
  "gate.c1.title": "No es un organismo oficial",
  "gate.c1.body":
    "Iniciativa independiente y comunitaria, sin vinculación con FUNVISIS, Protección Civil, Bomberos ni ningún organismo gubernamental.",
  "gate.c2.title": "No emite dictámenes técnicos",
  "gate.c2.body":
    "La herramienta procesa solo hallazgos visuales preliminares y referenciales. No emite certificados de habitabilidad, dictámenes estructurales ni autorizaciones de ingreso.",
  "gate.c3.title": "Fuerza mayor y factores ambientales",
  "gate.c3.body":
    "No nos responsabilizamos por daños derivados de réplicas sísmicas, factores ambientales o eventos posteriores. El uso de la información es bajo riesgo del usuario.",
  "gate.accept":
    "He leído y acepto el aviso legal y la exención de responsabilidad.",
  "gate.consent":
    "Autorizo el tratamiento de mis datos personales exclusivamente para la gestión de reportes de esta plataforma.",
  "gate.cta": "Aceptar y continuar",
  "gate.readFull": "Leer el aviso legal completo",
  "gate.mustAccept": "Debes aceptar ambas casillas para continuar.",

  // ── Resident contact + parroquia (Doc #1, minimal contact data) ──
  "property.sectionContact": "Datos de contacto",
  "property.contactHint":
    "Solo para que un evaluador voluntario pueda comunicarse contigo sobre este reporte. No se publican.",
  "property.residentName": "Nombre y apellido",
  "property.residentNamePlaceholder": "Tu nombre",
  "property.phone": "Teléfono",
  "property.phoneHint": "Te contactaremos por WhatsApp en este número.",
  "property.countryCode": "Código de país",
  "property.residentContactPhonePlaceholder": "Ej. 414 123 4567",
  "property.parroquia": "Parroquia",
  "property.parroquiaPlaceholder": "Ej. El Recreo",
  "property.miss.residentName": "tu nombre",
  "property.miss.residentContact": "tu teléfono",
  "property.miss.address": "la dirección / sector",
  "property.miss.parroquia": "la parroquia",
  "property.miss.buildingName": "el nombre del edificio",



  "property.title": "Datos de la propiedad",
  "property.subtitle": "Esta información ayuda a interpretar los hallazgos.",
  "property.address": "Dirección / sector",
  "property.addressPlaceholder": "Ej.: Av. Bolívar, sector La Candelaria",
  "property.buildingName": "Nombre del edificio o torre",
  "property.buildingNamePlaceholder": "Ej.: Torre Mara, Res. Doral Plaza",
  "property.buildingNameHint":
    "Ayuda a agrupar reportes del mismo edificio en el mapa. No incluyas el número de apartamento.",
  "property.sectionLocation": "Ubicación",
  "property.sectionBuilding": "Sobre la edificación",
  "property.optionalDetails": "Agregar más detalles (opcional)",
  "property.optionalDetailsHide": "Ocultar detalles",
  "property.behalfHint":
    "¿No puedes entrar al edificio? Un familiar o vecino puede hacer esta inspección por ti y compartirte el resultado.",
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
  "property.floors": "Número de pisos (sobre el nivel del suelo)",
  "property.basements": "Número de sótanos",
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
  "checklist.photoPromptYes": "Marcaste un daño aquí. Una foto ayuda a que un ingeniero lo entienda mejor.",

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
  "factors.rule.tilt": "Inclinación / desplome",
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

  // --- 4+1 simplified flow (preguntas principales) ---
  "item.walls.area": "Paredes",
  "item.walls.q":
    "¿Aparecieron grietas nuevas en las paredes (en diagonal, en X, o más anchas que una moneda de canto)?",
  "item.walls.example.yes":
    "Grietas nuevas en diagonal o en forma de X, o tan anchas que cabe una moneda de canto o un lápiz.",
  "item.walls.example.no":
    "Solo líneas finas como un cabello, o ninguna grieta nueva.",
  "item.columns.area": "Columnas y vigas",
  "item.columns.q":
    "¿Hay columnas o vigas con concreto desprendido (descascarado), acero (cabilla) a la vista, o grietas marcadas?",
  "item.columns.example.yes":
    "El concreto de una columna o viga se descascaró y se ve la cabilla, o tiene grietas fuertes.",
  "item.columns.example.no":
    "Columnas y vigas lisas, sin concreto caído ni acero a la vista.",
  "item.openings.area": "Puertas y ventanas",
  "item.openings.q":
    "¿Hay puertas o ventanas que ya no abren o cierran porque el marco se deformó?",
  "item.openings.example.yes":
    "Una puerta o ventana que antes abría ahora se traba o no cierra porque el marco quedó torcido.",
  "item.openings.example.no":
    "Puertas y ventanas abren y cierran como siempre.",
  "item.tilt.area": "Inclinación / desplome",
  "item.tilt.q":
    "¿El edificio o algún piso se ve inclinado, desplomado o hundido respecto a antes?",
  "item.tilt.example.yes":
    "La edificación se ve recostada o inclinada, un piso quedó chueco, o una parte se hundió.",
  "item.tilt.example.no":
    "La edificación sigue recta y a nivel, igual que antes del sismo.",

  // Señales graves (multi-select Q5)
  "checklist.severeTitle": "Señales graves",
  "checklist.severeSubtitle":
    "Marca solo lo que viste con este sismo. Cualquiera de estas es una alerta de seguridad.",
  "checklist.severeNoneHint": "Si no viste ninguna, déjalas sin marcar y continúa.",


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

  // Visual examples + glossary (accessibility)
  "checklist.exampleAlt": "Ejemplo: cómo se ve el daño frente a una estructura sana",
  "checklist.illoDamage": "Señal de daño",
  "checklist.illoOk": "Se ve bien",
  "checklist.glossaryHint": "Toca una palabra para ver qué significa:",

  "glossary.cimientos.term": "Cimientos",
  "glossary.cimientos.def":
    "La base sobre la que se apoya toda la construcción, normalmente bajo el primer piso.",
  "glossary.licuefaccion.term": "Licuefacción",
  "glossary.licuefaccion.def":
    "Cuando el suelo lleno de agua pierde firmeza con el sismo y se comporta como lodo: puede brotar agua o arena y las estructuras se hunden o inclinan.",
  "glossary.grieta_diagonal.term": "Grieta diagonal",
  "glossary.grieta_diagonal.def":
    "Grieta inclinada, en forma de X o de escalera. Suele ser más seria que una grieta recta y fina porque indica esfuerzo en la estructura.",
  "glossary.golpeteo.term": "Golpeteo",
  "glossary.golpeteo.def":
    "Cuando dos edificios vecinos chocan entre sí durante el sismo por estar muy juntos.",
  "glossary.columna.term": "Columna",
  "glossary.columna.def":
    "Elemento vertical (normalmente de concreto) que sostiene el peso del edificio.",
  "glossary.viga.term": "Viga",
  "glossary.viga.def":
    "Elemento horizontal que conecta las columnas y sostiene los pisos y el techo.",
  "glossary.cabilla.term": "Cabilla",
  "glossary.cabilla.def":
    "Las barras de acero que van dentro del concreto para reforzarlo. Si quedan a la vista, el daño es serio.",
  "glossary.pandeo.term": "Pandeo",
  "glossary.pandeo.def":
    "Cuando una superficie que debería estar recta se ve hundida, curvada o abombada.",
  "glossary.rodapie.term": "Rodapié",
  "glossary.rodapie.def":
    "La moldura que une la pared con el piso. Un espacio nuevo ahí puede indicar movimiento.",
  "glossary.breaker.term": "Breaker",
  "glossary.breaker.def":
    "El interruptor del tablero eléctrico que corta la corriente cuando hay una falla.",
  "glossary.tomacorriente.term": "Tomacorriente",
  "glossary.tomacorriente.def":
    "El enchufe de la pared donde conectas los aparatos.",

  // Property helper text (accessibility)
  "property.buildingType.help": "¿Qué tipo de lugar estás evaluando?",
  "property.floors.help": "Cuenta los pisos por encima del nivel del suelo.",
  "property.basements.help": "Niveles por debajo del nivel del suelo (estacionamientos, depósitos). Si no tiene, deja 0.",
  "property.age.help": "Si no sabes el año exacto, elige lo más cercano.",
  "property.age.pre1970.desc":
    "Construcción antigua, anterior a las normas sísmicas modernas.",
  "property.age.1970to2000.desc": "Construcción de finales del siglo pasado.",
  "property.age.post2000.desc": "Construcción más reciente.",



  "rule.urm.finding":
    "Edificación de mampostería sin refuerzo: muy vulnerable tras un sismo fuerte.",
  "rule.urm.step":
    "Sugerencia: por precaución, evita permanecer dentro hasta que un ingeniero colegiado o Protección Civil evalúen la edificación.",
  "rule.tilt.finding":
    "La edificación se ve inclinada, desplomada o hundida: posible riesgo de colapso.",
  "rule.tilt.step":
    "Sugerencia: no permanezcas dentro; sal y reporta a Protección Civil o a un ingeniero colegiado de inmediato.",
  "rule.liquefaction.finding":
    "Señales de licuefacción del suelo: el terreno perdió capacidad de soporte.",
  "rule.liquefaction.step":
    "Sugerencia: la estructura podría asentarse o inclinarse; considera salir y reportar a las autoridades para que la revisen.",
  "rule.pounding.finding":
    "Golpeteo con un edificio vecino: posible daño estructural severo.",
  "rule.pounding.step": "Sugerencia: por precaución, evita la zona de contacto entre los edificios.",
  "rule.plumbing.finding":
    "Daño severo de plomería o posible fuga de gas: riesgo inmediato.",
  "rule.plumbing.step":
    "Sugerencia: si sospechas una fuga, cierra la llave principal de gas y agua, evita encender luces o llamas y considera salir.",
  "rule.intensity.finding":
    "Sacudida sísmica moderada (intensidad VI o aceleración ≥0.25g) en esta ubicación.",
  "rule.intensity.step":
    "Sugerencia: aumenta la precaución, revisa con más cuidado y prioriza una evaluación profesional.",
  "rule.intensity_severe.finding":
    "Sacudida sísmica muy fuerte (intensidad VIII+ o aceleración ≥0.50g) en esta ubicación.",
  "rule.intensity_severe.step":
    "Sugerencia: esta zona recibió una de las sacudidas más fuertes del sismo; trata cualquier daño con máxima cautela.",
  "rule.spectral.finding":
    "La demanda sísmica para edificaciones de esta altura fue alta (aceleración espectral ≥0.40g).",
  "rule.spectral.step":
    "Sugerencia: edificios de esta altura sintieron la sacudida con especial fuerza; prioriza una revisión profesional.",
  "rule.softsoil.finding":
    "Suelo blando: amplifica la sacudida y aumenta el riesgo de licuefacción.",
  "rule.softsoil.step":
    "Sugerencia: vigila asentamientos o inclinaciones del terreno y de la edificación.",
  "rule.softsoil_severe.finding":
    "Suelo muy blando: fuerte amplificación de la sacudida y alto riesgo de licuefacción.",
  "rule.softsoil_severe.step":
    "Sugerencia: observa con cuidado el terreno y los cimientos y prioriza una evaluación profesional.",
  "rule.combo_shaking.finding":
    "Sacudida muy fuerte combinada con daño estructural reportado: riesgo crítico para la vida.",
  "rule.combo_shaking.step":
    "Sugerencia: por precaución, evita permanecer dentro hasta que un ingeniero colegiado o Protección Civil lo confirmen.",
  "rule.floors.finding":
    "Edificación de más de 7 pisos: requiere precaución adicional.",
  "rule.floors.step":
    "Sugerencia: limita el uso hasta que un ingeniero confirme la seguridad de los pisos superiores.",
  "rule.structure.finding":
    "El sistema estructural de esta edificación requiere precaución adicional.",
  "rule.structure.step":
    "Sugerencia: limita el uso y prioriza una evaluación profesional.",

  "soil.rock": "Suelo firme / roca",
  "soil.stiff": "Suelo rígido",
  "soil.soft": "Suelo blando",
  "soil.very_soft": "Suelo muy blando",





  "analyze.title": "Analizando",
  "analyze.uploading": "Procesando fotos…",
  "analyze.thinking": "Evaluando el riesgo estructural…",
  "analyze.imagesAnalyzed": "{n} imágenes analizadas en la comunidad",
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

  "result.title": "Hallazgos visuales de tu revisión",
  "result.green.tag": "Hallazgos leves",
  "result.green.action": "Sugerencia: mantén observación ante réplicas",
  "result.yellow.tag": "Hallazgos moderados",
  "result.yellow.action": "Sugerencia: solicita una inspección técnica presencial",
  "result.orange.tag": "Hallazgos serios",
  "result.orange.action": "Sugerencia: solicita pronto una inspección técnica presencial",
  "result.red.tag": "Hallazgos severos · alerta",
  "result.red.action": "Sugerencia: evita ingresar y reporta a cuerpos oficiales",
  "result.summary": "Lo que reportaste",
  "result.findings": "Lo que observaste",
  "result.nextSteps": "Sugerencias (no son órdenes)",
  "result.findingsDisclaimer":
    "Esto NO es un dictamen ni una certificación. Son hallazgos visuales preliminares y referenciales basados en lo que reportaste. Solo un ingeniero estructural autorizado o un organismo oficial puede determinar si la edificación es segura o habitable.",

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
  "provisional.step.evacuate": "Sugerencia: ante peligro evidente, evita usar el inmueble y solicita una inspección técnica presencial.",
  "provisional.step.limit": "Sugerencia: limita el uso de las áreas con hallazgos hasta una inspección técnica.",
  "provisional.step.engineer":
    "Sugerencia: hay hallazgos en elementos estructurales; solicita pronto una inspección técnica presencial.",
  "provisional.step.stay": "Sugerencia: mantén observación ante nuevos daños o réplicas.",
  "result.photos": "Fotos enviadas",
  "result.photosHint": "Toca una foto para verla a pantalla completa y ampliarla.",
  "lightbox.title": "Foto",
  "lightbox.close": "Cerrar",
  "lightbox.next": "Siguiente foto",
  "lightbox.prev": "Foto anterior",
  "lightbox.zoomHint": "Pellizca o doble toque para ampliar",
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
    "Hallazgos visuales preliminares, no un dictamen. La determinación de seguridad o habitabilidad corresponde a un ingeniero estructural autorizado o a un organismo oficial.",
  "result.notFound": "No se encontró esta evaluación.",
  "result.genericError": "Algo salió mal. Inténtalo de nuevo.",
  "result.goHome": "Ir al inicio",
  "result.assessedOn": "Evaluado el",

  "pdf.title": "Resumen de hallazgos visuales",
  "pdf.property": "Propiedad",
  "pdf.riskLevel": "Nivel de hallazgos",
  "pdf.findingsBannerNote": "Hallazgos visuales — no es un dictamen ni un certificado de habitabilidad.",
  "pdf.summary": "Resumen",
  "pdf.findings": "Hallazgos clave",
  "pdf.nextSteps": "Sugerencias",
  "pdf.inspection": "Respuestas de inspección",
  "pdf.photos": "Fotos",
  "pdf.generated": "Generado por EvalúaYa",

  "common.loading": "Cargando…",
  "nav.map": "Mapa",
  "nav.home": "Inicio",
  "nav.reports": "Mis reportes",
  "nav.evaluate": "Evaluar",
  "nav.more": "Más",
  "nav.language": "Idioma",
  "nav.help": "Ayuda",
  "nav.feedback": "Enviar comentarios",
  "nav.data": "Datos",
  "nav.dataDesc": "Mapa y datos abiertos para autoridades y medios",
  "nav.today": "¿Tembló hoy?",
  "nav.todayDesc": "Sismos recientes cerca de Venezuela",
  "home.todayTitle": "¿Acaba de temblar?",
  "home.todayDesc": "Mira los sismos recientes cerca de Venezuela.",

  "footer.tagline":
    "Autoevaluación de daños estructurales tras un sismo. Gratis y sin registro.",
  "footer.explore": "Explorar",
  "footer.participate": "Participar",
  "footer.resources": "Recursos",
  "footer.note":
    "Datos anónimos y abiertos · Proyecto comunitario de código abierto · Hecho con ❤️ para Venezuela 🇻🇪",
  "footer.evaluate": "Evaluar",
  "footer.contact": "Contacto",
  "contact.email": "contacto@evaluaya.app",
  "contact.subject": "Consulta — EvalúaYa",


  "data.title": "Sala de datos",
  "data.subtitle":
    "Explora los daños estructurales reportados en Venezuela. Datos anónimos y abiertos, ideales para autoridades, medios y equipos de respuesta.",
  "data.mobileNote":
    "Estás viendo un resumen. Abre la sala de datos en una computadora para filtros, mapa ampliado y análisis completo.",
  "data.openMap": "Ver mapa completo",
  "data.filters": "Filtros",
  "picker.mostAffected": "Zonas más afectadas",
  "picker.allAreas": "Todas las zonas",
  "data.filterState": "Estado",
  "data.filterMunicipality": "Municipio",
  "data.filterAll": "Todos",
  "data.filterRange": "Período",
  "data.range7": "7 días",
  "data.range30": "30 días",
  "data.range90": "90 días",
  "data.rangeAll": "Todo",
  "data.clearFilters": "Limpiar filtros",
  "data.activeScope": "Mostrando",
  "data.scopeNational": "todo el país",
  "data.chartsTitle": "Indicadores",
  "data.mapTitle": "Mapa interactivo",
  "data.noResults": "No hay datos para estos filtros.",
  "data.export": "Exportar y compartir",
  "dataroom.tab.summary": "Resumen",
  "dataroom.tab.map": "Mapa",
  "dataroom.tab.areas": "Zonas",
  "dataroom.tab.evidence": "Evidencia",
  "dataroom.tab.open": "Datos abiertos",
  "dataroom.eyebrow.briefing": "Resumen ejecutivo",
  "dataroom.eyebrow.severity": "Severidad",
  "dataroom.eyebrow.distribution": "Distribución",
  "dataroom.eyebrow.trend": "Tendencia",
  "dataroom.eyebrow.map": "Mapa",
  "dataroom.eyebrow.areas": "Zonas",
  "dataroom.eyebrow.why": "Por qué",
  "dataroom.eyebrow.photos": "Documentación",
  "dataroom.eyebrow.glossary": "Glosario",
  "dataroom.eyebrow.export": "Exportar",
  "dataroom.eyebrow.api": "API",
  "dataroom.updated": "Actualizado",
  "dataroom.updatedJustNow": "hace instantes",
  "dataroom.updatedMinutes": "hace {n} min",
  "dataroom.updatedHours": "hace {n} h",
  "dataroom.updatedDays": "hace {n} d",
  "dataroom.narrative": "De {total} evaluaciones, el {pct}% reporta daños que requieren atención de un ingeniero.",
  "dataroom.narrativeArea": "De {total} evaluaciones, el {pct}% reporta daños que requieren atención de un ingeniero. {area} es la zona más afectada.",
  "dataroom.narrativeLow": "De {total} evaluaciones, la mayoría no reporta daños graves.",
  "data.dict.title": "¿Cómo leer estos datos?",
  "data.dict.intro":
    "Definiciones de los términos usados en esta página, para que todos interpreten los números de la misma forma.",
  "data.dict.evaluacion.term": "Evaluación",
  "data.dict.evaluacion.def":
    "Una autoevaluación enviada desde la app. No equivale a un edificio único: un mismo edificio puede tener varias evaluaciones (p. ej. distintos apartamentos).",
  "data.dict.zonas.term": "Zonas",
  "data.dict.zonas.def":
    "Cantidad de municipios o estados distintos con al menos una evaluación.",
  "data.dict.low.def": "Hallazgos leves: sin daños evidentes en elementos de carga.",
  "data.dict.moderate.def": "Hallazgos moderados: grietas o desprendimientos menores reportados.",
  "data.dict.serious.def":
    "Hallazgos serios: posibles daños en elementos estructurales; conviene inspección técnica pronto.",
  "data.dict.high.def": "Hallazgos severos: fallas reportadas en columnas, vigas, muros o inclinación.",
  "data.dict.seriousOrHigh.term": "Hallazgos serios o severos",
  "data.dict.seriousOrHigh.def":
    "Suma de las evaluaciones con hallazgos en nivel naranja (serios) y rojo (severos): los casos que conviene priorizar para inspección técnica. No es lo mismo que «Hallazgos severos», que cuenta solo el nivel rojo.",
  "data.dict.verified.term": "Revisado por evaluador",
  "data.dict.verified.def":
    "Evaluaciones revisadas por un evaluador voluntario de la comunidad, no solo por el residente.",
  "data.dict.more": "Ver metodología completa",
  "mapa.seeFullData": "Ver datos completos",
  "mapa.seeFullDataDesc":
    "Filtros, tendencias y análisis por zona en la sala de datos.",


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
    "Recibes hallazgos visuales organizados (Leves / Moderados / Serios / Severos) con una explicación clara y sugerencias. No es un dictamen.",
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
  "help.faq.behalfQ": "¿Puedo evaluar por otra persona?",
  "help.faq.behalfA":
    "Sí. Puedes completar una evaluación en nombre de un vecino o familiar (por ejemplo, alguien que está en un refugio) con lo que puedas observar o con fotos que te envíen.",
  "help.faq.offlineQ": "¿Funciona sin internet o con poca señal?",
  "help.faq.offlineA":
    "Sí. Puedes responder el cuestionario con poca señal; tu avance se guarda en el dispositivo y el análisis se envía cuando recuperes conexión.",
  "help.faq.resultsQ": "¿Qué significan los colores del resultado?",
  "help.faq.resultsA":
    "Describen hallazgos visuales, no un veredicto de seguridad. Verde: hallazgos leves. Amarillo: hallazgos moderados. Naranja: hallazgos serios. Rojo: hallazgos severos. En todos los casos, la determinación de seguridad o habitabilidad corresponde a un ingeniero estructural autorizado o a un organismo oficial.",
  "help.faq.engineerQ": "¿Puedo pedir que un evaluador revise mi caso?",
  "help.faq.engineerA":
    "Sí. Al terminar tu evaluación puedes enviar una solicitud gratuita. Un evaluador voluntario de la comunidad recibe el aviso y puede contactarte por WhatsApp para orientarte, sin costo. No emite dictámenes periciales.",
  "help.faq.privacyQ": "¿Mis datos son privados?",
  "help.faq.privacyA":
    "Sí. La evaluación es anónima. No pedimos tu nombre ni datos personales para usar la app.",
  "help.faq.saveQ": "¿Cómo guardo y vuelvo a ver mis reportes?",
  "help.faq.saveA":
    "En la pantalla de resultados puedes crear una cuenta con tu correo (enlace mágico, sin contraseña) para acceder a tus reportes desde “Mis reportes” cuando quieras.",
  "help.faq.photosQ": "¿Las fotos son obligatorias?",
  "help.faq.photosA":
    "No. Las fotos son opcionales, pero ayudan a que el análisis sea más preciso.",
  "help.faq.newDamageQ": "¿Qué daños debo reportar?",
  "help.faq.newDamageA":
    "Reporta solo el daño nuevo causado por el sismo reciente, no las grietas o fallas que ya existían antes. Así el resultado refleja mejor el riesgo actual.",
  "help.faq.officialQ": "¿Esto reemplaza una inspección oficial?",
  "help.faq.officialA":
    "No. EvalúaYa ofrece una orientación preliminar y no sustituye la inspección de un ingeniero estructural autorizado ni de Protección Civil.",
  "help.moreTitle": "¿Necesitas más ayuda?",
  "help.moreBody":
    "Escríbenos si tienes una duda que no aparece aquí, o conoce cómo calculamos los resultados.",
  "help.contactCta": "Enviar un comentario",
  "help.emailUs": "Escríbenos por correo",


  "home.timePromise": "Gratis · 2 minutos · sin registro",
  "home.trustFree": "Gratis",
  "home.trustNoSignup": "Sin registro",
  "home.trustOffline": "Funciona sin conexión",
  "home.trustAnon": "Anónimo",
  "home.seoTagline":
    "Sabe en 2 minutos si tu vivienda es segura para entrar tras el sismo.",
  "home.statBuildings": "evaluaciones realizadas",
  
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
  "zona.municipiosWithReports": "Municipios con reportes",
  "zona.municipiosWithReportsHint":
    "Toca un municipio para ver sus reportes en detalle.",

  "municipio.eyebrow": "Reporte por municipio",
  "municipio.h1Prefix": "Daños estructurales en",
  "municipio.intro":
    "Reportes anónimos de la comunidad en {municipio}, {estado}. Evalúa tu vivienda gratis, sin registro y en pocos minutos.",
  "municipio.ctaPrefix": "Evaluar mi vivienda en",
  "municipio.totalReports": "Reportes en el municipio",
  "municipio.lastReport": "Último reporte",
  "municipio.notEnough":
    "Aún no hay suficientes reportes en {municipio} para mostrar un resumen. Sé parte de los primeros en evaluar tu vivienda y ayudar a tu comunidad.",
  "municipio.backToState": "Ver el análisis completo de {estado}",
  "municipio.notFound": "No encontramos ese municipio.",

  "property.state": "Estado",
  "property.statePlaceholder": "Selecciona",
  "property.municipality": "Municipio",
  "property.municipalityPlaceholder": "Selecciona el municipio",
  "property.municipalitySelectState": "Primero selecciona el estado",
  "property.municipalityUnsure": "No estoy seguro",
  "property.locationHint":
    "Solo usamos la zona (estado/municipio) para el mapa comunitario. Nunca mostramos tu dirección exacta.",
  "property.detecting": "Detectando tu ubicación…",
  "property.detected": "Ubicación detectada. Puedes cambiarla si no es correcta.",
  "property.detectFailed": "No pudimos detectar tu ubicación. Selecciona tu estado.",
  "property.stateRequired": "Selecciona tu estado para continuar.",
  "property.effortHint": "Solo toma unos minutos. Las fotos son opcionales.",
  "property.missingPrefix": "Para continuar, falta:",
  "property.miss.state": "estado",
  "property.miss.municipality": "municipio",
  "property.miss.type": "tipo de edificio",
  "property.miss.age": "antigüedad",

  "map.title": "Mapa de daños",
  "map.subtitle":
    "Reportes anónimos y agregados por zona. Nunca se muestran direcciones ni fotos.",
  "map.totalAssessments": "Evaluaciones",
  "map.areasLabel": "Municipios",
  "map.high": "Hallazgos severos",
  "map.urgent": "Hallazgos serios",
  "map.moderate": "Hallazgos moderados",
  "map.low": "Hallazgos leves",
  "map.seriousOrHigh": "Hallazgos serios o severos",
  "map.distribution": "Distribución de hallazgos",
  "map.geoTitle": "Vista geográfica",
  "map.geoHint": "El tamaño indica cantidad de reportes; el color, el nivel de hallazgos predominante.",
  "map.legendSize": "Tamaño = cantidad de reportes",
  "map.legendRisk": "Color = hallazgos predominantes",
  "map.legendTitle": "¿Qué significa cada color?",
  "map.legendGreen": "Verde: hallazgos leves, sin daños evidentes en elementos de carga.",
  "map.legendYellow": "Amarillo: hallazgos moderados, grietas o desprendimientos menores.",
  "map.legendOrange": "Naranja: hallazgos serios; conviene inspección técnica pronto.",
  "map.legendRed": "Rojo: hallazgos severos en columnas, vigas, muros o inclinación.",
  "map.legendVerified": "Borde sólido = revisado por un evaluador voluntario",
  "map.legendSelf": "Borde punteado = autoevaluación de un residente",
  "map.verified": "Revisado por evaluador",
  "map.selfReported": "Autoevaluación de residente",
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
  "map.storyIntro":
    "Desplázate para ver la historia detrás de los datos: qué tan serios son los daños, cómo evolucionan y por qué.",
  "map.severityTitle": "Qué tan serio es",
  "map.severityNeedAttention": "necesitan atención urgente",
  "map.severityCaption":
    "Proporción de evaluaciones en nivel naranja o rojo: daños moderados a graves que requieren un ingeniero.",
  "map.severityTopArea": "Zona más afectada",
  "map.severityNone":
    "Por ahora, la mayoría de las evaluaciones no muestran daños serios.",
  "map.trendTitle": "Reportes en el tiempo",
  "map.trendSubtitle":
    "Evaluaciones por día (últimos 90 días), divididas por nivel de riesgo.",
  "map.trendEmpty": "Aún no hay suficientes datos para mostrar la tendencia.",
  "map.trendTotalReports": "reportes en el período",

  // Open data API usage
  "apiUsage.title": "API de datos abiertos",
  "apiUsage.subtitle":
    "Uso de la API pública de datos. Solicitudes que llegan al servidor — los datos servidos desde caché no se cuentan, así que es un mínimo.",
  "apiUsage.live": "Operativa",
  "apiUsage.down": "Sin respuesta",
  "apiUsage.total7d": "Llamadas (7 días)",
  "apiUsage.today": "Hoy",
  "apiUsage.endpoints": "Endpoints usados",
  "apiUsage.lastCall": "Última llamada",
  "apiUsage.never": "Aún sin uso",
  "apiUsage.byEndpoint": "Por endpoint",
  "apiUsage.byReferer": "Orígenes principales",
  "apiUsage.byState": "Estados más consultados",
  "apiUsage.empty": "Aún no se ha consultado la API.",
  "apiUsage.emptyHint":
    "Cuando alguien use la API de datos abiertos, el uso aparecerá aquí.",
  "apiUsage.calls": "llamadas",
  "apiUsage.docsCta": "Ver la API",

  // Photo documentation
  "photos.title": "Documentación fotográfica",
  "photos.subtitle":
    "Cuántas fotos respaldan los reportes. Solo conteos — nunca se muestran las fotos.",
  "photos.total": "Fotos recibidas",
  "photos.withPhoto": "Reportes con foto",
  "photos.avgPerReport": "Fotos por reporte",
  "photos.coverageTitle": "Cobertura por elemento",
  "photos.coverageSubtitle":
    "Qué elementos estructurales están mejor documentados con fotos.",
  "photos.byAreaTitle": "Fotos por zona",
  "photos.overTimeTitle": "Fotos por día",
  "photos.reportsWord": "reportes",
  "photos.photosWord": "fotos",
  "photos.empty": "Aún no hay fotos en este alcance.",
  "photos.coverageOf": "de",

  "map.whyTitle": "Por qué se ven así los datos",
  "map.whySubtitle":
    "Los factores que más se repiten en las evaluaciones a nivel nacional: daños marcados, antigüedad y tipo de construcción, intensidad sísmica y reglas de seguridad activadas.",
  "map.exportTitle": "Exporta y comparte",
  "map.exportSubtitle":
    "Lleva estos datos a un ingeniero, autoridad o medio de comunicación.",


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
  "result.proBadge": "Revisado por evaluador voluntario",
  "result.proBadgeDesc":
    "Este reporte fue revisado por un evaluador voluntario de la comunidad; no es un dictamen pericial ni una certificación.",
  "result.residentBadge": "Autoevaluación de residente",
  "result.shareOwnerTitle": "¿Es para otra persona?",
  "result.shareOwnerBody":
    "Comparte estos hallazgos con el dueño o residente para que busque una inspección técnica.",

  "share.title": "Ayuda a difundir EvalúaYa",
  "share.body":
    "Compártelo con tu familia y vecinos. Mientras más personas evalúan sus viviendas, mejor entendemos los daños de cada zona. ❤️",
  "share.whatsapp": "Compartir por WhatsApp",
  "share.copy": "Copiar enlace",
  "share.copied": "¡Enlace copiado!",
  "share.message":
    "Evalúa los daños de tu vivienda tras el sismo con EvalúaYa — gratis, sin registro y funciona con poca señal: 🇻🇪",
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
  "help.tremorGuideLink": "Qué hacer después de un temblor",
  "help.cracksGuideLink": "Grietas peligrosas: cómo identificarlas",
  "help.boconoGuideLink": "Falla de Boconó: la principal falla de Venezuela",

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
  "nav.volunteersShort": "Voluntarios",

  // Result page connect section
  "connect.title": "Pide ayuda de un evaluador voluntario",
  "connect.subtitleRed":
    "Tus hallazgos son severos. Envía tu caso y un evaluador voluntario de la comunidad lo revisará y te contactará para orientarte. Es gratuito y sin compromiso.",
  "connect.subtitleYellow":
    "Envía tu caso y un evaluador voluntario de la comunidad puede ayudarte a interpretar estos hallazgos. Es gratuito y sin compromiso.",
  "connect.reassure": "Evaluadores voluntarios de la comunidad — sin costo.",
  "connect.requestTitle": "Solicitar a un evaluador voluntario",
  "connect.requestBody":
    "Deja tu WhatsApp y compartiremos tu reporte con evaluadores voluntarios de la comunidad registrados. Uno de ellos tomará tu caso y te contactará.",
  "connect.requestCta": "Enviar solicitud",
  "connect.requestSending": "Enviando…",
  "connect.requestDone": "¡Listo! Un evaluador te contactará pronto.",
  "connect.requestError": "No se pudo enviar. Intenta de nuevo.",
  "connect.yourWhatsapp": "Tu número de WhatsApp",
  "connect.whatsappPlaceholder": "Ej.: 0414 123 4567",
  "connect.whatsappHint":
    "Incluye el código de área. Si estás en Venezuela puedes usar tu número local (ej.: 0414…); le agregamos el código de país (+58) automáticamente.",
  "connect.noteOptional": "Mensaje (puedes editarlo)",
  "connect.notePlaceholder": "Ej.: Hay grietas grandes en la sala.",
  "connect.notePrefill": "Mi evaluación reportó hallazgos de nivel {risk}. Hallazgos: {findings}.",
  "connect.privacy":
    "Tu número solo se comparte con evaluadores voluntarios de la comunidad registrados. No se publica.",
  "connect.areEngineer": "¿Eres ingeniero? Súmate como voluntario",


  // Volunteer landing + signup
  "vol.title": "Ingenieros voluntarios",
  "vol.subtitle":
    "Iniciativa comunitaria. Cuando una familia lo solicita tras su autoevaluación, la orientas — primero por videollamada y, si hace falta, con una visita presencial.",
  "vol.how1": "Te registras con tu WhatsApp y los estados que puedes cubrir.",
  "vol.how2": "Revisamos tu solicitud y te enviamos un enlace privado.",
  "vol.how3":
    "Recibes solicitudes de familias que pidieron ayuda tras su autoevaluación. Las orientas por videollamada o WhatsApp y, si es posible, con una visita presencial.",
  "vol.formTitle": "Quiero ser voluntario",
  "vol.name": "Nombre completo",
  "vol.namePlaceholder": "Ej.: Ing. María Pérez",
  "vol.org": "Empresa u organización (opcional)",
  "vol.orgPlaceholder": "Ej.: Colegio de Ingenieros",
  "vol.whatsapp": "WhatsApp",
  "vol.email": "Correo electrónico",
  "vol.emailHint":
    "Lo necesitamos para enviarte tu enlace de acceso cuando te validemos.",
  "vol.verifyTitle": "Verificación profesional",
  "vol.verifyHint":
    "Para proteger a las familias, validamos a cada voluntario(a). Agrega tu número de colegiatura (CIV) y un documento que respalde tu profesión. Acelera tu aprobación.",
  "vol.license": "Número de colegiatura / CIV (opcional)",
  "vol.licensePlaceholder": "Ej.: CIV 123456",
  "vol.credential": "Documento de respaldo (opcional)",
  "vol.credentialCta": "Subir credencial o título",
  "vol.credentialHint":
    "PDF o imagen (carnet del CIV, título, constancia laboral). Máx. 6 MB. Solo lo ve nuestro equipo de validación.",
  "vol.credentialUploading": "Subiendo…",
  "vol.credentialUploaded": "Documento cargado",
  "vol.credentialCta2": "Cambiar documento",
  "vol.credentialError": "No se pudo subir el documento. Intenta de nuevo.",
  "vol.credentialTooLarge": "El archivo supera los 6 MB.",
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

  // Volunteer evaluators showcase
  "vol.verifiedTitle": "Evaluadores voluntarios de la comunidad",
  "vol.verifiedCountOne": "{n} evaluador u organización registrada",
  "vol.verifiedCountMany": "{n} evaluadores y organizaciones registradas",
  "vol.verifiedSubtitle":
    "Profesionales y organizaciones que ya revisamos y se sumaron a la red comunitaria.",
  "vol.verifiedEmptyTitle": "Sé el primero",
  "vol.verifiedEmptyBody":
    "Aún no hay evaluadores registrados. Súmate hoy y aparece aquí cuando validemos tu solicitud.",
  "vol.individualLabel": "Evaluador",
  "vol.organizationLabel": "Organización",
  "vol.coversStates": "Cubre",
  "vol.residentNoteTitle": "¿Necesitas un evaluador?",
  "vol.residentNoteBody":
    "Completa tu evaluación y, al final, podrás solicitar una conexión con un evaluador voluntario de la comunidad.",
  "vol.residentNoteCta": "Iniciar evaluación",


  // Engineer panel
  "panel.title": "Panel del evaluador voluntario",
  "panel.welcome": "Hola",
  "panel.coverage": "Cobertura",
  "panel.proTitle": "Evaluación de apoyo",
  "panel.proBody":
    "Acompaña al residente con una evaluación de apoyo. Responderás las mismas preguntas y el reporte quedará marcado como revisado por un evaluador voluntario en el mapa. No es un dictamen ni un certificado de habitabilidad.",
  "panel.startPro": "Iniciar evaluación de apoyo",
  "panel.invalid": "Enlace no válido o no aprobado",
  "panel.invalidBody":
    "Este enlace no corresponde a un evaluador voluntario aprobado. Si crees que es un error, contáctanos.",
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
    "Hola, soy evaluador voluntario de la comunidad en EvalúaYa. Vi tu solicitud de orientación tras tu evaluación. ¿En qué puedo ayudarte?",

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

  // Admin — help request lifecycle tracking
  "admin.matchingProgress": "Progreso del matching",
  "admin.stageClaimed": "Reclamadas",
  "admin.stageContacted": "Contactó",
  "admin.stageVisited": "Visitó",
  "admin.stageResolved": "Resueltas",
  "admin.stalled": "Estancadas",
  "admin.stalledHint": "Reclamada hace +24 h sin avance",
  "admin.filterAll": "Todas",
  "admin.filterOpen": "Abiertas",
  "admin.filterClaimed": "Reclamadas",
  "admin.filterStalled": "Estancadas",
  "admin.filterResolved": "Resueltas",
  "admin.reqClaimedBy": "Atiende",
  "admin.reqUnclaimed": "Sin asignar",
  "admin.reqClaimedAt": "Reclamada",
  "admin.reqUpdatedAt": "Último avance",
  "admin.reqEngineerNote": "Nota del ingeniero(a)",
  "admin.reqResidentNote": "Nota del residente",
  "admin.reqVerdictAgree": "Revisado por evaluador voluntario",
  "admin.reqVerdictAdjust": "Observaciones registradas",
  "admin.reqVerified": "Reporte verificado",
  "admin.statusOpen": "Abierta",
  "admin.statusClaimed": "Reclamada",
  "admin.statusClosed": "Cerrada",

  // Panel — matching enhancements
  "panel.specialization": "Especialidad",
  "panel.ageNew": "Nueva",
  "panel.ageWaiting": "Esperando",
  "panel.ageDays": "d",

  // Panel — progress tracking
  "panel.progressTitle": "Progreso",
  "panel.stage.claimed": "Asignada",
  "panel.stage.contacted": "Contacté al residente",
  "panel.stage.visited": "Visité / inspeccioné",
  "panel.stage.resolved": "Resuelta",
  "panel.markContacted": "Marcar: contacté",
  "panel.markVisited": "Marcar: visité",
  "panel.markResolved": "Marcar: resuelta",
  "panel.progressNote": "Nota de progreso (opcional)",
  "panel.progressNotePlaceholder": "Ej.: Acordé visita para el sábado.",
  "panel.progressSaved": "Progreso actualizado.",
  "panel.lastUpdate": "Última actualización",
  "panel.currentStage": "Etapa actual",

  // Panel — record professional observations
  "panel.reviewTitle": "Registrar tus observaciones",
  "panel.reviewBody":
    "Deja tus observaciones profesionales tras orientar al residente. Esto marca el reporte como revisado por un evaluador voluntario; no es un dictamen ni un certificado de habitabilidad.",
  "panel.reviewCta": "Registrar observaciones",
  "panel.reviewNotePlaceholder": "Ej.: Orienté al residente; recomendé inspección formal de un ingeniero colegiado.",
  "panel.reviewDescargo":
    "Declaro que mis observaciones son orientativas y voluntarias, que no constituyen un dictamen oficial ni un certificado de habitabilidad, y que la decisión sobre la seguridad corresponde a una inspección formal de un ingeniero estructural colegiado, FUNVISIS o Protección Civil.",
  "panel.reviewSubmit": "Guardar observaciones",
  "panel.reviewSaved": "Observaciones registradas. Gracias por tu apoyo.",
  "panel.reviewedByYou": "Revisado por ti",
  "panel.cancel": "Cancelar",
  "panel.noReportToValidate": "Esta solicitud no tiene una evaluación vinculada.",


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
  "dash.funnel.title": "Embudo de evaluación",
  "dash.funnel.window": "Últimas 48 h",
  "dash.funnel.completion": "completan la evaluación",
  "dash.funnel.empty": "Aún no hay datos del embudo en esta ventana.",
  "dash.funnel.biggestDrop": "Mayor caída en:",
  "dash.funnel.step.home_cta": "Inicio: comenzar",
  "dash.funnel.step.property_started": "Datos del inmueble",
  "dash.funnel.step.property_completed": "Inmueble completado",
  "dash.funnel.step.checklist_started": "Lista de revisión",
  "dash.funnel.step.analyze_started": "Análisis con IA",
  "dash.funnel.step.result_reached": "Resultado",
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
  "dash.matchingProgressHint":
    "Lo que el ingeniero(a) reporta tras reclamar una solicitud.",
  "dash.requests": "Solicitudes",
  "dash.open": "Abiertas",
  "dash.openShort": "abiertas",
  "dash.claimRate": "Tasa de respuesta",
  "dash.avgClaim": "Tiempo prom. de respuesta",
  "dash.gaps": "Brechas de cobertura",
  "dash.gapsHint": "Estados con solicitudes abiertas y sin ingenieros aprobados.",
  "dash.noGaps": "Sin brechas de cobertura.",

  // Calidad de evaluaciones y verificación (admin)
  "dash.quality": "Calidad de evaluaciones",
  "dash.qualityHint":
    "Completitud de datos y reportes que necesitan atención.",
  "dash.qComplete": "Datos completos",
  "dash.qWithPhotos": "Con fotos",
  "dash.qLowQuality": "Baja calidad",
  "dash.qVerified": "Verificados",
  "dash.qUnverifiedHigh": "Alto riesgo sin verificar",
  "dash.qMissingLocation": "Sin ubicación",
  "dash.qMissingBuilding": "Sin edificio",
  "dash.qMissingIntensity": "Sin intensidad",
  "dash.qProfessional": "Profesionales",
  "dash.worklist": "Reportes que necesitan atención",
  "dash.worklistHint":
    "Filtra y actúa sobre reportes de baja calidad o de alto riesgo sin verificar.",
  "dash.worklistEmpty": "No hay reportes marcados. ¡Buen trabajo!",
  "dash.filter.all": "Todos",
  "dash.filter.no_photos": "Sin fotos",
  "dash.filter.mostly_unsure": "Mayoría «no sé»",
  "dash.filter.thin": "Pocas respuestas",
  "dash.filter.missing_location": "Sin ubicación",
  "dash.filter.unverified_high": "Alto riesgo sin verificar",
  "dash.requestReview": "Solicitar revisión",
  "dash.reviewRequested": "Revisión solicitada",
  "dash.reviewExists": "Ya hay una solicitud abierta",
  "dash.copyLink": "Copiar enlace",
  "dash.linkCopied": "Enlace copiado",
  "dash.photosWord": "fotos",
  "dash.unsureWord": "no sé",
  "dash.flagNoPhotos": "Sin fotos",
  "dash.flagUnsure": "Mayoría no sé",
  "dash.flagThin": "Pocas respuestas",
  "dash.flagLocation": "Sin ubicación",
  "dash.flagUnverified": "Sin verificar",
  "dash.verification": "Verificación profesional",
  "dash.verificationHint":
    "Confirma evaluaciones con ingenieros y cierra el círculo en reportes de alto riesgo.",
  "dash.vProfessional": "Profesionales",
  "dash.vSelf": "Autoevaluación",
  "dash.vVerified": "Verificados",
  "dash.vDisagreement": "Tasa de ajuste",
  "dash.vAgree": "Coinciden",
  "dash.vAdjust": "Ajustados",
  "dash.vUnverifiedHigh": "Alto riesgo sin verificar",
  "dash.vUnverifiedEmpty":
    "Todos los reportes de alto riesgo están verificados.",
  "dash.actionError": "No se pudo completar la acción",

  // Triaje de solicitudes (admin voluntarios)
  "vadmin.triage": "Triaje de solicitudes",
  "vadmin.triageHint":
    "Solicitudes en riesgo de estancarse. Actúa para llevarlas a término.",
  "vadmin.triageEmpty": "No hay solicitudes que necesiten acción.",
  "vadmin.remind": "Recordar",
  "vadmin.reclaim": "Devolver al grupo",
  "vadmin.reassign": "Reasignar",
  "vadmin.reassignPick": "Elegir ingeniero(a)…",
  "vadmin.reminded": "Recordatorio enviado",
  "vadmin.reclaimed": "Devuelta al grupo",
  "vadmin.reassigned": "Reasignada",
  "vadmin.actionError": "No se pudo completar la acción",
  "vadmin.remindersSent": "recordatorios",
  "vadmin.coversState": "cubre el estado",
  "vadmin.noCoverage": "sin cobertura",

  // Unified admin tabs + follow-through
  "admin.tab.seguimiento": "Seguimiento",
  "admin.tab.resumen": "Resumen",
  "admin.tab.voluntarios": "Voluntarios",
  "admin.tab.datos": "Datos",
  "seg.title": "Seguimiento de solicitudes",
  "seg.hint":
    "Casos urgentes primero (🔴/🟠). Asigna un(a) ingeniero(a) o empuja para llevarlos a término.",
  "seg.empty": "No hay solicitudes que necesiten acción ahora.",
  "seg.openUnclaimed": "Sin reclamar",
  "seg.needsPush": "Necesita empuje",
  "seg.urgent": "Urgentes",
  "seg.others": "Otras",
  "seg.assign": "Asignar a…",
  "seg.assigned": "Asignada",
  "seg.waitingHours": "esperando",
  "seg.hoursShort": "h",




  // Save / access reports (passwordless account)
  "account.saveTitle": "Guarda tus reportes",
  "account.saveBody":
    "¿Quieres volver a ver este reporte más adelante o desde otro teléfono? Recibe un enlace por correo para guardarlo. Sin contraseña.",
  "account.saveHint":
    "Solo usamos tu correo para enviarte el enlace de acceso. Sin contraseña ni spam. No es obligatorio.",
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
  "account.claimToast": "Reporte guardado en tu cuenta.",
  "dash.accounts": "Cuentas guardadas",
  "dash.accountsHint":
    "Personas que guardaron sus reportes con su correo (cuenta opcional, sin contraseña).",
  "dash.totalAccounts": "Cuentas",
  "dash.accountsWithReports": "Con reportes",
  "dash.accountsNoReports": "Sin reportes aún",
  "dash.recentSignups": "Registros recientes",
  "dash.noAccounts": "Aún no hay cuentas guardadas.",
  "dash.neverSignedIn": "Nunca",

  // Privacy policy
  "nav.privacy": "Privacidad",
  "footer.legal": "Legal",
  "privacy.title": "Política de privacidad",
  "privacy.subtitle":
    "Cómo EvalúaYa recoge, usa y protege tus datos. Escrito en lenguaje claro.",
  "privacy.updated": "Última actualización: junio de 2026",
  "privacy.intro":
    "EvalúaYa es una herramienta gratuita para autoevaluar daños estructurales tras un sismo. Puedes hacer una evaluación sin registrarte. Esta página explica qué información recogemos y qué hacemos con ella.",
  "privacy.responsible.title": "Quién es responsable",
  "privacy.responsible.body":
    "El responsable de esta aplicación es EvalúaYa.app. Para cualquier consulta sobre privacidad puedes escribir a contacto@evaluaya.app.",
  "privacy.collect.title": "Qué datos recogemos",
  "privacy.collect.intro": "Según cómo uses la app, podemos recoger:",
  "privacy.collect.b1":
    "Tus respuestas de la inspección y los datos de la propiedad (tipo de edificación, pisos, antigüedad, nombre del edificio).",
  "privacy.collect.b2":
    "Ubicación aproximada que ingresas: estado, municipio y el texto de dirección o sector.",
  "privacy.collect.b3":
    "Fotos que decidas subir (son opcionales). Se guardan en almacenamiento privado.",
  "privacy.collect.b4":
    "Tu correo electrónico solo si creas una cuenta para guardar reportes, te registras como voluntario, envías comentarios o eres una institución interesada.",
  "privacy.collect.b5":
    "Datos técnicos básicos para evitar abuso (por ejemplo, una dirección IP usada de forma temporal para límites de uso).",
  "privacy.use.title": "Cómo usamos los datos",
  "privacy.use.intro": "Usamos la información para:",
  "privacy.use.b1":
    "Generar tu resultado mediante un análisis estructural automatizado (IA) y reglas de seguridad.",
  "privacy.use.b2":
    "Crear el reporte que puedes guardar, descargar en PDF y compartir.",
  "privacy.use.b3":
    "Producir estadísticas anónimas y agregadas para el mapa y la sala de datos.",
  "privacy.use.b4":
    "Conectar a los residentes que lo solicitan con un ingeniero voluntario verificado.",
  "privacy.share.title": "Qué compartimos",
  "privacy.share.body":
    "Las fotos se mantienen en almacenamiento privado y solo se acceden mediante enlaces firmados temporales. Las superficies públicas (mapa, sala de datos, API abierta) muestran únicamente conteos anónimos y agregados: nunca direcciones, fotos ni identificadores de reportes. No vendemos tus datos.",
  "privacy.retention.title": "Conservación",
  "privacy.retention.body":
    "Conservamos los reportes para mantener el historial del edificio y las estadísticas agregadas. Puedes pedir acceso o eliminación de tus datos escribiendo al correo de contacto.",
  "privacy.processors.title": "Proveedores",
  "privacy.processors.body":
    "Nos apoyamos en proveedores de infraestructura para el alojamiento, la base de datos, el análisis con IA y el envío de correos. Solo procesan datos para prestar estos servicios en nuestro nombre.",
  "privacy.cookies.title": "Cookies y almacenamiento del dispositivo",
  "privacy.cookies.body":
    "Guardamos información en tu dispositivo para que la app funcione sin conexión (borradores y cola de envío) y para recordar tu idioma. Usamos analítica básica para entender el uso de la app.",
  "privacy.rights.title": "Tus derechos",
  "privacy.rights.body":
    "Puedes solicitar acceso, corrección o eliminación de tus datos personales, o retirar tu correo, en cualquier momento escribiendo a contacto@evaluaya.app.",
  "privacy.contact.title": "Contacto",
  "privacy.contact.body":
    "¿Preguntas sobre privacidad? Escríbenos a contacto@evaluaya.app.",
  "privacy.disclaimer":
    "EvalúaYa ofrece orientación preliminar y no sustituye la inspección de un ingeniero estructural autorizado ni de Protección Civil.",

  // Open data API (data room)
  "data.api.title": "Datos abiertos / API",
  "data.api.body":
    "Publicamos los datos anónimos y agregados como una API abierta para autoridades, medios, investigadores y agentes de IA. Solo conteos: nunca direcciones, fotos ni identificadores.",
  "data.api.endpointsTitle": "Endpoints",
  "data.api.licenseLabel": "Licencia",
  "data.api.license": "CC BY 4.0",
  "data.api.attributionLabel": "Atribución requerida",
  "data.api.attribution": "Datos de EvalúaYa (evaluaya.app), CC BY 4.0",
  "data.api.exampleLabel": "Ejemplo",
  "data.api.viewManifest": "Ver manifiesto de la API",
  "data.api.ep.aggregates": "Conteos por estado/municipio y nivel de riesgo",
  "data.api.ep.totals": "Totales nacionales",
  "data.api.ep.timeseries": "Tendencia diaria (últimos ~90 días)",
  "data.api.ep.riskFactors": "Factores de riesgo (el porqué de los resultados)",
  "data.api.ep.methodology": "Metodología, reglas de seguridad y glosario",
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
  "home.behalfTitle": "Can't safely enter the building?",
  "home.behalfBody":
    "You don't have to be inside. A relative or neighbor can run the inspection for you and share the result so you can decide whether it's safe to enter.",
  "home.how2Title": "Guided inspection",
  "home.how2Desc": "Answer the questionnaire and add a photo for each area.",
  "home.how3Title": "AI analysis",
  "home.how3Desc": "Get a risk level and recommended next steps.",
  "home.recentTitle": "Recent assessments",
  "home.recentEmpty": "You have not saved any assessments on this device yet.",
  "home.viewResult": "View result",

  // Volunteer-engineer support thread (reused across surfaces).
  "engineers.sectionTitle": "Volunteer engineer support",
  "engineers.tagline":
    "After your assessment, you can request help from a verified volunteer engineer, at no cost.",
  "engineers.homeBody":
    "You run your self-assessment first. If you need it, we connect you with a verified volunteer engineer.",
  "engineers.recruit": "We recruit",
  "engineers.recruitDesc":
    "We bring in volunteer engineers and organizations across the country.",
  "engineers.validate": "We validate",
  "engineers.validateDesc":
    "We review their experience before approving them and marking them verified.",
  "engineers.connect": "We connect",
  "engineers.connectDesc":
    "When a family asks after their self-assessment, we link them with a verified volunteer engineer who guides them over a video call — and in person if needed. At no cost.",
  "engineers.learnMore": "Become a volunteer engineer",
  "engineers.mapNote":
    "After an assessment, residents can request support from a verified volunteer engineer.",
  "engineers.footerDesc": "We recruit, validate and connect engineers.",
  "engineers.methodologyTitle": "Volunteer engineer network",
  "engineers.methodologyBody":
    "Self-assessment is the first step. We also recruit and validate volunteer engineers and organizations, and connect residents who request it with a verified professional to confirm or adjust the result.",

  "disclaimer.title": "Important notice",
  "disclaimer.body":
    "This tool gives preliminary guidance and is not a substitute for inspection by a licensed structural engineer or Civil Protection. If there is imminent danger, evacuate and call emergency services.",

  // ----- Legal / liability (EN) -----
  "nav.legal": "Legal notice",
  "legal.title": "Legal notice & liability",
  "legal.subtitle": "How to use EvalúaYa and the limits of responsibility.",
  "legal.updated": "Last updated: June 2026",
  "legal.intro":
    "EvalúaYa is a non-profit, community-built initiative. Before using the tool or connecting with a volunteer engineer, please read how it works and what its limits are.",
  "legal.s1.title": "It does not replace an official inspection",
  "legal.s1.body":
    "Neither this tool nor contact with a volunteer engineer replaces a formal inspection by a licensed structural engineer, FUNVISIS or Civil Protection. The result is informational only and is not a certificate of habitability or an official ruling.",
  "legal.s2.title": "It is preliminary technical guidance",
  "legal.s2.body":
    "Any assessment — automated or carried out by a volunteer engineer — is preliminary guidance based on what is reported and visible to the naked eye. It does not analyze hidden elements, buried foundations or the inside of walls, and does not replace a detailed structural study.",
  "legal.s3.title": "Volunteer engineers",
  "legal.s3.body":
    "The engineers and organizations that take part do so voluntarily and free of charge. EvalúaYa does not pay them and has no employment or commercial relationship with them; they act in a personal capacity. We verify their credentials with the information they provide, but we do not guarantee their services or the outcome of their recommendations.",
  "legal.s4.title": "Limitation of liability",
  "legal.s4.body":
    "EvalúaYa, its collaborators and the volunteer engineers are not liable for the recommendations given, the decisions made based on them, or any damages arising from use of the application. The final decision and the responsibility over the building rest with its owner or occupant and the competent authorities.",
  "legal.s5.title": "Emergencies",
  "legal.s5.body":
    "If there is imminent danger, do not wait for an assessment: evacuate immediately and call Civil Protection or emergency services.",
  "legal.contact.title": "Contact",
  "legal.contact.body":
    "Questions about this notice? Write to us at contacto@evaluaya.app. See also our Privacy Policy.",
  "legal.short":
    "Preliminary volunteer guidance; it does not replace an official inspection. Engineers are unpaid volunteers and EvalúaYa is not liable for their recommendations.",
  "legal.readMore": "Read the full legal notice",
  "legal.ack":
    "I understand this is preliminary guidance from unpaid volunteers and does not replace an official inspection.",

  // ── Blocking legal + data-consent gate (Doc #1, lawyer) ──
  "gate.title": "Before you continue",
  "gate.subtitle":
    "EvalúaYa is a private, community-built, non-profit initiative. Read and accept to use the tool.",
  "gate.c1.title": "Not an official body",
  "gate.c1.body":
    "An independent, community-built initiative with no affiliation to FUNVISIS, Civil Protection, the Fire Department or any government body.",
  "gate.c2.title": "It does not issue technical rulings",
  "gate.c2.body":
    "The tool only processes preliminary, reference-only visual findings. It does not issue certificates of habitability, structural rulings or entry authorizations.",
  "gate.c3.title": "Force majeure and environmental factors",
  "gate.c3.body":
    "We are not liable for damage arising from aftershocks, environmental factors or later events. Use of the information is at the user's own risk.",
  "gate.accept":
    "I have read and accept the legal notice and disclaimer of liability.",
  "gate.consent":
    "I authorize the processing of my personal data solely to manage reports on this platform.",
  "gate.cta": "Accept and continue",
  "gate.readFull": "Read the full legal notice",
  "gate.mustAccept": "You must accept both boxes to continue.",

  // ── Resident contact + parroquia (Doc #1, minimal contact data) ──
  "property.sectionContact": "Contact details",
  "property.contactHint":
    "Only so a volunteer evaluator can reach you about this report. Never published.",
  "property.residentName": "Full name",
  "property.residentNamePlaceholder": "Your name",
  "property.phone": "Phone",
  "property.phoneHint": "We'll reach you on WhatsApp at this number.",
  "property.countryCode": "Country code",
  "property.residentContactPhonePlaceholder": "e.g. 414 123 4567",
  "property.parroquia": "Parish",
  "property.parroquiaPlaceholder": "e.g. El Recreo",
  "property.miss.residentName": "your name",
  "property.miss.residentContact": "your phone",
  "property.miss.address": "the address / neighborhood",
  "property.miss.parroquia": "the parish",
  "property.miss.buildingName": "the building name",



  "property.title": "Property details",
  "property.subtitle": "This information helps interpret the findings.",
  "property.address": "Address / neighborhood",
  "property.addressPlaceholder": "e.g. Av. Bolívar, La Candelaria district",
  "property.buildingName": "Building or tower name",
  "property.buildingNamePlaceholder": "e.g. Torre Mara, Res. Doral Plaza",
  "property.buildingNameHint":
    "Helps group reports from the same building on the map. Don't include your apartment number.",
  "property.sectionLocation": "Location",
  "property.sectionBuilding": "About the building",
  "property.optionalDetails": "Add more details (optional)",
  "property.optionalDetailsHide": "Hide details",
  "property.behalfHint":
    "Can't safely enter the building? A relative or neighbor can run this inspection for you and share the result.",
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
  "checklist.photoPromptYes": "You marked damage here. A photo helps an engineer understand it better.",

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
  "factors.rule.tilt": "Lean / tilt",
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

  // --- 4+1 simplified flow (primary questions) ---
  "item.walls.area": "Walls",
  "item.walls.q":
    "Did new cracks appear in the walls (diagonal, X-shaped, or wider than a coin on edge)?",
  "item.walls.example.yes":
    "New diagonal or X-shaped cracks, or wide enough to fit a coin on edge or a pencil.",
  "item.walls.example.no": "Only hairline lines, or no new cracks at all.",
  "item.columns.area": "Columns and beams",
  "item.columns.q":
    "Are there columns or beams with spalled (chipped) concrete, exposed rebar, or marked cracks?",
  "item.columns.example.yes":
    "Concrete on a column or beam chipped off and you can see the rebar, or it has strong cracks.",
  "item.columns.example.no":
    "Columns and beams are smooth, with no fallen concrete or visible steel.",
  "item.openings.area": "Doors and windows",
  "item.openings.q":
    "Are there doors or windows that no longer open or close because the frame warped?",
  "item.openings.example.yes":
    "A door or window that used to open now jams or won't close because the frame is distorted.",
  "item.openings.example.no": "Doors and windows open and close like always.",
  "item.tilt.area": "Lean / tilt",
  "item.tilt.q":
    "Does the building or any floor look leaning, tilted, or sunken compared to before?",
  "item.tilt.example.yes":
    "The building looks leaning or tilted, a floor is now crooked, or part of it sank.",
  "item.tilt.example.no":
    "The building is still straight and level, just like before the quake.",

  // Severe signs (multi-select Q5)
  "checklist.severeTitle": "Serious warning signs",
  "checklist.severeSubtitle":
    "Check only what you saw with this quake. Any of these is a safety alert.",
  "checklist.severeNoneHint":
    "If you saw none, leave them unchecked and continue.",


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

  // Visual examples + glossary (accessibility)
  "checklist.exampleAlt": "Example: what damage looks like versus a healthy structure",
  "checklist.illoDamage": "Sign of damage",
  "checklist.illoOk": "Looks fine",
  "checklist.glossaryHint": "Tap a word to see what it means:",

  "glossary.cimientos.term": "Foundation",
  "glossary.cimientos.def":
    "The base the whole building rests on, usually below the first floor.",
  "glossary.licuefaccion.term": "Liquefaction",
  "glossary.licuefaccion.def":
    "When water-saturated ground loses firmness during a quake and behaves like mud: water or sand can bubble up and structures sink or tilt.",
  "glossary.grieta_diagonal.term": "Diagonal crack",
  "glossary.grieta_diagonal.def":
    "A slanted, X-shaped or stair-step crack. Usually more serious than a thin straight crack because it points to structural stress.",
  "glossary.golpeteo.term": "Pounding",
  "glossary.golpeteo.def":
    "When two neighboring buildings collide during a quake because they sit too close together.",
  "glossary.columna.term": "Column",
  "glossary.columna.def":
    "A vertical element (usually concrete) that carries the building's weight.",
  "glossary.viga.term": "Beam",
  "glossary.viga.def":
    "A horizontal element that connects the columns and holds up floors and the roof.",
  "glossary.cabilla.term": "Rebar",
  "glossary.cabilla.def":
    "The steel bars inside concrete that reinforce it. If they're exposed, the damage is serious.",
  "glossary.pandeo.term": "Buckling",
  "glossary.pandeo.def":
    "When a surface that should be straight looks sunken, curved, or bulging.",
  "glossary.rodapie.term": "Baseboard",
  "glossary.rodapie.def":
    "The trim where the wall meets the floor. A new gap there can mean movement.",
  "glossary.breaker.term": "Breaker",
  "glossary.breaker.def":
    "The switch in the electrical panel that cuts power when there's a fault.",
  "glossary.tomacorriente.term": "Outlet",
  "glossary.tomacorriente.def":
    "The wall socket where you plug in appliances.",

  // Property helper text (accessibility)
  "property.buildingType.help": "What kind of place are you assessing?",
  "property.floors.help": "Count how many floors the whole building has.",
  "property.age.help": "If you don't know the exact year, pick the closest one.",
  "property.age.pre1970.desc":
    "Older construction, before modern seismic codes.",
  "property.age.1970to2000.desc": "Late last-century construction.",
  "property.age.post2000.desc": "More recent construction.",



  "rule.urm.finding":
    "Unreinforced masonry building: highly vulnerable after strong shaking.",
  "rule.urm.step":
    "Suggestion: as a precaution, avoid staying inside until a licensed engineer or Civil Protection assess the building.",
  "rule.tilt.finding":
    "The building looks leaning, tilted, or sunken: possible collapse risk.",
  "rule.tilt.step":
    "Suggestion: do not stay inside; step out and report it to Civil Protection or a licensed engineer immediately.",
  "rule.liquefaction.finding":
    "Soil liquefaction signs: the ground lost its bearing capacity.",
  "rule.liquefaction.step":
    "Suggestion: the structure may settle or tilt; consider stepping out and reporting it to authorities for review.",
  "rule.pounding.finding":
    "Pounding with an adjacent building: possible severe structural damage.",
  "rule.pounding.step": "Suggestion: as a precaution, avoid the contact area between the buildings.",
  "rule.plumbing.finding":
    "Severe plumbing damage or possible gas leak: immediate hazard.",
  "rule.plumbing.step":
    "Suggestion: if you suspect a leak, shut off the main gas and water valves, avoid lights or flames, and consider stepping out.",
  "rule.intensity.finding":
    "Moderate shaking (intensity VI or acceleration ≥0.25g) at this location.",
  "rule.intensity.step":
    "Suggestion: increase caution, inspect more carefully, and prioritize a professional assessment.",
  "rule.intensity_severe.finding":
    "Very strong shaking (intensity VIII+ or acceleration ≥0.50g) at this location.",
  "rule.intensity_severe.step":
    "Suggestion: this area received some of the strongest shaking from the quake; treat any damage with maximum caution.",
  "rule.spectral.finding":
    "Seismic demand for buildings of this height was high (spectral acceleration ≥0.40g).",
  "rule.spectral.step":
    "Suggestion: buildings of this height felt the shaking especially hard; prioritize a professional review.",
  "rule.softsoil.finding":
    "Soft soil: amplifies shaking and raises liquefaction risk.",
  "rule.softsoil.step":
    "Suggestion: watch for ground or building settlement and tilting.",
  "rule.softsoil_severe.finding":
    "Very soft soil: strong shaking amplification and high liquefaction risk.",
  "rule.softsoil_severe.step":
    "Suggestion: inspect the ground and foundations carefully and prioritize a professional assessment.",
  "rule.combo_shaking.finding":
    "Very strong shaking combined with reported structural damage: critical life-safety risk.",
  "rule.combo_shaking.step":
    "Suggestion: as a precaution, avoid staying inside until a licensed engineer or Civil Protection confirm it.",
  "rule.floors.finding": "Building over 7 floors: extra caution required.",
  "rule.floors.step":
    "Suggestion: limit use until an engineer confirms the upper floors are safe.",
  "rule.structure.finding":
    "This building's structural system requires extra caution.",
  "rule.structure.step": "Suggestion: limit use and prioritize a professional assessment.",

  "soil.rock": "Firm soil / rock",
  "soil.stiff": "Stiff soil",
  "soil.soft": "Soft soil",
  "soil.very_soft": "Very soft soil",




  "analyze.title": "Analyzing",
  "analyze.uploading": "Processing photos…",
  "analyze.thinking": "Assessing structural risk…",
  "analyze.imagesAnalyzed": "{n} images analyzed across the community",
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

  "result.title": "Visual findings from your check",
  "result.green.tag": "Minor findings",
  "result.green.action": "Suggestion: keep watch for aftershocks",
  "result.yellow.tag": "Moderate findings",
  "result.yellow.action": "Suggestion: request an in-person technical inspection",
  "result.orange.tag": "Serious findings",
  "result.orange.action": "Suggestion: request an in-person technical inspection soon",
  "result.red.tag": "Severe findings · alert",
  "result.red.action": "Suggestion: avoid entering and report to official agencies",
  "result.summary": "What you reported",
  "result.findings": "What you observed",
  "result.nextSteps": "Suggestions (not orders)",
  "result.findingsDisclaimer":
    "This is NOT a verdict or certification. These are preliminary, referential visual findings based on what you reported. Only a licensed structural engineer or an official agency can determine whether the building is safe or habitable.",

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
  "provisional.step.evacuate": "Suggestion: if there is evident danger, avoid using the building and request an in-person technical inspection.",
  "provisional.step.limit": "Suggestion: limit use of the areas with findings until a technical inspection.",
  "provisional.step.engineer":
    "Suggestion: there are findings in structural elements; request an in-person technical inspection soon.",
  "provisional.step.stay": "Suggestion: keep watch for new damage or aftershocks.",
  "result.photos": "Submitted photos",
  "result.photosHint": "Tap a photo to view it full screen and zoom in.",
  "lightbox.title": "Photo",
  "lightbox.close": "Close",
  "lightbox.next": "Next photo",
  "lightbox.prev": "Previous photo",
  "lightbox.zoomHint": "Pinch or double-tap to zoom",
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
    "Preliminary visual findings, not a verdict. Determining safety or habitability is up to a licensed structural engineer or an official agency.",
  "result.notFound": "This assessment could not be found.",
  "result.genericError": "Something went wrong. Please try again.",
  "result.goHome": "Go home",
  "result.assessedOn": "Assessed on",

  "pdf.title": "Visual findings summary",
  "pdf.property": "Property",
  "pdf.riskLevel": "Findings level",
  "pdf.findingsBannerNote": "Visual findings — not a verdict or a habitability certificate.",
  "pdf.summary": "Summary",
  "pdf.findings": "Key findings",
  "pdf.nextSteps": "Suggestions",
  "pdf.inspection": "Inspection answers",
  "pdf.photos": "Photos",
  "pdf.generated": "Generated by EvalúaYa",

  "common.loading": "Loading…",
  "nav.map": "Map",
  "nav.home": "Home",
  "nav.reports": "My reports",
  "nav.evaluate": "Evaluate",
  "nav.more": "More",
  "nav.language": "Language",
  "nav.help": "Help",
  "nav.feedback": "Send feedback",
  "nav.data": "Data",
  "nav.dataDesc": "Map and open data for authorities and media",
  "nav.today": "Quake today?",
  "nav.todayDesc": "Recent earthquakes near Venezuela",
  "home.todayTitle": "Did it just shake?",
  "home.todayDesc": "See recent earthquakes near Venezuela.",

  "footer.tagline":
    "Post-earthquake structural damage self-assessment. Free, no sign-up.",
  "footer.explore": "Explore",
  "footer.participate": "Get involved",
  "footer.resources": "Resources",
  "footer.note":
    "Anonymized, open data · Community-built open-source project · Made with ❤️ for Venezuela 🇻🇪",
  "footer.evaluate": "Evaluate",
  "footer.contact": "Contact",
  "contact.email": "contacto@evaluaya.app",
  "contact.subject": "Inquiry — EvalúaYa",


  "data.title": "Data room",
  "data.subtitle":
    "Explore structural damage reported across Venezuela. Anonymous, open data — built for authorities, media and response teams.",
  "data.mobileNote":
    "You're viewing a summary. Open the data room on a larger screen for filters, an expanded map and full analysis.",
  "data.openMap": "View full map",
  "data.filters": "Filters",
  "picker.mostAffected": "Most-affected areas",
  "picker.allAreas": "All areas",
  "data.filterState": "State",
  "data.filterMunicipality": "Municipality",
  "data.filterAll": "All",
  "data.filterRange": "Period",
  "data.range7": "7 days",
  "data.range30": "30 days",
  "data.range90": "90 days",
  "data.rangeAll": "All time",
  "data.clearFilters": "Clear filters",
  "data.activeScope": "Showing",
  "data.scopeNational": "the whole country",
  "data.chartsTitle": "Indicators",
  "data.mapTitle": "Interactive map",
  "data.noResults": "No data for these filters.",
  "data.export": "Export & share",
  "dataroom.tab.summary": "Summary",
  "dataroom.tab.map": "Map",
  "dataroom.tab.areas": "Areas",
  "dataroom.tab.evidence": "Evidence",
  "dataroom.tab.open": "Open data",
  "dataroom.eyebrow.briefing": "Executive summary",
  "dataroom.eyebrow.severity": "Severity",
  "dataroom.eyebrow.distribution": "Distribution",
  "dataroom.eyebrow.trend": "Trend",
  "dataroom.eyebrow.map": "Map",
  "dataroom.eyebrow.areas": "Areas",
  "dataroom.eyebrow.why": "Why",
  "dataroom.eyebrow.photos": "Documentation",
  "dataroom.eyebrow.glossary": "Glossary",
  "dataroom.eyebrow.export": "Export",
  "dataroom.eyebrow.api": "API",
  "dataroom.updated": "Updated",
  "dataroom.updatedJustNow": "just now",
  "dataroom.updatedMinutes": "{n} min ago",
  "dataroom.updatedHours": "{n} h ago",
  "dataroom.updatedDays": "{n} d ago",
  "dataroom.narrative": "Of {total} assessments, {pct}% report damage that needs an engineer's attention.",
  "dataroom.narrativeArea": "Of {total} assessments, {pct}% report damage that needs an engineer's attention. {area} is the hardest-hit area.",
  "dataroom.narrativeLow": "Of {total} assessments, most report no serious damage.",
  "data.dict.title": "How to read this data",
  "data.dict.intro":
    "Definitions for the terms on this page, so everyone reads the numbers the same way.",
  "data.dict.evaluacion.term": "Assessment",
  "data.dict.evaluacion.def":
    "A self-assessment submitted from the app. It is not the same as a unique building: one building may have several assessments (e.g. different apartments).",
  "data.dict.zonas.term": "Areas",
  "data.dict.zonas.def":
    "Number of distinct municipalities or states with at least one assessment.",
  "data.dict.low.def": "Minor findings: no evident damage to load-bearing elements.",
  "data.dict.moderate.def": "Moderate findings: minor cracks or spalling reported.",
  "data.dict.serious.def":
    "Serious findings: possible damage to structural elements; a technical inspection is advisable soon.",
  "data.dict.high.def": "Severe findings: failures reported in columns, beams, walls or tilting.",
  "data.dict.seriousOrHigh.term": "Serious or severe findings",
  "data.dict.seriousOrHigh.def":
    "The sum of assessments with findings at orange (serious) and red (severe) level: the cases to prioritize for a technical inspection. It is not the same as “Severe findings”, which counts only the red level.",
  "data.dict.verified.term": "Reviewed by evaluator",
  "data.dict.verified.def":
    "Assessments reviewed by a community volunteer evaluator, not just by the resident.",
  "data.dict.more": "See full methodology",
  "mapa.seeFullData": "View full data",
  "mapa.seeFullDataDesc":
    "Filters, trends and by-area analysis in the data room.",


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
    "Get organized visual findings (Minor / Moderate / Serious / Severe) with a plain-language explanation and suggestions. It is not a verdict.",
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
  "help.faq.behalfQ": "Can I assess on behalf of someone else?",
  "help.faq.behalfA":
    "Yes. You can complete an assessment on behalf of a neighbor or relative (for example, someone staying in a shelter) using what you can observe or photos they send you.",
  "help.faq.offlineQ": "Does it work offline or with a weak signal?",
  "help.faq.offlineA":
    "Yes. You can fill out the checklist with low signal; your progress is saved on your device and the analysis is sent once you're back online.",
  "help.faq.resultsQ": "What do the result colors mean?",
  "help.faq.resultsA":
    "They describe visual findings, not a safety verdict. Green: minor findings. Yellow: moderate findings. Orange: serious findings. Red: severe findings. In all cases, determining safety or habitability is up to a licensed structural engineer or an official agency.",
  "help.faq.engineerQ": "Can I ask an evaluator to review my case?",
  "help.faq.engineerA":
    "Yes. When you finish your assessment you can send a free request. A community volunteer evaluator is notified and may contact you on WhatsApp to give guidance, at no cost. They do not issue expert verdicts.",
  "help.faq.privacyQ": "Is my data private?",
  "help.faq.privacyA":
    "Yes. The assessment is anonymous. We don't ask for your name or personal details to use the app.",
  "help.faq.saveQ": "How do I save and revisit my reports?",
  "help.faq.saveA":
    "On the results screen you can create an account with your email (passwordless magic link) to access your reports from “My reports” anytime.",
  "help.faq.photosQ": "Are photos required?",
  "help.faq.photosA":
    "No. Photos are optional, but they help make the analysis more accurate.",
  "help.faq.newDamageQ": "Which damage should I report?",
  "help.faq.newDamageA":
    "Report only new damage caused by the recent earthquake, not cracks or issues that existed before. This keeps the result focused on the current risk.",
  "help.faq.officialQ": "Does this replace an official inspection?",
  "help.faq.officialA":
    "No. EvalúaYa offers preliminary guidance and does not replace an inspection by a licensed structural engineer or Civil Protection.",
  "help.moreTitle": "Need more help?",
  "help.moreBody":
    "Reach out if you have a question that isn't covered here, or learn how we calculate results.",
  "help.contactCta": "Send a message",
  "help.emailUs": "Email us",


  "home.timePromise": "Free · 2 minutes · no sign-up",
  "home.trustFree": "Free",
  "home.trustNoSignup": "No sign-up",
  "home.trustOffline": "Works offline",
  "home.trustAnon": "Anonymous",
  "home.seoTagline":
    "Know in 2 minutes whether your home is safe to enter after the quake.",
  "home.statBuildings": "assessments",
  
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
  "zona.municipiosWithReports": "Municipalities with reports",
  "zona.municipiosWithReportsHint":
    "Tap a municipality to see its reports in detail.",

  "municipio.eyebrow": "Municipality report",
  "municipio.h1Prefix": "Structural damage in",
  "municipio.intro":
    "Anonymous community reports in {municipio}, {estado}. Assess your home for free, with no sign-up, in just a few minutes.",
  "municipio.ctaPrefix": "Assess my home in",
  "municipio.totalReports": "Reports in the municipality",
  "municipio.lastReport": "Last report",
  "municipio.notEnough":
    "There aren't enough reports in {municipio} yet to show a summary. Be among the first to assess your home and help your community.",
  "municipio.backToState": "See the full analysis for {estado}",
  "municipio.notFound": "We couldn't find that municipality.",


  "property.state": "State",
  "property.statePlaceholder": "Select",
  "property.municipality": "Municipality",
  "property.municipalityPlaceholder": "Select the municipality",
  "property.municipalitySelectState": "Select the state first",
  "property.municipalityUnsure": "Not sure",
  "property.locationHint":
    "We only use the area (state/municipality) for the community map. Your exact address is never shown.",
  "property.detecting": "Detecting your location…",
  "property.detected": "Location detected. You can change it if it's not correct.",
  "property.detectFailed": "We couldn't detect your location. Please select your state.",
  "property.stateRequired": "Select your state to continue.",
  "property.effortHint": "It only takes a few minutes. Photos are optional.",
  "property.missingPrefix": "To continue, you still need:",
  "property.miss.state": "state",
  "property.miss.municipality": "municipality",
  "property.miss.type": "building type",
  "property.miss.age": "age",

  "map.title": "Damage map",
  "map.subtitle":
    "Anonymous reports aggregated by area. Addresses and photos are never shown.",
  "map.totalAssessments": "Assessments",
  "map.areasLabel": "Municipalities",
  "map.high": "Severe findings",
  "map.urgent": "Serious findings",
  "map.moderate": "Moderate findings",
  "map.low": "Minor findings",
  "map.seriousOrHigh": "Serious or severe findings",
  "map.distribution": "Findings distribution",
  "map.geoTitle": "Geographic view",
  "map.geoHint": "Size shows number of reports; color shows the dominant findings level.",
  "map.legendSize": "Size = number of reports",
  "map.legendRisk": "Color = dominant findings",
  "map.legendTitle": "What does each color mean?",
  "map.legendGreen": "Green: minor findings, no evident damage to load-bearing elements.",
  "map.legendYellow": "Yellow: moderate findings, minor cracks or spalling.",
  "map.legendOrange": "Orange: serious findings; an in-person technical inspection is advisable soon.",
  "map.legendRed": "Red: severe findings in columns, beams, walls or tilting.",
  "map.legendVerified": "Solid ring = reviewed by a volunteer evaluator",
  "map.legendSelf": "Dashed ring = resident self-assessment",
  "map.verified": "Reviewed by evaluator",
  "map.selfReported": "Resident self-report",
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
  "map.storyIntro":
    "Scroll to see the story behind the data: how serious the damage is, how it's trending, and why.",
  "map.severityTitle": "How serious it is",
  "map.severityNeedAttention": "need urgent attention",
  "map.severityCaption":
    "Share of assessments at orange or red level: moderate-to-severe damage that needs an engineer.",
  "map.severityTopArea": "Most affected area",
  "map.severityNone":
    "For now, most assessments show no serious damage.",
  "map.trendTitle": "Reports over time",
  "map.trendSubtitle":
    "Assessments per day (last 90 days), split by risk level.",
  "map.trendEmpty": "Not enough data yet to show the trend.",
  "map.trendTotalReports": "reports in this period",

  // Open data API usage
  "apiUsage.title": "Open data API",
  "apiUsage.subtitle":
    "Usage of the public data API. Requests reaching the server — cached responses aren't counted, so this is a lower bound.",
  "apiUsage.live": "Live",
  "apiUsage.down": "No response",
  "apiUsage.total7d": "Calls (7 days)",
  "apiUsage.today": "Today",
  "apiUsage.endpoints": "Endpoints used",
  "apiUsage.lastCall": "Last call",
  "apiUsage.never": "No usage yet",
  "apiUsage.byEndpoint": "By endpoint",
  "apiUsage.byReferer": "Top referrers",
  "apiUsage.byState": "Most-queried states",
  "apiUsage.empty": "The API hasn't been queried yet.",
  "apiUsage.emptyHint":
    "When someone uses the open data API, usage will show up here.",
  "apiUsage.calls": "calls",
  "apiUsage.docsCta": "View the API",

  // Photo documentation
  "photos.title": "Photo documentation",
  "photos.subtitle":
    "How much photo evidence backs the reports. Counts only — the photos are never shown.",
  "photos.total": "Photos received",
  "photos.withPhoto": "Reports with a photo",
  "photos.avgPerReport": "Photos per report",
  "photos.coverageTitle": "Coverage by element",
  "photos.coverageSubtitle":
    "Which structural elements are best documented with photos.",
  "photos.byAreaTitle": "Photos by area",
  "photos.overTimeTitle": "Photos per day",
  "photos.reportsWord": "reports",
  "photos.photosWord": "photos",
  "photos.empty": "No photos in this scope yet.",
  "photos.coverageOf": "of",

  "map.whyTitle": "Why the data looks this way",
  "map.whySubtitle":
    "The factors that show up most across assessments nationwide: flagged damage, building age and type, seismic intensity, and triggered safety rules.",
  "map.exportTitle": "Export and share",
  "map.exportSubtitle":
    "Take this data to an engineer, authority, or news outlet.",


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
  "result.proBadge": "Reviewed by community volunteer evaluator",
  "result.proBadgeDesc":
    "This report was reviewed by a community volunteer evaluator; it is not an expert verdict or certification.",
  "result.residentBadge": "Resident self-assessment",
  "result.shareOwnerTitle": "Is this for someone else?",
  "result.shareOwnerBody":
    "Share these findings with the owner or resident so they can seek a technical inspection.",

  "share.title": "Help spread EvalúaYa",
  "share.body":
    "Share it with your family and neighbors. The more people assess their homes, the better we understand each area's damage. ❤️",
  "share.whatsapp": "Share on WhatsApp",
  "share.copy": "Copy link",
  "share.copied": "Link copied!",
  "share.message":
    "Assess your home's earthquake damage with EvalúaYa — free, no sign-up, works on low signal: 🇻🇪",
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
  "help.tremorGuideLink": "What to do after a tremor",
  "help.cracksGuideLink": "Dangerous cracks: how to identify them",
  "help.boconoGuideLink": "Boconó Fault: Venezuela's main fault",

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
  "nav.volunteersShort": "Volunteers",

  "connect.title": "Request a volunteer evaluator",
  "connect.subtitleRed":
    "Your findings are severe. Send your case and a community volunteer evaluator will review it and contact you for guidance. Free and no obligation.",
  "connect.subtitleYellow":
    "Send your case and a community volunteer evaluator can help you interpret these findings. Free and no obligation.",
  "connect.reassure": "Community volunteer evaluators — no cost.",
  "connect.requestTitle": "Request a volunteer evaluator",
  "connect.requestBody":
    "Leave your WhatsApp and we'll share your report with registered community volunteer evaluators. One of them will take your case and reach out.",
  "connect.requestCta": "Send request",
  "connect.requestSending": "Sending…",
  "connect.requestDone": "Done! An evaluator will contact you soon.",
  "connect.requestError": "Could not send. Please try again.",
  "connect.yourWhatsapp": "Your WhatsApp number",
  "connect.whatsappPlaceholder": "e.g. 0414 123 4567",
  "connect.whatsappHint":
    "Include your area code. If you're in Venezuela you can use your local number (e.g. 0414…); we add the country code (+58) automatically.",
  "connect.noteOptional": "Message (you can edit it)",
  "connect.notePlaceholder": "e.g. Large cracks in the living room.",
  "connect.notePrefill": "My assessment reported {risk}-level findings. Findings: {findings}.",
  "connect.privacy":
    "Your number is only shared with registered community volunteer evaluators. It's never published.",
  "connect.areEngineer": "Are you an engineer? Join as a volunteer",

  "vol.title": "Volunteer engineers",
  "vol.subtitle":
    "A community initiative. When a family asks after their self-assessment, you guide them — first over a video call, and with an in-person visit if needed.",
  "vol.how1": "Sign up with your WhatsApp and the states you can cover.",
  "vol.how2": "We review your request and send you a private link.",
  "vol.how3":
    "You receive requests from families who asked for help after their self-assessment. You guide them over a video call or WhatsApp and, when possible, with an in-person visit.",
  "vol.formTitle": "I want to volunteer",
  "vol.name": "Full name",
  "vol.namePlaceholder": "e.g. Eng. María Pérez",
  "vol.org": "Company or organization (optional)",
  "vol.orgPlaceholder": "e.g. Engineering Association",
  "vol.whatsapp": "WhatsApp",
  "vol.email": "Email",
  "vol.emailHint":
    "We need it to send you your access link once you're validated.",
  "vol.verifyTitle": "Professional verification",
  "vol.verifyHint":
    "To protect families, we validate every volunteer. Add your license number (CIV) and a document supporting your profession. It speeds up your approval.",
  "vol.license": "License / CIV number (optional)",
  "vol.licensePlaceholder": "e.g. CIV 123456",
  "vol.credential": "Supporting document (optional)",
  "vol.credentialCta": "Upload credential or degree",
  "vol.credentialHint":
    "PDF or image (CIV ID, degree, work proof). Max 6 MB. Only our validation team can see it.",
  "vol.credentialUploading": "Uploading…",
  "vol.credentialUploaded": "Document uploaded",
  "vol.credentialCta2": "Change document",
  "vol.credentialError": "Could not upload the document. Try again.",
  "vol.credentialTooLarge": "The file exceeds 6 MB.",
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

  // Verified engineers showcase
  "vol.verifiedTitle": "Community volunteer evaluators",
  "vol.verifiedCountOne": "{n} registered evaluator or organization",
  "vol.verifiedCountMany": "{n} registered evaluators and organizations",
  "vol.verifiedSubtitle":
    "Professionals and organizations we've reviewed who joined the community network.",
  "vol.verifiedEmptyTitle": "Be the first",
  "vol.verifiedEmptyBody":
    "No registered evaluators yet. Join today and you'll appear here once we validate your request.",
  "vol.individualLabel": "Evaluator",
  "vol.organizationLabel": "Organization",
  "vol.coversStates": "Covers",
  "vol.residentNoteTitle": "Need an evaluator?",
  "vol.residentNoteBody":
    "Complete your evaluation and, at the end, you can request a connection with a community volunteer evaluator.",
  "vol.residentNoteCta": "Start evaluation",


  "panel.title": "Volunteer evaluator panel",
  "panel.welcome": "Hi",
  "panel.coverage": "Coverage",
  "panel.proTitle": "Support evaluation",
  "panel.proBody":
    "Support the resident with a follow-up evaluation. You'll answer the same questions and the report will be marked as reviewed by a volunteer evaluator on the map. It is not a verdict or a habitability certificate.",
  "panel.startPro": "Start support evaluation",
  "panel.invalid": "Invalid or unapproved link",
  "panel.invalidBody":
    "This link doesn't match an approved volunteer evaluator. If you think this is a mistake, contact us.",
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
    "Hi, I'm a community volunteer evaluator from EvalúaYa. I saw your request for guidance after your assessment. How can I help?",

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

  // Admin — help request lifecycle tracking
  "admin.matchingProgress": "Matching progress",
  "admin.stageClaimed": "Claimed",
  "admin.stageContacted": "Contacted",
  "admin.stageVisited": "Visited",
  "admin.stageResolved": "Resolved",
  "admin.stalled": "Stalled",
  "admin.stalledHint": "Claimed 24h+ ago with no progress",
  "admin.filterAll": "All",
  "admin.filterOpen": "Open",
  "admin.filterClaimed": "Claimed",
  "admin.filterStalled": "Stalled",
  "admin.filterResolved": "Resolved",
  "admin.reqClaimedBy": "Handled by",
  "admin.reqUnclaimed": "Unassigned",
  "admin.reqClaimedAt": "Claimed",
  "admin.reqUpdatedAt": "Last update",
  "admin.reqEngineerNote": "Engineer note",
  "admin.reqResidentNote": "Resident note",
  "admin.reqVerdictAgree": "Reviewed by volunteer evaluator",
  "admin.reqVerdictAdjust": "Observations recorded",
  "admin.reqVerified": "Verified report",
  "admin.statusOpen": "Open",
  "admin.statusClaimed": "Claimed",
  "admin.statusClosed": "Closed",

  // Panel — matching enhancements
  "panel.specialization": "Specialty",
  "panel.ageNew": "New",
  "panel.ageWaiting": "Waiting",
  "panel.ageDays": "d",

  // Panel — progress tracking
  "panel.progressTitle": "Progress",
  "panel.stage.claimed": "Assigned",
  "panel.stage.contacted": "Contacted resident",
  "panel.stage.visited": "Visited / inspected",
  "panel.stage.resolved": "Resolved",
  "panel.markContacted": "Mark: contacted",
  "panel.markVisited": "Mark: visited",
  "panel.markResolved": "Mark: resolved",
  "panel.progressNote": "Progress note (optional)",
  "panel.progressNotePlaceholder": "E.g.: Scheduled a visit for Saturday.",
  "panel.progressSaved": "Progress updated.",
  "panel.lastUpdate": "Last update",
  "panel.currentStage": "Current stage",

  // Panel — record professional observations
  "panel.reviewTitle": "Record your observations",
  "panel.reviewBody":
    "Leave your professional observations after guiding the resident. This marks the report as reviewed by a volunteer evaluator; it is not a verdict or a habitability certificate.",
  "panel.reviewCta": "Record observations",
  "panel.reviewNotePlaceholder": "E.g.: Guided the resident; recommended a formal inspection by a licensed engineer.",
  "panel.reviewDescargo":
    "I declare that my observations are advisory and voluntary, that they do not constitute an official verdict or a habitability certificate, and that the decision on safety rests with a formal inspection by a licensed structural engineer, FUNVISIS or Civil Protection.",
  "panel.reviewSubmit": "Save observations",
  "panel.reviewSaved": "Observations recorded. Thank you for your support.",
  "panel.reviewedByYou": "Reviewed by you",
  "panel.cancel": "Cancel",
  "panel.noReportToValidate": "This request has no linked assessment.",


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
  "dash.funnel.title": "Evaluation funnel",
  "dash.funnel.window": "Last 48 h",
  "dash.funnel.completion": "complete the evaluation",
  "dash.funnel.empty": "No funnel data in this window yet.",
  "dash.funnel.biggestDrop": "Biggest drop at:",
  "dash.funnel.step.home_cta": "Home: start",
  "dash.funnel.step.property_started": "Property details",
  "dash.funnel.step.property_completed": "Property completed",
  "dash.funnel.step.checklist_started": "Inspection checklist",
  "dash.funnel.step.analyze_started": "AI analysis",
  "dash.funnel.step.result_reached": "Result",
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
  "dash.matchingProgressHint":
    "What the engineer reports after claiming a request.",
  "dash.requests": "Requests",
  "dash.open": "Open",
  "dash.openShort": "open",
  "dash.claimRate": "Response rate",
  "dash.avgClaim": "Avg. response time",
  "dash.gaps": "Coverage gaps",
  "dash.gapsHint": "States with open requests and no approved engineers.",
  "dash.noGaps": "No coverage gaps.",

  // Evaluation quality & verification (admin)
  "dash.quality": "Evaluation quality",
  "dash.qualityHint": "Data completeness and reports that need attention.",
  "dash.qComplete": "Complete data",
  "dash.qWithPhotos": "With photos",
  "dash.qLowQuality": "Low quality",
  "dash.qVerified": "Verified",
  "dash.qUnverifiedHigh": "High-risk unverified",
  "dash.qMissingLocation": "Missing location",
  "dash.qMissingBuilding": "Missing building",
  "dash.qMissingIntensity": "Missing intensity",
  "dash.qProfessional": "Professional",
  "dash.worklist": "Reports needing attention",
  "dash.worklistHint":
    "Filter and act on low-quality or unverified high-risk reports.",
  "dash.worklistEmpty": "No flagged reports. Nice work!",
  "dash.filter.all": "All",
  "dash.filter.no_photos": "No photos",
  "dash.filter.mostly_unsure": "Mostly unsure",
  "dash.filter.thin": "Thin",
  "dash.filter.missing_location": "Missing location",
  "dash.filter.unverified_high": "Unverified high-risk",
  "dash.requestReview": "Request review",
  "dash.reviewRequested": "Review requested",
  "dash.reviewExists": "A request is already open",
  "dash.copyLink": "Copy link",
  "dash.linkCopied": "Link copied",
  "dash.photosWord": "photos",
  "dash.unsureWord": "unsure",
  "dash.flagNoPhotos": "No photos",
  "dash.flagUnsure": "Mostly unsure",
  "dash.flagThin": "Thin",
  "dash.flagLocation": "Missing location",
  "dash.flagUnverified": "Unverified",
  "dash.verification": "Professional verification",
  "dash.verificationHint":
    "Confirm assessments with engineers and close the loop on high-risk reports.",
  "dash.vProfessional": "Professional",
  "dash.vSelf": "Self-assessment",
  "dash.vVerified": "Verified",
  "dash.vDisagreement": "Adjustment rate",
  "dash.vAgree": "Agree",
  "dash.vAdjust": "Adjusted",
  "dash.vUnverifiedHigh": "High-risk unverified",
  "dash.vUnverifiedEmpty": "All high-risk reports are verified.",
  "dash.actionError": "Couldn't complete the action",

  // Request triage (admin volunteers)
  "vadmin.triage": "Request triage",
  "vadmin.triageHint":
    "Requests at risk of stalling. Act to drive them to completion.",
  "vadmin.triageEmpty": "No requests need action right now.",
  "vadmin.remind": "Remind",
  "vadmin.reclaim": "Return to pool",
  "vadmin.reassign": "Reassign",
  "vadmin.reassignPick": "Pick engineer…",
  "vadmin.reminded": "Reminder sent",
  "vadmin.reclaimed": "Returned to pool",
  "vadmin.reassigned": "Reassigned",
  "vadmin.actionError": "Couldn't complete the action",
  "vadmin.remindersSent": "reminders",
  "vadmin.coversState": "covers state",
  "vadmin.noCoverage": "no coverage",

  // Unified admin tabs + follow-through
  "admin.tab.seguimiento": "Follow-through",
  "admin.tab.resumen": "Overview",
  "admin.tab.voluntarios": "Volunteers",
  "admin.tab.datos": "Data",
  "seg.title": "Request follow-through",
  "seg.hint":
    "Urgent cases first (🔴/🟠). Assign an engineer or push to drive them to completion.",
  "seg.empty": "No requests need action right now.",
  "seg.openUnclaimed": "Unclaimed",
  "seg.needsPush": "Needs a push",
  "seg.urgent": "Urgent",
  "seg.others": "Others",
  "seg.assign": "Assign to…",
  "seg.assigned": "Assigned",
  "seg.waitingHours": "waiting",
  "seg.hoursShort": "h",




  // Save / access reports (passwordless account)
  "account.saveTitle": "Save your reports",
  "account.saveBody":
    "Want to see this report later or from another phone? Get a link by email to save it. No password needed.",
  "account.saveHint":
    "We only use your email to send you the access link. No password, no spam. It's optional.",
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
  "account.claimToast": "Report saved to your account.",
  "dash.accounts": "Saved accounts",
  "dash.accountsHint":
    "People who saved their reports with their email (optional, passwordless account).",
  "dash.totalAccounts": "Accounts",
  "dash.accountsWithReports": "With reports",
  "dash.accountsNoReports": "No reports yet",
  "dash.recentSignups": "Recent signups",
  "dash.noAccounts": "No saved accounts yet.",
  "dash.neverSignedIn": "Never",

  // Privacy policy
  "nav.privacy": "Privacy",
  "footer.legal": "Legal",
  "privacy.title": "Privacy Policy",
  "privacy.subtitle":
    "How EvalúaYa collects, uses and protects your data. Written in plain language.",
  "privacy.updated": "Last updated: June 2026",
  "privacy.intro":
    "EvalúaYa is a free tool for self-assessing structural damage after an earthquake. You can run an assessment without signing up. This page explains what we collect and what we do with it.",
  "privacy.responsible.title": "Who is responsible",
  "privacy.responsible.body":
    "This application is operated by EvalúaYa.app. For any privacy question, write to contacto@evaluaya.app.",
  "privacy.collect.title": "What we collect",
  "privacy.collect.intro": "Depending on how you use the app, we may collect:",
  "privacy.collect.b1":
    "Your inspection answers and property details (building type, floors, age, building name).",
  "privacy.collect.b2":
    "Approximate location you enter: state, municipality and the address/neighborhood text.",
  "privacy.collect.b3":
    "Photos you choose to upload (optional). They are kept in private storage.",
  "privacy.collect.b4":
    "Your email only if you create an account to save reports, sign up as a volunteer, send feedback, or are an interested institution.",
  "privacy.collect.b5":
    "Basic technical data to prevent abuse (e.g. an IP address used temporarily for rate limiting).",
  "privacy.use.title": "How we use data",
  "privacy.use.intro": "We use the information to:",
  "privacy.use.b1":
    "Generate your result via automated structural analysis (AI) and safety rules.",
  "privacy.use.b2": "Create the report you can save, download as PDF and share.",
  "privacy.use.b3":
    "Produce anonymized, aggregated statistics for the map and data room.",
  "privacy.use.b4":
    "Connect residents who request it with a verified volunteer engineer.",
  "privacy.share.title": "What we share",
  "privacy.share.body":
    "Photos stay in private storage and are only accessed through temporary signed links. Public surfaces (map, data room, open API) show only anonymized, aggregated counts — never addresses, photos or report IDs. We do not sell your data.",
  "privacy.retention.title": "Retention",
  "privacy.retention.body":
    "We keep reports to maintain building history and aggregated statistics. You can request access to or deletion of your data via the contact email.",
  "privacy.processors.title": "Processors",
  "privacy.processors.body":
    "We rely on infrastructure providers for hosting, database, AI analysis and email delivery. They only process data to provide these services on our behalf.",
  "privacy.cookies.title": "Cookies and device storage",
  "privacy.cookies.body":
    "We store information on your device so the app works offline (drafts and the send queue) and to remember your language. We use basic analytics to understand app usage.",
  "privacy.rights.title": "Your rights",
  "privacy.rights.body":
    "You can request access, correction or deletion of your personal data, or remove your email, at any time by writing to contacto@evaluaya.app.",
  "privacy.contact.title": "Contact",
  "privacy.contact.body":
    "Privacy questions? Write to us at contacto@evaluaya.app.",
  "privacy.disclaimer":
    "EvalúaYa offers preliminary guidance and is not a substitute for inspection by a licensed structural engineer or Civil Protection.",

  // Open data API (data room)
  "data.api.title": "Open data / API",
  "data.api.body":
    "We publish the anonymized, aggregated data as an open API for authorities, media, researchers and AI agents. Counts only — never addresses, photos or IDs.",
  "data.api.endpointsTitle": "Endpoints",
  "data.api.licenseLabel": "License",
  "data.api.license": "CC BY 4.0",
  "data.api.attributionLabel": "Required attribution",
  "data.api.attribution": "Datos de EvalúaYa (evaluaya.app), CC BY 4.0",
  "data.api.exampleLabel": "Example",
  "data.api.viewManifest": "View API manifest",
  "data.api.ep.aggregates": "Counts by state/municipality and risk level",
  "data.api.ep.totals": "National totals",
  "data.api.ep.timeseries": "Daily trend (last ~90 days)",
  "data.api.ep.riskFactors": "Risk factors (the why behind results)",
  "data.api.ep.methodology": "Methodology, safety rules and glossary",
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
