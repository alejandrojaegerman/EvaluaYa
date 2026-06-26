import * as React from 'react'

import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from '@react-email/components'

interface RecoveryEmailProps {
  siteName?: string
  confirmationUrl: string
}

export const RecoveryEmail = ({ confirmationUrl }: RecoveryEmailProps) => (
  <Html lang="es" dir="ltr">
    <Head />
    <Preview>Restablece tu acceso en EvalúaYa</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={header}>
          <Text style={brand}>EvalúaYa</Text>
          <Text style={brandSub}>Evaluación estructural tras un sismo</Text>
        </Section>
        <Section style={card}>
          <Heading style={h1}>Restablece tu acceso</Heading>
          <Text style={text}>
            Recibimos una solicitud para restablecer el acceso a tu cuenta de
            EvalúaYa. Toca el botón para continuar.
          </Text>
          <Button style={button} href={confirmationUrl}>
            Restablecer acceso
          </Button>
          <Text style={footer}>
            Si no lo solicitaste, ignora este correo; tu cuenta no cambiará.
          </Text>
          <Hr style={hr} />
          <Text style={textEn}>
            <strong>In English:</strong> We received a request to reset access
            to your EvalúaYa account. Tap the button to continue. If you didn't
            request this, ignore this email — nothing will change.
          </Text>
        </Section>
        <Text style={legal}>
          EvalúaYa · evaluaya.app · Herramienta de orientación, no sustituye la
          inspección de un ingeniero.
        </Text>
      </Container>
    </Body>
  </Html>
)

export default RecoveryEmail

const main = {
  backgroundColor: '#ffffff',
  fontFamily:
    "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
}
const container = { padding: '24px 16px', maxWidth: '480px', margin: '0 auto' }
const header = { padding: '4px 4px 16px' }
const brand = {
  fontSize: '24px',
  fontWeight: 'bold' as const,
  color: '#0f3443',
  margin: '0',
  letterSpacing: '-0.5px',
}
const brandSub = { fontSize: '12px', color: '#64748b', margin: '2px 0 0' }
const card = {
  backgroundColor: '#f8fafc',
  border: '1px solid #e2e8f0',
  borderRadius: '16px',
  padding: '28px 24px',
}
const h1 = {
  fontSize: '20px',
  fontWeight: 'bold' as const,
  color: '#0f3443',
  margin: '0 0 14px',
}
const text = {
  fontSize: '15px',
  color: '#334155',
  lineHeight: '1.55',
  margin: '0 0 22px',
}
const textEn = {
  fontSize: '13px',
  color: '#64748b',
  lineHeight: '1.55',
  margin: '0',
}
const button = {
  backgroundColor: '#0f3443',
  color: '#ffffff',
  fontSize: '15px',
  fontWeight: 'bold' as const,
  borderRadius: '10px',
  padding: '13px 22px',
  textDecoration: 'none',
  display: 'inline-block',
}
const footer = { fontSize: '13px', color: '#94a3b8', margin: '22px 0 0' }
const hr = { borderColor: '#e2e8f0', margin: '22px 0' }
const legal = {
  fontSize: '11px',
  color: '#94a3b8',
  lineHeight: '1.5',
  margin: '20px 4px 0',
  textAlign: 'center' as const,
}
