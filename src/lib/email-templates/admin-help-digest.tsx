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
  stage?: string | null;
  ageHours?: number | null;
}

interface AdminHelpDigestProps {
  openCount?: number;
  claimedCount?: number;
  stalledCount?: number;
  resolvedToday?: number;
  stalledItems?: DigestItem[];
  adminUrl?: string;
}

const BRAND = "#0f3443";

const RISK_LABEL: Record<string, string> = {
  red: "Riesgo alto",
  orange: "Riesgo serio",
  yellow: "Riesgo moderado",
  green: "Riesgo bajo",
};

const STAGE_LABEL: Record<string, string> = {
  claimed: "Reclamada",
  contacted: "Contactó",
  visited: "Visitó",
  resolved: "Resuelta",
};

const Email = ({
  openCount = 0,
  claimedCount = 0,
  stalledCount = 0,
  resolvedToday = 0,
  stalledItems = [],
  adminUrl = "https://evaluaya.app/admin/voluntarios",
}: AdminHelpDigestProps) => {
  return (
    <Html lang="es" dir="ltr">
      <Head />
      <Preview>
        Resumen de solicitudes: {stalledCount} estancadas, {openCount} abiertas —
        EvalúaYa
      </Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Text style={brandText}>EvalúaYa · Admin</Text>
            <Heading style={heading}>Resumen diario de matching</Heading>
          </Section>

          <Section style={statsRow}>
            <Section style={stat}>
              <Text style={statNum}>{openCount}</Text>
              <Text style={statLabel}>Abiertas</Text>
            </Section>
            <Section style={stat}>
              <Text style={statNum}>{claimedCount}</Text>
              <Text style={statLabel}>Reclamadas</Text>
            </Section>
            <Section style={stat}>
              <Text style={{ ...statNum, color: "#b42318" }}>
                {stalledCount}
              </Text>
              <Text style={statLabel}>Estancadas</Text>
            </Section>
            <Section style={stat}>
              <Text style={{ ...statNum, color: "#067647" }}>
                {resolvedToday}
              </Text>
              <Text style={statLabel}>Resueltas hoy</Text>
            </Section>
          </Section>

          {stalledItems.length > 0 ? (
            <>
              <Text style={sectionTitle}>
                Solicitudes estancadas (&gt;24h sin avance)
              </Text>
              <Section style={card}>
                {stalledItems.map((item, idx) => {
                  const loc =
                    [item.municipality, item.state].filter(Boolean).join(", ") ||
                    "—";
                  const isLast = idx === stalledItems.length - 1;
                  return (
                    <Section key={idx} style={isLast ? rowLast : row}>
                      <Text style={rowValue}>
                        {loc} ·{" "}
                        <span style={{ color: "#5b6b6f" }}>
                          {RISK_LABEL[item.riskLevel ?? ""] ?? "Sin clasificar"}
                        </span>
                      </Text>
                      <Text style={rowMeta}>
                        {STAGE_LABEL[item.stage ?? "claimed"] ?? "Reclamada"}
                        {item.ageHours != null
                          ? ` · ${Math.round(item.ageHours)}h sin avance`
                          : ""}
                      </Text>
                    </Section>
                  );
                })}
              </Section>
            </>
          ) : (
            <Text style={intro}>
              No hay solicitudes estancadas. Todo el matching está al día. 🎉
            </Text>
          )}

          <Section style={{ textAlign: "center", marginTop: "24px" }}>
            <Link href={adminUrl} style={button}>
              Abrir panel de admin
            </Link>
          </Section>

          <Hr style={hr} />
          <Text style={footer}>
            Resumen automático diario de la red de voluntarios de EvalúaYa.
          </Text>
        </Container>
      </Body>
    </Html>
  );
};

export const template = {
  component: Email,
  subject: (data: Record<string, any>) =>
    `Resumen de matching: ${data.stalledCount ?? 0} estancadas — EvalúaYa`,
  displayName: "Admin · Resumen diario de matching",
  to: "ajaegerman@thinkampersand.com",
  previewData: {
    openCount: 5,
    claimedCount: 3,
    stalledCount: 2,
    resolvedToday: 1,
    stalledItems: [
      {
        municipality: "Chacao",
        state: "Miranda",
        riskLevel: "red",
        stage: "claimed",
        ageHours: 31,
      },
      {
        municipality: "Baruta",
        state: "Miranda",
        riskLevel: "orange",
        stage: "contacted",
        ageHours: 48,
      },
    ],
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
const statsRow = {
  marginTop: "16px",
  textAlign: "center" as const,
};
const stat = {
  display: "inline-block" as const,
  width: "24%",
  verticalAlign: "top" as const,
};
const statNum = {
  color: BRAND,
  fontSize: "24px",
  fontWeight: "bold",
  margin: "0",
};
const statLabel = {
  color: "#5b6b6f",
  fontSize: "11px",
  margin: "2px 0 0",
};
const sectionTitle = {
  color: "#111827",
  fontSize: "14px",
  fontWeight: "bold",
  marginTop: "24px",
  marginBottom: "8px",
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
};
const row = { margin: "0", padding: "8px 0", borderBottom: "1px solid #e2eaec" };
const rowLast = { margin: "0", padding: "8px 0" };
const rowValue = { color: "#111827", fontSize: "14px", margin: "0" };
const rowMeta = {
  color: "#5b6b6f",
  fontSize: "12px",
  margin: "2px 0 0",
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
const hr = { borderColor: "#e2eaec", margin: "24px 0 12px" };
const footer = {
  color: "#8a979b",
  fontSize: "11px",
  lineHeight: "16px",
  textAlign: "center" as const,
};
