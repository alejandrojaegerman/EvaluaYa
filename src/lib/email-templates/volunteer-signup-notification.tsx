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

interface VolunteerSignupNotificationProps {
  /** "individual" | "organization" */
  volunteerType?: string;
  name?: string;
  organization?: string;
  contactName?: string;
  whatsapp?: string;
  email?: string;
  states?: string;
  specialization?: string;
  note?: string;
  adminUrl?: string;
}

const BRAND = "#0f3443";

const Email = ({
  volunteerType = "individual",
  name = "—",
  organization = "",
  contactName = "",
  whatsapp = "—",
  email = "",
  states = "—",
  specialization = "",
  note = "",
  adminUrl = "https://evaluaya.app/admin/voluntarios",
}: VolunteerSignupNotificationProps) => {
  const isOrg = volunteerType === "organization";
  const typeLabel = isOrg ? "Organización" : "Ingeniero(a) individual";
  const displayName = isOrg && organization ? organization : name;

  return (
    <Html lang="es" dir="ltr">
      <Head />
      <Preview>
        Nueva inscripción de voluntario en EvalúaYa: {displayName}
      </Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Text style={brandText}>EvalúaYa</Text>
            <Heading style={heading}>Nueva inscripción de voluntario</Heading>
          </Section>

          <Section style={card}>
            <Row label="Tipo" value={typeLabel} />
            {isOrg && organization ? (
              <Row label="Organización" value={organization} />
            ) : null}
            <Row label={isOrg ? "Persona de contacto" : "Nombre"} value={isOrg ? contactName || name : name} />
            <Row label="Cobertura" value={states} />
            <Row label="WhatsApp" value={whatsapp} />
            {email ? <Row label="Email" value={email} /> : null}
            {specialization ? (
              <Row label="Especialización" value={specialization} />
            ) : null}
            {note ? <Row label="Nota" value={note} /> : null}
          </Section>

          <Section style={{ textAlign: "center", marginTop: "24px" }}>
            <Link href={adminUrl} style={button}>
              Revisar en el panel de administración
            </Link>
          </Section>

          <Hr style={hr} />
          <Text style={footer}>
            Estás recibiendo este aviso porque administras las inscripciones de
            voluntarios de EvalúaYa.
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
  subject: (data: Record<string, any>) =>
    `Nueva inscripción de voluntario: ${
      (data.volunteerType === "organization" && data.organization) ||
      data.name ||
      "EvalúaYa"
    }`,
  displayName: "Aviso de inscripción de voluntario",
  to: "ajaegerman@thinkampersand.com",
  previewData: {
    volunteerType: "organization",
    name: "Marisol Gil",
    organization: "Constructora ROMACA",
    contactName: "Marisol Gil",
    whatsapp: "+58 424-1418355",
    email: "",
    states: "Distrito Capital",
    specialization: "",
    note: "",
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
const card = {
  backgroundColor: "#f1f6f7",
  borderRadius: "12px",
  padding: "8px 16px",
  marginTop: "16px",
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
const button = {
  backgroundColor: BRAND,
  color: "#ffffff",
  padding: "12px 22px",
  borderRadius: "10px",
  textDecoration: "none",
  fontSize: "15px",
  fontWeight: "bold",
  display: "inline-block",
};
const hr = { borderColor: "#e2eaec", margin: "24px 0 12px" };
const footer = { color: "#8a989c", fontSize: "12px", textAlign: "center" as const, margin: "0" };
