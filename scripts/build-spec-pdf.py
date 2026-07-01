#!/usr/bin/env python3
"""
Generate the EvalúaYa technical-spec PDFs (Spanish + English).

These are the "for engineers" documents linked from the methodology page
(/evaluaya-spec-es.pdf and /evaluaya-spec-en.pdf). They describe, in plain
language, exactly when the app reports Green / Yellow / Red — kept in sync
with the live code:
  - src/lib/safety-rules.ts      (deterministic Layer 1 rules)
  - src/lib/shakemap.ts          (multi-layer USGS ShakeMap lookups)
  - src/lib/assessment.functions.ts (Layer 2 AI prompt + combination)

Run:  python3 scripts/build-spec-pdf.py
Out:  public/evaluaya-spec-es.pdf, public/evaluaya-spec-en.pdf
"""

import os

from reportlab.lib import colors
from reportlab.lib.enums import TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import (
    HRFlowable,
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)

OUT_DIR = os.path.join(os.path.dirname(__file__), "..", "public")

# Embed real TrueType fonts (Bitstream Vera, bundled with reportlab) so the
# PDFs render identically in every viewer — including mobile browsers, where
# non-embedded base-14 fonts get substituted with broken glyph metrics.
_FONTS = os.path.join(os.path.dirname(pdfmetrics.__file__), "..", "fonts")
pdfmetrics.registerFont(TTFont("Body", os.path.join(_FONTS, "Vera.ttf")))
pdfmetrics.registerFont(TTFont("Body-Bold", os.path.join(_FONTS, "VeraBd.ttf")))
pdfmetrics.registerFont(TTFont("Body-Italic", os.path.join(_FONTS, "VeraIt.ttf")))
pdfmetrics.registerFont(TTFont("Body-BoldItalic", os.path.join(_FONTS, "VeraBI.ttf")))
pdfmetrics.registerFontFamily(
    "Body", normal="Body", bold="Body-Bold",
    italic="Body-Italic", boldItalic="Body-BoldItalic",
)

FONT = "Body"
FONT_BOLD = "Body-Bold"
FONT_ITALIC = "Body-Italic"

INK = colors.HexColor("#1f2937")
MUTED = colors.HexColor("#6b7280")
LINE = colors.HexColor("#e5e7eb")
RED = colors.HexColor("#be2823")
ORANGE = colors.HexColor("#d86916")
YELLOW = colors.HexColor("#ca8a04")
GREEN = colors.HexColor("#168050")
TEAL = colors.HexColor("#0f766e")
SOFT = colors.HexColor("#f8fafc")



def styles():
    base = getSampleStyleSheet()
    s = {}
    s["h1"] = ParagraphStyle(
        "h1", parent=base["Title"], fontName=FONT_BOLD,
        fontSize=19, leading=24, textColor=INK, spaceAfter=4, alignment=TA_LEFT,
    )
    s["sub"] = ParagraphStyle(
        "sub", parent=base["Normal"], fontName=FONT,
        fontSize=10, leading=14.5, textColor=MUTED, spaceAfter=10,
    )
    s["h2"] = ParagraphStyle(
        "h2", parent=base["Heading2"], fontName=FONT_BOLD,
        fontSize=13, leading=17, textColor=TEAL, spaceBefore=16, spaceAfter=6,
    )
    s["body"] = ParagraphStyle(
        "body", parent=base["Normal"], fontName=FONT,
        fontSize=9.5, leading=14, textColor=INK, spaceAfter=6,
    )
    s["src"] = ParagraphStyle(
        "src", parent=base["Normal"], fontName=FONT_ITALIC,
        fontSize=8, leading=11, textColor=MUTED, spaceAfter=4,
    )
    s["cell"] = ParagraphStyle(
        "cell", parent=base["Normal"], fontName=FONT,
        fontSize=8.5, leading=11.5, textColor=INK,
    )
    s["cellb"] = ParagraphStyle(
        "cellb", parent=base["Normal"], fontName=FONT_BOLD,
        fontSize=8.5, leading=11.5, textColor=INK,
    )
    s["foot"] = ParagraphStyle(
        "foot", parent=base["Normal"], fontName=FONT,
        fontSize=8, leading=11, textColor=MUTED,
    )
    return s



