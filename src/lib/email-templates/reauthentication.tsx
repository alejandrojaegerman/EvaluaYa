import * as React from 'react'

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
} from '@react-email/components'

interface ReauthenticationEmailProps {
  token: string
}

export const ReauthenticationEmail = ({ token }: ReauthenticationEmailProps) => (
  <Html lang="es" dir="ltr">
    <Head />
    <Preview>Tu código de verificación de EvalúaYa</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={header}>
          <Text style={brand}>EvalúaYa</Text>
          <Text style={brandSub}>Evaluación estructural tras un sismo</Text>
        </Section>
        <Section style={card}>
          <Heading style={h1}>Confirma tu identidad</Heading>
          <Text style={text}>Usa este código para confirmar tu identidad:</Text>
          <Text style={codeStyle}>{token}</Text>
          <Text style={footer}>
            El código caduca pronto. Si no lo solicitaste, ignora este correo.
          </Text>
          <Hr style={hr} />
          <Text style={textEn}>
            <strong>In English:</strong> Use the code above to confirm your
            identity. It expires soon. If you didn't request it, ignore this
            email.
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

export default ReauthenticationEmail

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
  margin: '0 0 18px',
}
const textEn = {
  fontSize: '13px',
  color: '#64748b',
  lineHeight: '1.55',
  margin: '0',
}
const codeStyle = {
  fontFamily: "'Courier New', Courier, monospace",
  fontSize: '30px',
  fontWeight: 'bold' as const,
  letterSpacing: '6px',
  color: '#0f3443',
  margin: '0 0 24px',
}
const footer = { fontSize: '13px', color: '#94a3b8', margin: '18px 0 0' }
const hr = { borderColor: '#e2e8f0', margin: '22px 0' }
const legal = {
  fontSize: '11px',
  color: '#94a3b8',
  lineHeight: '1.5',
  margin: '20px 4px 0',
  textAlign: 'center' as const,
}
