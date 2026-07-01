## Objetivo
Cambiar el copy pequeño bajo el título principal del home por el nuevo texto.

## Cambio
En `src/lib/i18n.tsx`, actualizar la clave `home.heroSubtitle` (línea 31):

- Antes: `"Revisa los daños de tu casa en minutos con una guía paso a paso."`
- Después: `"Una guía paso a paso para revisar daños estructurales después de un terremoto. Sin registro. Funciona con poca señal."`

También actualizar el equivalente en inglés `home.heroSubtitle` (línea 1291) para mantener la paridad bilingüe:

- Después: `"A step-by-step guide to check structural damage after an earthquake. No sign-up. Works on low signal."`

El componente `src/routes/index.tsx` (línea 140) ya renderiza `t("home.heroSubtitle")`, así que no requiere cambios.
