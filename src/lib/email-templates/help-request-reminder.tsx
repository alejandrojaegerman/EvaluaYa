import * as React from "react";
import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from "@react-email/components";

import type { TemplateEntry } from "./registry";

interface HelpRequestReminderProps {
  engineerName?: string;
  /** "green" | "yellow" | "orange" | "red" */
  riskLevel?: string;
  location?: string;
  /** Current lifecycle stage label, e.g. "Reclamada", "Contactado". */
  stageLabel?: string;
  /** How long the request has been sitting at this stage, e.g. "2 días". */
  waitingLabel?: string;
  /** 1, 2, or 3 — which staged reminder this is. */
  reminderNumber?: number;
  panelUrl?: string;
}

const BRAND = "#0f3443";

const RISK_LABEL: Record<string, string> = {
  red: "Riesgo alto (rojo)",
  orange: "Riesgo moderado-serio (naranja)",
  yellow: "Riesgo moderado (amarillo)",
  green: "Riesgo bajo (verde)",
};

const RISK_COLOR: Record<string, string> = {
  red: "#b42318",
  orange: "#c2410c",
  yellow: "#b54708",
  green: "#067647",
};

const Email = ({
  engineerName = "",
  riskLevel = "",
  location = "—",
  stageLabel = "Reclamada",
  waitingLabel = "",
  reminderNumber = 1,
  panelUrl = "https://evaluaya.app/voluntarios",
}: HelpRequestReminderProps) => {
  const riskText = RISK_LABEL[riskLevel] ?? "Sin clasificar";
  const riskColor = RISK_COLOR[riskLevel] ?? "#5b6b6f";
  const isFinal = reminderNumber >= 3;

  return (
    <Html lang="es" dir="ltr">
      <Head />
      <Preview>
        Recordatorio: una solicitud en {location} espera tu seguimiento
      </Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Text style={brandText}>EvalúaYa</Text>
            <Heading style={heading}>
              {isFinal
                ? "Última nota: esta solicitud podría reabrirse"
                : "Una familia espera tu seguimiento"}
            </Heading>
          </Section>

          <Text style={intro}>
            {engineerName ? `Hola ${engineerName}, ` : "Hola, "}
            tomaste una solicitud de ayuda que aún no ha avanzado. Un paso corto
            de tu parte puede dar mucha tranquilidad a esta familia.
          </Text>

          <Section style={card}>
            <Section style={row}>
              <Text style={rowLabel}>Ubicación</Text>
              <Text style={rowValue}>{location || "—"}</Text>
            </Section>
            <Section style={row}>
              <Text style={rowLabel}>Nivel de riesgo</Text>
              <Text style={{ ...rowValue, color: riskColor, fontWeight: "bold" }}>
                {riskText}
              </Text>
            </Section>
            <Section style={row}>
              <Text style={rowLabel}>Estado actual</Text>
              <Text style={rowValue}>{stageLabel}</Text>
            </Section>
            {waitingLabel ? (
              <Section style={rowLast}>
                <Text style={rowLabel}>En espera</Text>
                <Text style={rowValue}>{waitingLabel}</Text>
              </Section>
            ) : null}
          </Section>

          <Section style={{ textAlign: "center", marginTop: "24px" }}>
            <Link href={panelUrl} style={button}>
              Actualizar el avance
            </Link>
          </Section>

          <Text style={tip}>
            {isFinal
              ? "Si no puedes continuar, no pasa nada: la solicitud volverá a la lista para que otro(a) voluntario(a) pueda ayudar."
              : "Con un toque puedes marcar “Contacté”, “Visité” o “Resuelto”, o escribir al residente por WhatsApp."}
          </Text>

          <Hr style={hr} />
          <Text style={footer}>
            Recibes este recordatorio porque tomaste esta solicitud en EvalúaYa.
            Gracias por tu tiempo y tu compromiso. ❤️ 🇻🇪
          </Text>
        </Container>
      </Body>
    </Html>
  );
};

export const template = {
  component: Email,
  subject: (data: Record<string, any>) =>
    (data.reminderNumber ?? 1) >= 3
      ? `Última nota sobre una solicitud${data.location ? ` en ${data.location}` : ""} — EvalúaYa`
      : `Recordatorio: una solicitud${data.location ? ` en ${data.location}` : ""} espera tu seguimiento — EvalúaYa`,
  displayName: "Recordatorio de solicitud",
  previewData: {
    engineerName: "Carla",
    riskLevel: "orange",
    location: "Chacao, Miranda",
    stageLabel: "Reclamada",
    waitingLabel: "2 días",
    reminderNumber: 1,
    panelUrl: "https://evaluaya.app/voluntarios/panel/preview",
  },
} satisfies TemplateEntry;

const main = { backgroundColor: "#ffffff", fontFamily: "Arial, sans-serif" };
const container = { padding: "24px", maxWidth: "560px", margin: "0 auto" };
const header = { textAlign: "center" as const, marginBottom: "8px" };
const brandText = {
  color: BRAND,
  fontSize: "20px",
  fontWeight: "bold",
  margin: "0 0 4px",
  letterSpacing: "0.5px",
};
const heading = {
  color: "#111827",
  fontSize: "18px",
  fontWeight: "bold",
  margin: "0",
};
const intro = {
  color: "#374151",
  fontSize: "14px",
  lineHeight: "22px",
  marginTop: "16px",
};
const card = {
  backgroundColor: "#f1f6f7",
  borderRadius: "12px",
  padding: "8px 16px",
  marginTop: "8px",
};
const row = { margin: "0", padding: "8px 0", borderBottom: "1px solid #e2eaec" };
const rowLast = { margin: "0", padding: "8px 0" };
const rowLabel = {
  color: "#5b6b6f",
  fontSize: "12px",
  textTransform: "uppercase" as const,
  letterSpacing: "0.4px",
  margin: "0 0 2px",
};
const rowValue = {
  color: "#111827",
  fontSize: "14px",
  margin: "0",
};
const button = {
  backgroundColor: BRAND,
  borderRadius: "10px",
  color: "#ffffff",
  display: "inline-block",
  fontSize: "14px",
  fontWeight: "bold",
  padding: "12px 24px",
  textDecoration: "none",
};
const tip = {
  color: "#5b6b6f",
  fontSize: "12px",
  lineHeight: "18px",
  marginTop: "16px",
  textAlign: "center" as const,
};
const hr = { borderColor: "#e2eaec", margin: "24px 0 12px" };
const footer = {
  color: "#8a979b",
  fontSize: "11px",
  lineHeight: "16px",
  textAlign: "center" as const,
};
