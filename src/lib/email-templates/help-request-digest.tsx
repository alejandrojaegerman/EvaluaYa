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

interface DigestItem {
  municipality?: string | null;
  state?: string | null;
  riskLevel?: string | null;
  createdAt?: string | null;
}

interface HelpRequestDigestProps {
  engineerName?: string;
  openCount?: number;
  items?: DigestItem[];
  panelUrl?: string;
}

const BRAND = "#0f3443";

const RISK_LABEL: Record<string, string> = {
  red: "Riesgo alto",
  orange: "Riesgo serio",
  yellow: "Riesgo moderado",
  green: "Riesgo bajo",
};

const RISK_COLOR: Record<string, string> = {
  red: "#b42318",
  orange: "#c2410c",
  yellow: "#b54708",
  green: "#067647",
};

const Email = ({
  engineerName = "",
  openCount = 0,
  items = [],
  panelUrl = "https://evaluaya.app/voluntarios",
}: HelpRequestDigestProps) => {
  return (
    <Html lang="es" dir="ltr">
      <Head />
      <Preview>
        {`${openCount} solicitud(es) de ayuda abierta(s) en tu zona — EvalúaYa`}
      </Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Text style={brandText}>EvalúaYa</Text>
            <Heading style={heading}>
              Resumen diario de solicitudes abiertas
            </Heading>
          </Section>

          <Text style={intro}>
            {engineerName ? `Hola ${engineerName}, ` : "Hola, "}
            actualmente hay <strong>{openCount}</strong> solicitud(es) de ayuda
            abierta(s) en las zonas que cubres y que aún esperan a un
            ingeniero(a).
          </Text>

          <Section style={card}>
            {items.slice(0, 8).map((it, i) => {
              const label = it.riskLevel
                ? (RISK_LABEL[it.riskLevel] ?? "Sin clasificar")
                : "Sin clasificar";
              const color = it.riskLevel
                ? (RISK_COLOR[it.riskLevel] ?? "#5b6b6f")
                : "#5b6b6f";
              const loc = it.municipality
                ? `${it.municipality}${it.state ? `, ${it.state}` : ""}`
                : it.state || "Ubicación no indicada";
              return (
                <Section
                  key={i}
                  style={i === items.length - 1 ? rowLast : row}
                >
                  <Text style={rowValue}>{loc}</Text>
                  <Text style={{ ...rowLabel, color, fontWeight: "bold" }}>
                    {label}
                  </Text>
                </Section>
              );
            })}
          </Section>

          <Section style={{ textAlign: "center", marginTop: "24px" }}>
            <Link href={panelUrl} style={button}>
              Ver y atender en tu panel
            </Link>
          </Section>

          <Text style={tip}>
            En tu panel puedes asignarte una solicitud, escribir al residente por
            WhatsApp, reportar tu progreso y validar la evaluación de la app.
          </Text>

          <Hr style={hr} />
          <Text style={footer}>
            Recibes este resumen porque eres un(a) voluntario(a) aprobado(a) de
            EvalúaYa con solicitudes abiertas en tu zona.
          </Text>
        </Container>
      </Body>
    </Html>
  );
};

export const template = {
  component: Email,
  subject: (data: Record<string, any>) =>
    `${data.openCount ?? 0} solicitud(es) de ayuda abierta(s) en tu zona — EvalúaYa`,
  displayName: "Resumen diario de solicitudes",
  previewData: {
    engineerName: "Carla",
    openCount: 3,
    items: [
      { municipality: "Chacao", state: "Miranda", riskLevel: "red" },
      { municipality: "Baruta", state: "Miranda", riskLevel: "orange" },
      { municipality: "Libertador", state: "Distrito Capital", riskLevel: "yellow" },
    ],
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
  margin: "2px 0 0",
};
const rowValue = {
  color: "#111827",
  fontSize: "14px",
  margin: "0",
  fontWeight: "bold" as const,
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