def tag(text, color):
    return f'<font color="#{color.hexval()[2:]}"><b>{text}</b></font>'



def two_col_table(s, header, rows, c0=78 * mm, c1=None):
    if c1 is None:
        c1 = 165 * mm - c0
    data = [[Paragraph(header[0], s["cellb"]), Paragraph(header[1], s["cellb"])]]
    for a, b in rows:
        data.append([Paragraph(a, s["cell"]), Paragraph(b, s["cell"])])
    t = Table(data, colWidths=[c0, c1], hAlign="LEFT")
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), SOFT),
        ("LINEBELOW", (0, 0), (-1, -1), 0.5, LINE),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
        ("LEFTPADDING", (0, 0), (-1, -1), 8),
        ("RIGHTPADDING", (0, 0), (-1, -1), 8),
    ]))
    return t


def three_col_table(s, header, rows):
    data = [[Paragraph(h, s["cellb"]) for h in header]]
    for r in rows:
        data.append([Paragraph(c, s["cell"]) for c in r])
    t = Table(data, colWidths=[70 * mm, 30 * mm, 65 * mm], hAlign="LEFT")
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), SOFT),
        ("LINEBELOW", (0, 0), (-1, -1), 0.5, LINE),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("TOPPADDING", (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
        ("LEFTPADDING", (0, 0), (-1, -1), 7),
        ("RIGHTPADDING", (0, 0), (-1, -1), 7),
    ]))
    return t


