import * as React from 'react'

import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from '@react-email/components'

interface EmailChangeEmailProps {
  siteName?: string
  oldEmail: string
  email?: string
  newEmail: string
  confirmationUrl: string
}

export const EmailChangeEmail = ({
  oldEmail,
  newEmail,
  confirmationUrl,
}: EmailChangeEmailProps) => (
  <Html lang="es" dir="ltr">
    <Head />
    <Preview>Confirma el cambio de correo en EvalúaYa</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={header}>
          <Text style={brand}>EvalúaYa</Text>
          <Text style={brandSub}>Evaluación estructural tras un sismo</Text>
        </Section>
        <Section style={card}>
          <Heading style={h1}>Confirma tu nuevo correo</Heading>
          <Text style={text}>
            Solicitaste cambiar tu correo de{' '}
            <Link href={`mailto:${oldEmail}`} style={link}>
              {oldEmail}
            </Link>{' '}
            a{' '}
            <Link href={`mailto:${newEmail}`} style={link}>
              {newEmail}
            </Link>
            . Toca el botón para confirmar el cambio.
          </Text>
          <Button style={button} href={confirmationUrl}>
            Confirmar cambio
          </Button>
          <Text style={footer}>
            Si no solicitaste esto, asegura tu cuenta de inmediato.
          </Text>
          <Hr style={hr} />
          <Text style={textEn}>
            <strong>In English:</strong> You requested to change your EvalúaYa
            email. Tap the button to confirm. If you didn't request this, secure
            your account immediately.
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

export default EmailChangeEmail

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
const link = { color: '#0f3443', textDecoration: 'underline' }
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
