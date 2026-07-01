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

/**
 * Single resident-facing status email covering the whole help-request loop.
 * The `stage` prop drives the copy so we keep one template (one thing to keep
 * on-brand) instead of four near-identical files.
 */
export type ResidentStage =
  | "received"
  | "claimed"
  | "contacted"
  | "visited"
  | "resolved";

interface ResidentStatusUpdateProps {
  stage?: ResidentStage;
  location?: string;
  engineerName?: string;
  note?: string;
  trackingUrl?: string;
}

const BRAND = "#0f3443";

const STAGE_TITLE: Record<ResidentStage, string> = {
  received: "Recibimos tu solicitud",
  claimed: "Un voluntario tomó tu caso",
  contacted: "El voluntario te va a contactar",
  visited: "El voluntario avanzó con tu caso",
  resolved: "El voluntario marcó tu caso como atendido",
};

function stageBody(
  stage: ResidentStage,
  engineerName: string,
): string {
  const who = engineerName ? `${engineerName}` : "un evaluador voluntario";
  switch (stage) {
    case "received":
      return "Compartimos tu caso con la red de evaluadores voluntarios de tu zona. Es un servicio comunitario gratuito y hecho por voluntarios: si alguien está disponible cerca de ti, te escribirá directamente. No podemos garantizar una respuesta ni un tiempo específico, pero puedes seguir el estado de tu caso en cualquier momento.";
    case "claimed":
      return `${who} tomó tu caso y planea comunicarse contigo por WhatsApp. Mantén tu teléfono a la mano.`;
    case "contacted":
      return `${who} registró que se comunicó contigo. Si aún no lo has visto, revisa tus mensajes de WhatsApp.`;
    case "visited":
      return `${who} registró un avance en tu caso. Puedes ver los detalles en tu página de seguimiento.`;
    case "resolved":
      return `${who} marcó tu caso como atendido. Cuéntanos si de verdad quedó resuelto o si todavía necesitas ayuda — con un toque en tu página de seguimiento.`;
  }
}

const Email = ({
  stage = "received",
  location = "—",
  engineerName = "",
  note = "",
  trackingUrl = "https://evaluaya.app",
}: ResidentStatusUpdateProps) => {
  const title = STAGE_TITLE[stage] ?? STAGE_TITLE.received;
  const body = stageBody(stage, engineerName);
  const cta = stage === "resolved" ? "Responder sobre mi caso" : "Ver el estado de mi caso";

  return (
    <Html lang="es" dir="ltr">
      <Head />
      <Preview>{title} — EvalúaYa</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Text style={brandText}>EvalúaYa</Text>
            <Heading style={heading}>{title}</Heading>
          </Section>

          <Text style={intro}>{body}</Text>

          <Section style={card}>
            <Section style={location && note ? row : rowLast}>
              <Text style={rowLabel}>Ubicación</Text>
              <Text style={rowValue}>{location || "—"}</Text>
            </Section>
            {note ? (
              <Section style={rowLast}>
                <Text style={rowLabel}>Nota del voluntario</Text>
                <Text style={rowValue}>{note}</Text>
              </Section>
            ) : null}
          </Section>

          <Section style={{ textAlign: "center", marginTop: "24px" }}>
            <Link href={trackingUrl} style={button}>
              {cta}
            </Link>
          </Section>

          <Text style={tip}>
            EvalúaYa es una iniciativa comunitaria independiente. No es un ente
            oficial. En una emergencia, llama a Protección Civil o a los
            servicios de emergencia.
          </Text>

          <Hr style={hr} />
          <Text style={footer}>
            Recibes este correo porque solicitaste la orientación de un
            evaluador voluntario en EvalúaYa.
          </Text>
        </Container>
      </Body>
    </Html>
  );
};

export const template = {
  component: Email,
  subject: (data: Record<string, any>) => {
    const stage = (data.stage as ResidentStage) ?? "received";
    return `${STAGE_TITLE[stage] ?? STAGE_TITLE.received} — EvalúaYa`;
  },
  displayName: "Estado de tu solicitud (residente)",
  previewData: {
    stage: "claimed",
    location: "Chacao, Miranda",
    engineerName: "Carla",
    note: "",
    trackingUrl: "https://evaluaya.app/seguimiento/preview",
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
  marginTop: "12px",
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