def content_es(s):
    f = []
    R, O, Y, G = (
        tag("ROJO", RED),
        tag("NARANJA", ORANGE),
        tag("AMARILLO", YELLOW),
        tag("VERDE", GREEN),
    )
    f.append(Paragraph("EvalúaYa — Especificación técnica del algoritmo", s["h1"]))
    f.append(Paragraph(
        "Cómo la app decide Verde, Amarillo, Naranja o Rojo. Cada afirmación está tomada "
        "del código en funcionamiento (el archivo fuente se indica en gris).", s["sub"]))
    f.append(HRFlowable(width="100%", color=LINE, spaceAfter=8))

    f.append(Paragraph("Cómo se decide el color final", s["h2"]))
    f.append(Paragraph(
        "El resultado se forma en dos capas independientes y se conserva la más severa. "
        "Las reglas de seguridad (Capa 1) solo pueden subir el nivel: nunca "
        "hacen un resultado menos severo de lo que sugirió la IA.", s["body"]))
    f.append(Paragraph(
        "Orden: se leen los datos del sismo en la ubicación (ShakeMap) -> las fotos y "
        "respuestas van a la IA para una decisión Verde/Amarillo/Naranja/Rojo -> se aplican "
        "las reglas deterministas -> se combinan tomando la peor.", s["body"]))
    f.append(Paragraph(
        "Los cuatro niveles: <b>Verde</b> sin daño estructural significativo (parece "
        "seguro ocupar); <b>Amarillo</b> daño leve o cosmético (habitable, mantener "
        "observación); <b>Naranja</b> daño moderado a serio que necesita a un ingeniero "
        "pronto (limitar el uso a entradas breves); <b>Rojo</b> daño grave o señales de "
        "colapso (no entrar, evacuar).", s["body"]))
    f.append(Paragraph("fuente: assessment.functions.ts — finalRisk = maxRisk(ai, rules)", s["src"]))

    f.append(Paragraph("Capa 1 — Reglas de seguridad deterministas", s["h2"]))
    f.append(Paragraph(
        "Mismas entradas, mismo resultado, sin IA. Cada grupo fija un piso de severidad; "
        "se conserva el más alto que se active (y la IA nunca puede bajarlo).",
        s["body"]))
    f.append(two_col_table(s, ["Condición -> " + R, "Por qué"], [
        ("SÍ a señales de licuefacción del suelo.",
         "El suelo pierde capacidad de soporte; asentamiento o inclinación."),
        ("SÍ a golpeteo contra un edificio vecino (pounding).",
         "El impacto puede causar daño estructural grave y oculto."),
        ("SÍ a daño grave de plomería / gas.",
         "Posible fuga de gas: peligro inmediato para la vida."),
        ("Sacudida fuerte <b>Y</b> cualquier daño estructural reportado.",
         "MMI ≥ 8 o PGA ≥ 0.50g junto con daño visible = combinación crítica."),
        ("Mampostería no reforzada (URM) <b>con</b> daño estructural o sacudida "
         "moderada (MMI ≥ 6 o PGA ≥ 0.25g).",
         "Sin refuerzo de acero, ante daño o sacudida ya no es seguro entrar."),
    ]))
    f.append(Spacer(1, 8))
    f.append(two_col_table(s, ["Condición -> ≥ " + O, "Por qué"], [
        ("Mampostería no reforzada (URM) sola, sin daño visible ni sacudida fuerte.",
         "Por su fragilidad necesita revisión profesional pronto."),
        ("Sacudida severa: MMI ≥ 8 <b>o</b> PGA ≥ 0.50g (aun sin daño visible).",
         "Esta altura/ubicación fue sacudida con fuerza; revisar pronto."),
        ("Demanda espectral ≥ 0.40g en el período del edificio.",
         "Edificios de esa altura sintieron la sacudida con especial fuerza."),
        ("Suelo muy blando (vs30 muy bajo).",
         "Amplifica fuertemente la sacudida y eleva el riesgo de licuefacción."),
    ]))
    f.append(Spacer(1, 8))
    f.append(two_col_table(s, ["Condición -> ≥ " + Y, "Por qué"], [
        ("Sacudida moderada: MMI ≥ 6 <b>o</b> PGA ≥ 0.25g.",
         "Sacudida apreciable; revisar con más cuidado aunque no se vea daño."),
        ("Suelo blando (vs30 bajo).",
         "Amplifica la sacudida y favorece licuefacción y asentamiento."),
        ("Más de 7 pisos.",
         "Mayor consecuencia; los pisos superiores requieren revisión profesional."),
        ("Sistema estructural CMF, CIW, PCF o RML.",
         "Sistemas de concreto / mampostería reforzada: precaución adicional."),
    ]))
    f.append(Paragraph(
        "Si ninguna se cumple, la Capa 1 aporta Verde y prevalece la decisión de la IA.",
        s["body"]))
    f.append(Paragraph("fuente: safety-rules.ts — evaluateSafetyRules()", s["src"]))

    f.append(Paragraph("Datos sísmicos del USGS ShakeMap (capa data-driven)", s["h2"]))
    f.append(Paragraph(
        "Si el residente comparte su ubicación, leemos la malla oficial de ShakeMap del "
        "USGS para el sismo activo. La malla trae varias capas co-registradas y se "
        "interpolan bilinealmente al punto exacto del edificio:", s["body"]))
    f.append(two_col_table(s, ["Capa", "Qué aporta a la decisión"], [
        ("MMI (intensidad Mercalli)", "Qué tan fuerte se percibió la sacudida (escala I–XII)."),
        ("PGA — aceleración pico (g)", "Sacudida instantánea máxima; umbrales 0.25g y 0.50g."),
        ("PGV — velocidad pico (cm/s)", "Energía de la sacudida; contexto para la IA."),
        ("SA(0.3 / 0.6 / 1.0 / 3.0 s)", "Aceleración espectral por período: la demanda según altura."),
        ("vs30 -> clase de suelo", "Roca / rígido / blando / muy blando (amplificación, licuefacción)."),
    ]))
    f.append(Spacer(1, 8))
    f.append(Paragraph(
        "<b>Demanda según altura.</b> Estimamos el período natural del edificio con "
        "T ≈ 0.1 × número de pisos y elegimos la banda espectral más cercana "
        "(≤0.45s->SA0.3; ≤0.8s->SA0.6; ≤2.0s->SA1.0; si no->SA3.0). El valor de esa banda "
        "es la sacudida que realmente sintió una edificación de esa altura, y alimenta "
        "tanto la regla de demanda espectral (≥0.40g) como el contexto de la IA.", s["body"]))
    f.append(Paragraph(
        "<b>Suelo.</b> vs30 ≥ 760 = roca; ≥ 360 = rígido; ≥ 180 = blando; menor = muy "
        "blando. El suelo blando eleva el nivel de precaución porque amplifica la sacudida.",
        s["body"]))
    f.append(Paragraph(
        "fuente: shakemap.ts — seismicAt(), spectralDemand(), buildingPeriod(), soilClassFromVs30()",
        s["src"]))

    f.append(Paragraph("Capa 2 — Triaje de fotos con IA", s["h2"]))
    f.append(Paragraph(
        "Las fotos y respuestas van a un modelo de visión (google/gemini-2.5-flash) que "
        "actúa como ingeniero estructural en triaje rápido post-sismo (estilo ATC-20) y "
        "elige exactamente un nivel:", s["body"]))
    f.append(two_col_table(s, ["Nivel", "Significado"], [
        (G, "Sin daño estructural significativo; parece seguro ocupar."),
        (Y, "Daño leve o cosmético; habitable, mantener observación y atender lo señalado."),
        (O, "Daño moderado a serio; necesita a un ingeniero pronto, limitar el uso a entradas breves."),
        (R, "Daño grave o señales de colapso; inseguro, evacuar de inmediato."),
    ], c0=40 * mm))
    f.append(Paragraph(
        "El contexto de ground-motion (MMI, PGA, PGV, demanda espectral según altura y "
        "clase de suelo) se incluye en el prompt: una sacudida fuerte hace pesar más "
        "cualquier daño reportado, pero la sacudida sola, sin daño observado, no fuerza "
        "Rojo por sí misma. La IA es conservadora: ante duda de seguridad, no elige Verde. "
        "Reserva Amarillo para lo genuinamente leve; si hay elementos estructurales "
        "afectados sin colapso inminente, elige Naranja.",
        s["body"]))
    f.append(Paragraph("fuente: assessment.functions.ts — SYSTEM_PROMPT + buildPrompt()", s["src"]))

    f.append(Paragraph("Cómo se combina — ejemplos", s["h2"]))
    f.append(three_col_table(s, ["La IA dice", "¿Regla activa?", "Resultado final"], [
        ("Amarillo", "Licuefacción = SÍ", R),
        ("Verde", "PGA 0.55g + grieta = SÍ", R),
        ("Verde", "URM + grieta = SÍ", R),
        ("Verde", "URM sola (sin daño)", O),
        ("Amarillo", "Demanda espectral 0.45g", O),
        ("Verde", "9 pisos", Y),
        ("Verde", "PGA 0.30g (sin daño)", Y),
        ("Verde", "Ninguna regla", G),
    ]))
    f.append(Paragraph("fuente: safety-rules.ts — maxRisk(a, b) devuelve el más severo", s["src"]))

    f.append(Paragraph("Fuentes y límites", s["h2"]))
    f.append(Paragraph(
        "• ATC-20 (Applied Technology Council): metodología de inspección rápida post-sismo.<br/>"
        "• USGS ShakeMap: malla oficial de movimiento del suelo del sismo activo.<br/>"
        "• Vulnerabilidad de mampostería no reforzada (URM): literatura sísmica establecida.<br/>"
        "• Modelo de IA de visión: google/gemini-2.5-flash vía Lovable AI Gateway.", s["body"]))
    f.append(Paragraph(
        "Límites: es una orientación preliminar, no una certificación. Solo evalúa lo "
        "visible reportado; no inspecciona elementos ocultos ni el interior de los muros. "
        "No sustituye a un ingeniero estructural autorizado ni a Protección Civil.", s["body"]))
    return f


