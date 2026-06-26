import * as React from "react";
import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";

import type { TemplateEntry } from "./registry";

interface FeedbackNotificationProps {
  message?: string;
  email?: string;
  page?: string;
  language?: string;
}

const BRAND = "#0f3443";

const Email = ({
  message = "—",
  email = "",
  page = "—",
  language = "—",
}: FeedbackNotificationProps) => {
  return (
    <Html lang="es" dir="ltr">
      <Head />
      <Preview>Nuevo comentario de un usuario de EvalúaYa</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Text style={brandText}>EvalúaYa</Text>
            <Heading style={heading}>Nuevo comentario recibido</Heading>
          </Section>

          <Section style={card}>
            <Text style={messageLabel}>Mensaje</Text>
            <Text style={messageValue}>{message}</Text>
          </Section>

          <Section style={metaCard}>
            <Row label="Responder a" value={email || "No proporcionó email"} />
            <Row label="Página" value={page} />
            <Row label="Idioma" value={language} />
          </Section>

          <Hr style={hr} />
          <Text style={footer}>
            Estás recibiendo este aviso porque administras EvalúaYa. Si el
            usuario dejó su email, puedes responderle directamente.
          </Text>
        </Container>
      </Body>
    </Html>
  );
};

function Row({ label, value }: { label: string; value: string }) {
  return (
    <Section style={row}>
      <Text style={rowLabel}>{label}</Text>
      <Text style={rowValue}>{value || "—"}</Text>
    </Section>
  );
}

export const template = {
  component: Email,
  subject: "Nuevo comentario en EvalúaYa",
  displayName: "Aviso de comentario de usuario",
  to: "ajaegerman@thinkampersand.com",
  previewData: {
    message:
      "Me encantó la app, pero me gustaría poder descargar el reporte sin conexión.",
    email: "vecino@example.com",
    page: "/a/abc123",
    language: "es",
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
const card = {
  backgroundColor: "#f1f6f7",
  borderRadius: "12px",
  padding: "16px",
  marginTop: "16px",
};
const messageLabel = {
  color: "#5b6b6f",
  fontSize: "12px",
  textTransform: "uppercase" as const,
  margin: "0 0 6px",
  letterSpacing: "0.4px",
};
const messageValue = {
  color: "#111827",
  fontSize: "15px",
  lineHeight: "1.6",
  margin: "0",
  whiteSpace: "pre-wrap" as const,
};
const metaCard = {
  backgroundColor: "#f1f6f7",
  borderRadius: "12px",
  padding: "8px 16px",
  marginTop: "12px",
};
const row = { margin: "0", padding: "8px 0", borderBottom: "1px solid #e2eaec" };
const rowLabel = {
  color: "#5b6b6f",
  fontSize: "12px",
  textTransform: "uppercase" as const,
  margin: "0 0 2px",
  letterSpacing: "0.4px",
};
const rowValue = { color: "#111827", fontSize: "15px", margin: "0" };
const hr = { borderColor: "#e2eaec", margin: "24px 0 12px" };
const footer = {
  color: "#8a989c",
  fontSize: "12px",
  textAlign: "center" as const,
  margin: "0",
};
