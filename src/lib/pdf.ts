import { jsPDF } from "jspdf";

import type { AssessmentRecord } from "./assessment-types";
import { translate, type Lang } from "./i18n";
import { RISK_HEX } from "./risk";

/**
 * Generate a one-page PDF summary of an assessment and trigger a download.
 * Runs entirely client-side so it works without re-contacting the server.
 */
export function downloadAssessmentPdf(record: AssessmentRecord) {
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

  // Footer
  const footerY = doc.internal.pageSize.getHeight() - 36;
  doc.setDrawColor(220, 224, 228);
  doc.line(margin, footerY - 14, pageW - margin, footerY - 14);
  doc.setFontSize(9);
  doc.setTextColor(120, 128, 136);
  const date = new Date(record.createdAt).toLocaleString(
    lang === "es" ? "es-VE" : "en-US",
  );
  doc.text(`${t("result.assessedOn")} ${date}`, margin, footerY);
  doc.text(t("result.disclaimerShort"), margin, footerY + 12, {
    maxWidth: contentW,
  });

  doc.save(`evaluaya-${record.publicId}.pdf`);
}