def content_en(s):
    f = []
    R, Y, G = tag("RED", RED), tag("YELLOW", YELLOW), tag("GREEN", GREEN)
    f.append(Paragraph("EvalúaYa — Algorithm technical specification", s["h1"]))
    f.append(Paragraph(
        "How the app decides Green, Yellow or Red. Every statement is taken from the "
        "working code (the source file is noted in grey).", s["sub"]))
    f.append(HRFlowable(width="100%", color=LINE, spaceAfter=8))

    f.append(Paragraph("How the final color is decided", s["h2"]))
    f.append(Paragraph(
        "The result is formed in two independent layers and the more severe one is kept. "
        "The safety rules (Layer 1) can only raise the level toward Red — they never make "
        "a result less severe than the AI suggested.", s["body"]))
    f.append(Paragraph(
        "Order: read the earthquake data at the location (ShakeMap) -> photos and answers "
        "go to the AI for a Green/Yellow/Red call -> apply the deterministic rules -> "
        "combine by taking the worse of the two.", s["body"]))
    f.append(Paragraph("source: assessment.functions.ts — finalRisk = maxRisk(ai, rules)", s["src"]))

    f.append(Paragraph("Layer 1 — Deterministic safety rules", s["h2"]))
    f.append(Paragraph(
        "Same inputs, same result, no AI. If any condition in the first group is true, "
        "the result is forced to Red. If any condition in the second group is true (and "
        "no Red rule fired), the result is forced to at least Yellow.", s["body"]))
    f.append(two_col_table(s, ["Condition -> " + R, "Why"], [
        ("Structural system = unreinforced masonry (URM).",
         "No steel reinforcement; sudden failure after strong shaking."),
        ("YES to ground-liquefaction signs.",
         "Soil loses bearing capacity; settlement or tilting possible."),
        ("YES to pounding against a neighboring building.",
         "Impact can cause severe, hidden structural damage."),
        ("YES to severe plumbing / gas damage.",
         "Possible gas leak: an immediate life-safety hazard."),
        ("Strong shaking <b>AND</b> any reported structural damage.",
         "MMI ≥ 8 or PGA ≥ 0.50g together with visible damage = critical combo."),
    ]))
    f.append(Spacer(1, 8))
    f.append(two_col_table(s, ["Condition -> ≥ " + Y, "Why"], [
        ("Moderate shaking: MMI ≥ 6 <b>or</b> PGA ≥ 0.25g.",
         "Appreciable shaking; inspect more carefully even with no visible damage."),
        ("Severe shaking: MMI ≥ 8 <b>or</b> PGA ≥ 0.50g.",
         "Higher caution floor based on the recorded intensity."),
        ("Spectral demand ≥ 0.40g at the building's period.",
         "Buildings of that height felt the shaking especially hard."),
        ("Soft or very soft soil (low vs30).",
         "Amplifies shaking and raises liquefaction / settlement risk."),
        ("More than 7 floors.",
         "Greater consequence; upper floors need professional review."),
        ("Structural system CMF, CIW, PCF or RML.",
         "Concrete / reinforced-masonry systems warrant extra caution."),
    ]))
    f.append(Paragraph(
        "If none apply, Layer 1 contributes Green and the AI's decision stands.", s["body"]))
    f.append(Paragraph("source: safety-rules.ts — evaluateSafetyRules()", s["src"]))

    f.append(Paragraph("USGS ShakeMap data (the data-driven layer)", s["h2"]))
    f.append(Paragraph(
        "If the resident shares their location, we read the official USGS ShakeMap grid "
        "for the active earthquake. The grid carries several co-registered layers, "
        "bilinearly interpolated to the building's exact point:", s["body"]))
    f.append(two_col_table(s, ["Layer", "What it contributes"], [
        ("MMI (Mercalli intensity)", "How strongly shaking was felt (scale I–XII)."),
        ("PGA — peak acceleration (g)", "Max instantaneous shaking; thresholds 0.25g and 0.50g."),
        ("PGV — peak velocity (cm/s)", "Shaking energy; context for the AI."),
        ("SA(0.3 / 0.6 / 1.0 / 3.0 s)", "Spectral acceleration by period: demand by height."),
        ("vs30 -> soil class", "Rock / stiff / soft / very soft (amplification, liquefaction)."),
    ]))
    f.append(Spacer(1, 8))
    f.append(Paragraph(
        "<b>Demand by height.</b> We estimate the building's natural period as "
        "T ≈ 0.1 × number of floors and pick the nearest spectral band "
        "(≤0.45s->SA0.3; ≤0.8s->SA0.6; ≤2.0s->SA1.0; else->SA3.0). That band's value is the "
        "shaking a building of that height actually experienced, and it feeds both the "
        "spectral-demand rule (≥0.40g) and the AI context.", s["body"]))
    f.append(Paragraph(
        "<b>Soil.</b> vs30 ≥ 760 = rock; ≥ 360 = stiff; ≥ 180 = soft; below = very soft. "
        "Soft soil raises the caution level because it amplifies shaking.", s["body"]))
    f.append(Paragraph(
        "source: shakemap.ts — seismicAt(), spectralDemand(), buildingPeriod(), soilClassFromVs30()",
        s["src"]))

    f.append(Paragraph("Layer 2 — AI photo triage", s["h2"]))
    f.append(Paragraph(
        "Photos and answers go to a vision model (google/gemini-2.5-flash) acting as a "
        "structural engineer doing rapid post-earthquake triage (ATC-20 style), which "
        "picks exactly one level:", s["body"]))
    f.append(two_col_table(s, ["Level", "Meaning"], [
        (G, "No significant structural damage; appears safe to occupy."),
        (Y, "Possible/moderate damage; restricted use, short essential tasks only."),
        (R, "Serious damage or signs of collapse; unsafe, evacuate immediately."),
    ], c0=40 * mm))
    f.append(Paragraph(
        "The ground-motion context (MMI, PGA, PGV, period-matched spectral demand and "
        "soil class) is included in the prompt: strong shaking makes any reported damage "
        "weigh more, but shaking alone, with no observed damage, does not by itself force "
        "Red. The AI is conservative: when safety is uncertain, it does not choose green.",
        s["body"]))
    f.append(Paragraph("source: assessment.functions.ts — SYSTEM_PROMPT + buildPrompt()", s["src"]))

    f.append(Paragraph("How it combines — examples", s["h2"]))
    f.append(three_col_table(s, ["AI says", "Rule fired?", "Final result"], [
        ("Green", "URM -> forces Red", R),
        ("Yellow", "Liquefaction = YES", R),
        ("Green", "PGA 0.55g + crack = YES", R),
        ("Green", "9 floors", Y),
        ("Green", "PGA 0.30g (no damage)", Y),
        ("Yellow", "No rule fired", Y),
        ("Green", "No rule fired", G),
    ]))
    f.append(Paragraph("source: safety-rules.ts — maxRisk(a, b) returns the more severe", s["src"]))

    f.append(Paragraph("Sources and limits", s["h2"]))
    f.append(Paragraph(
        "• ATC-20 (Applied Technology Council): rapid post-earthquake inspection method.<br/>"
        "• USGS ShakeMap: official ground-motion grid for the active earthquake.<br/>"
        "• Unreinforced masonry (URM) vulnerability: established seismic literature.<br/>"
        "• AI vision model: google/gemini-2.5-flash via Lovable AI Gateway.", s["body"]))
    f.append(Paragraph(
        "Limits: this is preliminary guidance, not a certification. It only evaluates the "
        "visible items you report; it does not inspect hidden elements or inside walls. "
        "It does not replace a licensed structural engineer or Civil Protection.", s["body"]))
    return f


def footer(canvas, doc):
    canvas.saveState()
    canvas.setStrokeColor(LINE)
    canvas.line(20 * mm, 14 * mm, 190 * mm, 14 * mm)
    canvas.setFont(FONT, 8)
    canvas.setFillColor(MUTED)
    canvas.drawString(20 * mm, 9 * mm, "EvalúaYa · evaluaya.app")
    canvas.drawRightString(190 * mm, 9 * mm, "Page %d" % doc.page)
    canvas.restoreState()


def build(path, flow):
    doc = SimpleDocTemplate(
        path, pagesize=A4,
        leftMargin=20 * mm, rightMargin=20 * mm,
        topMargin=18 * mm, bottomMargin=20 * mm,
        title="EvalúaYa — technical spec",
    )
    doc.build(flow, onFirstPage=footer, onLaterPages=footer)
    print("wrote", path)


def main():
    s = styles()
    build(os.path.join(OUT_DIR, "evaluaya-spec-es.pdf"), content_es(s))
    build(os.path.join(OUT_DIR, "evaluaya-spec-en.pdf"), content_en(s))


if __name__ == "__main__":
    main()
