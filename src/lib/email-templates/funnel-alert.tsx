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

interface FunnelAlertProps {
  recentStarted?: number;
  recentResult?: number;
  recentConversion?: number;
  baselineConversion?: number;
  windowLabel?: string;
  worstStepLabel?: string | null;
  adminUrl?: string;
}

const BRAND = "#0f3443";

const Email = ({
  recentStarted = 0,
  recentResult = 0,
  recentConversion = 0,
  baselineConversion = 0,
  windowLabel = "últimas 3 horas",
  worstStepLabel = null,
  adminUrl = "https://evaluaya.app/admin",
}: FunnelAlertProps) => {
  return (
    <Html lang="es" dir="ltr">
      <Head />
      <Preview>
        {`Posible caída en el flujo de evaluación: ${recentConversion}% vs ${baselineConversion}% habitual — EvalúaYa`}
      </Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Text style={brandText}>EvalúaYa · Admin</Text>
            <Heading style={heading}>⚠️ Caída en el flujo de evaluación</Heading>
          </Section>

          <Text style={intro}>
            La conversión del flujo de evaluación bajó respecto a lo habitual en
            las {windowLabel}. Esto sugiere un problema en el flujo, no solo menos
            tráfico. Vale la pena revisarlo.
          </Text>

          <Section style={statsRow}>
            <Section style={stat}>
              <Text style={{ ...statNum, color: "#b42318" }}>
                {recentConversion}%
              </Text>
              <Text style={statLabel}>Conversión reciente</Text>
            </Section>
            <Section style={stat}>
              <Text style={statNum}>{baselineConversion}%</Text>
              <Text style={statLabel}>Conversión habitual (7d)</Text>
            </Section>
            <Section style={stat}>
              <Text style={statNum}>{recentStarted}</Text>
              <Text style={statLabel}>Iniciaron</Text>
            </Section>
            <Section style={stat}>
              <Text style={statNum}>{recentResult}</Text>
              <Text style={statLabel}>Completaron</Text>
            </Section>
          </Section>

          {worstStepLabel ? (
            <Text style={intro}>
              Mayor caída entre pasos:{" "}
              <span style={{ fontWeight: "bold", color: "#111827" }}>
                {worstStepLabel}
              </span>
              .
            </Text>
          ) : null}

          <Section style={{ textAlign: "center", marginTop: "24px" }}>
            <Link href={adminUrl} style={button}>
              Ver el embudo en el panel
            </Link>
          </Section>

          <Hr style={hr} />
          <Text style={footer}>
            Alerta automática del embudo de evaluación de EvalúaYa. Se envía como
            máximo una vez por hora.
          </Text>
        </Container>
      </Body>
    </Html>
  );
};

export const template = {
  component: Email,
  subject: (data: Record<string, any>) =>
    `⚠️ Caída en el flujo de evaluación: ${data.recentConversion ?? 0}% vs ${data.baselineConversion ?? 0}% — EvalúaYa`,
  displayName: "Admin · Alerta de caída del embudo",
  to: "ajaegerman@thinkampersand.com",
  previewData: {
    recentStarted: 22,
    recentResult: 2,
    recentConversion: 9,
    baselineConversion: 36,
    windowLabel: "últimas 3 horas",
    worstStepLabel: "Lista de revisión",
    adminUrl: "https://evaluaya.app/admin",
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
const statsRow = { marginTop: "16px", textAlign: "center" as const };
const stat = {
  display: "inline-block" as const,
  width: "24%",
  verticalAlign: "top" as const,
};
const statNum = { color: BRAND, fontSize: "24px", fontWeight: "bold", margin: "0" };
const statLabel = { color: "#5b6b6f", fontSize: "11px", margin: "2px 0 0" };
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
