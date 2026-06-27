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

interface AdminHelpNewProps {
  /** "green" | "yellow" | "orange" | "red" */
  riskLevel?: string;
  location?: string;
  note?: string;
  adminUrl?: string;
}

const BRAND = "#0f3443";

const RISK_LABEL: Record<string, string> = {
  red: "Riesgo alto (rojo)",
  orange: "Riesgo serio (naranja)",
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
  riskLevel = "",
  location = "—",
  note = "",
  adminUrl = "https://evaluaya.app/admin/voluntarios",
}: AdminHelpNewProps) => {
  const riskText = RISK_LABEL[riskLevel] ?? "Sin clasificar";
  const riskColor = RISK_COLOR[riskLevel] ?? "#5b6b6f";

  return (
    <Html lang="es" dir="ltr">
      <Head />
      <Preview>Nueva solicitud de ayuda en {location} — EvalúaYa</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Text style={brandText}>EvalúaYa · Admin</Text>
            <Heading style={heading}>Nueva solicitud de ayuda</Heading>
          </Section>

          <Text style={intro}>
            Un residente solicitó la orientación de un ingeniero(a) voluntario(a).
            Los ingenieros de la zona ya fueron notificados.
          </Text>

          <Section style={card}>
            <Section style={row}>
              <Text style={rowLabel}>Ubicación</Text>
              <Text style={rowValue}>{location || "—"}</Text>
            </Section>
            <Section style={note ? row : rowLast}>
              <Text style={rowLabel}>Nivel de riesgo</Text>
              <Text style={{ ...rowValue, color: riskColor, fontWeight: "bold" }}>
                {riskText}
              </Text>
            </Section>
            {note ? (
              <Section style={rowLast}>
                <Text style={rowLabel}>Nota del residente</Text>
                <Text style={rowValue}>{note}</Text>
              </Section>
            ) : null}
          </Section>

          <Section style={{ textAlign: "center", marginTop: "24px" }}>
            <Link href={adminUrl} style={button}>
              Ver en el panel de admin
            </Link>
          </Section>

          <Hr style={hr} />
          <Text style={footer}>
            Recibes este aviso porque administras la red de voluntarios de
            EvalúaYa.
          </Text>
        </Container>
      </Body>
    </Html>
  );
};

export const template = {
  component: Email,
  subject: (data: Record<string, any>) =>
    `Nueva solicitud de ayuda${data.location ? ` en ${data.location}` : ""} — EvalúaYa`,
  displayName: "Admin · Nueva solicitud de ayuda",
  to: "ajaegerman@thinkampersand.com",
  previewData: {
    riskLevel: "red",
    location: "Chacao, Miranda",
    note: "Hay grietas grandes en una columna del primer piso.",
    adminUrl: "https://evaluaya.app/admin/voluntarios",
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
const rowValue = { color: "#111827", fontSize: "14px", margin: "0" };
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
const hr = { borderColor: "#e2eaec", margin: "24px 0 12px" };
const footer = {
  color: "#8a979b",
  fontSize: "11px",
  lineHeight: "16px",
  textAlign: "center" as const,
};
