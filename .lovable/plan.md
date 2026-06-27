## Goal
Add a heart ❤️ and Venezuelan flag 🇻🇪 emoji tastefully in a few subtle, high-meaning spots — a quiet "made with love for Venezuela" signal — without sprinkling them everywhere or cluttering the UI.

## Where (3 subtle placements)
All copy-only edits in `src/lib/i18n.tsx` (both `es` and `en` blocks). No component/logic changes.

1. **Footer note** (`footer.note`) — the most fitting "signature" spot, shown site-wide.
   - ES: `"Datos anónimos y abiertos · Proyecto comunitario de código abierto · Hecho con ❤️ para Venezuela 🇻🇪"`
   - EN: `"Anonymized, open data · Community-built open-source project · Made with ❤️ for Venezuela 🇻🇪"`

2. **Share message** (`share.message`) — adds warmth when people forward the app via WhatsApp.
   - ES: append ` 🇻🇪` to the end of the message line.
   - EN: append ` 🇻🇪` to the end of the message line.

3. **Share section body** (`share.body`) — gentle heart on the community ask.
   - ES: end with ` ❤️`
   - EN: end with ` ❤️`

## Principles
- Only these three spots — keep it rare so it stays special, not spammy.
- One emoji per spot (footer carries both as the signature line); no emoji in the hero CTA, headings, or nav.
- Emojis appended to existing strings; keys and consumers unchanged.

## Out of scope
No changes to logos, icons, the app name, or any component code — text strings only.