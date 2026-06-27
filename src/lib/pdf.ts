import { jsPDF } from "jspdf";

import type { AssessmentRecord } from "./assessment-types";
import { translate, type Lang } from "./i18n";
import { formatDateTime } from "./datetime";
import { RISK_HEX } from "./risk";

/**
 * Generate a one-page PDF summary of an assessment and trigger a download.
 * Runs entirely client-side so it works without re-contacting the server.
 */
export async function downloadAssessmentPdf(record: AssessmentRecord) {
  const lang = record.language as Lang;
  const t = (k: string) => translate(lang, k);

  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const margin = 48;
  const contentW = pageW - margin * 2;
  let y = margin;

  const addSpace = (n: number) => {
    y += n;
  };

  // Header
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.setTextColor(20, 30, 40);
  doc.text("EvalúaYa", margin, y);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(12);
  doc.setTextColor(90, 100, 110);
  addSpace(20);
  doc.text(t("pdf.title"), margin, y);
  addSpace(10);
  doc.setDrawColor(220, 224, 228);
  doc.line(margin, y, pageW - margin, y);
  addSpace(26);

  // Risk banner
  const [r, g, b] = RISK_HEX[record.riskLevel];
  doc.setFillColor(r, g, b);
  doc.roundedRect(margin, y - 6, contentW, 46, 8, 8, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text(t(`result.${record.riskLevel}.tag`), margin + 16, y + 14);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(12);
  doc.text(t(`result.${record.riskLevel}.action`), margin + 16, y + 31);
  addSpace(64);

  doc.setTextColor(40, 48, 56);

  const heading = (label: string) => {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(20, 30, 40);
    doc.text(label, margin, y);
    addSpace(16);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.setTextColor(55, 63, 71);
  };

  const paragraph = (text: string) => {
    const lines = doc.splitTextToSize(text, contentW);
    doc.text(lines, margin, y);
    addSpace(lines.length * 14 + 6);
  };

  const bullets = (items: string[]) => {
    for (const item of items) {
      const lines = doc.splitTextToSize(`•  ${item}`, contentW - 6);
      doc.text(lines, margin + 4, y);
      addSpace(lines.length * 14 + 4);
    }
    addSpace(4);
  };

  // Property
  const ageMap: Record<string, string> = {
    pre1970: t("property.age.pre1970"),
    "1970to2000": t("property.age.1970to2000"),
    post2000: t("property.age.post2000"),
  };
  heading(t("pdf.property"));
  const propLine = [
    t(`property.type.${record.property.buildingType}`),
    `${record.property.floors} ${lang === "es" ? "piso(s)" : "floor(s)"}`,
    ageMap[record.property.age],
  ].join(" · ");
  paragraph(record.property.address ? `${record.property.address}\n${propLine}` : propLine);

  // Seismic context (USGS ShakeMap) — only when location data is present
  const sp = record.property;
  if (typeof sp.seismicIntensity === "number") {
    heading(t("result.seismicContext"));
    const rows: Array<[string, string]> = [
      [
        t("result.mmi"),
        `${sp.seismicIntensityRoman ?? ""} (${sp.seismicIntensity})`.trim(),
      ],
    ];
    if (typeof sp.pga === "number")
      rows.push([t("result.pga"), `${(sp.pga * 100).toFixed(0)}%g`]);
    if (typeof sp.pgv === "number")
      rows.push([t("result.pgv"), `${sp.pgv.toFixed(0)} cm/s`]);
    if (typeof sp.spectralDemand === "number")
      rows.push([
        t("result.spectralDemand"),
        `${(sp.spectralDemand * 100).toFixed(0)}%g${
          sp.spectralBand ? ` · SA(${sp.spectralBand})` : ""
        }`,
      ]);
    if (sp.soilClass) rows.push([t("result.soil"), t(`soil.${sp.soilClass}`)]);
    for (const [label, value] of rows) {
      const lines = doc.splitTextToSize(`•  ${label}: ${value}`, contentW - 6);
      doc.text(lines, margin + 4, y);
      addSpace(lines.length * 14 + 2);
    }
    addSpace(6);
  }


  // Summary
  if (record.aiResult.summary) {
    heading(t("pdf.summary"));
    paragraph(record.aiResult.summary);
  }

  // Findings
  if (record.aiResult.findings.length) {
    heading(t("pdf.findings"));
    bullets(record.aiResult.findings);
  }

  // Next steps
  if (record.aiResult.next_steps.length) {
    heading(t("pdf.nextSteps"));
    bullets(record.aiResult.next_steps);
  }

  // Inspection answers
  heading(t("pdf.inspection"));
  for (const a of record.answers) {
    const area = t(`item.${a.id}.area`);
    const ans = t(`checklist.answer.${a.value}`);
    const lines = doc.splitTextToSize(`•  ${area}: ${ans}`, contentW - 6);
    doc.text(lines, margin + 4, y);
    addSpace(lines.length * 14 + 2);
  }

  // Photos — embedded so the downloadable PDF is self-contained evidence the
  // resident can hand to an engineer or authority.
  const photoItems: { area: string; url: string }[] = [];
  for (const a of record.answers) {
    const urls = record.photoUrls[a.id];
    if (urls && urls.length) {
      for (const url of urls) {
        photoItems.push({ area: t(`item.${a.id}.area`), url });
      }
    }
  }

  if (photoItems.length) {
    const pageH = doc.internal.pageSize.getHeight();
    const ensureSpace = (needed: number) => {
      if (y + needed > pageH - 64) {
        doc.addPage();
        y = margin;
      }
    };
    ensureSpace(40);
    heading(t("pdf.photos"));

    const gap = 12;
    const cellW = (contentW - gap) / 2;
    const imgH = 96;
    const rowH = imgH + 18 + gap;
    let col = 0;
    let rowTop = y;

    for (const item of photoItems) {
      const img = await loadImage(item.url);
      if (!img) continue;
      if (col === 0) {
        ensureSpace(rowH);
        rowTop = y;
      }
      const x = margin + col * (cellW + gap);
      const scale = Math.min(cellW / img.w, imgH / img.h);
      const dw = img.w * scale;
      const dh = img.h * scale;
      const dx = x + (cellW - dw) / 2;
      const dy = rowTop + (imgH - dh) / 2;
      let drawn = true;
      try {
        doc.addImage(img.dataUrl, img.format, dx, dy, dw, dh);
      } catch {
        drawn = false;
      }
      if (!drawn) continue;
      doc.setFontSize(9);
      doc.setTextColor(90, 100, 110);
      const cap = doc.splitTextToSize(item.area, cellW);
      doc.text(cap[0], x, rowTop + imgH + 11);
      col += 1;
      if (col === 2) {
        col = 0;
        y = rowTop + rowH;
      }
    }
    if (col === 1) {
      y = rowTop + rowH;
    }
    addSpace(4);
  }

  // Footer
  const footerY = doc.internal.pageSize.getHeight() - 36;
  doc.setDrawColor(220, 224, 228);
  doc.line(margin, footerY - 14, pageW - margin, footerY - 14);
  doc.setFontSize(9);
  doc.setTextColor(120, 128, 136);
  const date = formatDateTime(record.createdAt, lang);
  doc.text(`${t("result.assessedOn")} ${date}`, margin, footerY);
  doc.text(t("result.disclaimerShort"), margin, footerY + 12, {
    maxWidth: contentW,
  });

  doc.save(`evaluaya-${record.publicId}.pdf`);
}

type LoadedImage = { dataUrl: string; format: "JPEG" | "PNG"; w: number; h: number };

/**
 * Fetch a signed photo URL and decode it client-side into a data URL plus
 * intrinsic dimensions so jsPDF can embed it. Returns null on any failure so
 * the PDF always generates even if a photo can't be loaded.
 */
async function loadImage(url: string): Promise<LoadedImage | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const blob = await res.blob();
    const format: "JPEG" | "PNG" = blob.type === "image/png" ? "PNG" : "JPEG";
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const fr = new FileReader();
      fr.onload = () => resolve(fr.result as string);
      fr.onerror = () => reject(new Error("read failed"));
      fr.readAsDataURL(blob);
    });
    const dims = await new Promise<{ w: number; h: number }>((resolve, reject) => {
      const im = new Image();
      im.onload = () => resolve({ w: im.naturalWidth, h: im.naturalHeight });
      im.onerror = () => reject(new Error("decode failed"));
      im.src = dataUrl;
    });
    if (!dims.w || !dims.h) return null;
    return { dataUrl, format, w: dims.w, h: dims.h };
  } catch {
    return null;
  }
}
