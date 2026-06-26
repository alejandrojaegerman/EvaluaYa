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

interface VolunteerApprovedProps {
  name?: string;
  states?: string;
  panelUrl?: string;
}

const BRAND = "#0f3443";

const Email = ({
  name = "",
  states = "",
  panelUrl = "https://evaluaya.app/voluntarios",
}: VolunteerApprovedProps) => {
  return (
    <Html lang="es" dir="ltr">
      <Head />
      <Preview>Tu inscripción como voluntario fue validada — EvalúaYa</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Text style={brandText}>EvalúaYa</Text>
            <Heading style={heading}>¡Tu inscripción fue validada!</Heading>
          </Section>

          <Text style={intro}>
            {name ? `Hola ${name}, ` : "Hola, "}
            ¡buenas noticias! Revisamos tu inscripción como voluntario(a) y ya
            estás aprobado(a) en EvalúaYa.
            {states
              ? ` Desde tu panel privado podrás ver y atender solicitudes de ayuda en: ${states}.`
              : " Desde tu panel privado podrás ver y atender solicitudes de ayuda en tu zona."}
          </Text>

          <Section style={{ textAlign: "center", marginTop: "24px" }}>
            <Link href={panelUrl} style={button}>
              Abrir mi panel de voluntario
            </Link>
          </Section>

          <Text style={tip}>
            Guarda este enlace: es personal, no requiere contraseña y te lleva
            directo a tu panel para atender solicitudes por WhatsApp.
          </Text>

          <Hr style={hr} />
          <Text style={footer}>
            Recibes este correo porque te inscribiste como voluntario(a) en
            EvalúaYa y tu solicitud fue aprobada.
          </Text>
        </Container>
      </Body>
    </Html>
  );
};

export const template = {
  component: Email,
  subject: "Tu inscripción como voluntario fue validada — EvalúaYa",
  displayName: "Voluntario aprobado",
  previewData: {
    name: "María",
    states: "Miranda, Distrito Capital",
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
