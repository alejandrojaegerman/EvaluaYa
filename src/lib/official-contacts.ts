// Verified official emergency + assessment contacts for Venezuela.
//
// Source: comunicado oficial del Ministerio del Poder Popular para la
// Comunicación e Información (MIPPCI), 28-jun-2026, para la contingencia
// sísmica, complementado con la web institucional de FUNVISIS y prensa (CIV).
//
// ⚠️ Contingency info can change once the acute phase passes — revalidate
// periodically. The app only surfaces these numbers for direct dialing; it
// does not manage or take responsibility for the calls.

export type ContactGroup = "infra" | "emergency" | "technical";

export type OfficialContact = {
  id: string;
  /** i18n key for the organism name */
  nameKey: string;
  /** i18n key for the short description */
  descKey: string;
  /** human-readable number shown on screen (null when no verified number) */
  display: string | null;
  /** tel: number to dial (null → use `href` instead) */
  tel: string | null;
  /** external link when there is no verified phone number (e.g. CIV site) */
  href?: string;
  group: ContactGroup;
  /** highlighted as the primary contact for building assessment */
  featured?: boolean;
};

/** Primary contact for requesting an official building assessment. */
export const PC_CARACAS: OfficialContact = {
  id: "pc_caracas",
  nameKey: "official.pc_caracas.name",
  descKey: "official.pc_caracas.desc",
  display: "(0212) 575-1823",
  tel: "+582125751823",
  group: "infra",
  featured: true,
};

/** Life-safety emergency lines (used by the SOS module). */
export const VEN_911: OfficialContact = {
  id: "ven911",
  nameKey: "official.ven911.name",
  descKey: "official.ven911.desc",
  display: "9-1-1",
  tel: "911",
  group: "emergency",
};

export const PCIVIL_FREE: OfficialContact = {
  id: "pcivil",
  nameKey: "official.pcivil.name",
  descKey: "official.pcivil.desc",
  display: "0800-7248451",
  tel: "08007248451",
  group: "emergency",
};

export const OFFICIAL_CONTACTS: OfficialContact[] = [
  PC_CARACAS,
  VEN_911,
  PCIVIL_FREE,
  {
    id: "bomberos",
    nameKey: "official.bomberos.name",
    descKey: "official.bomberos.desc",
    display: "(0212) 545-4545",
    tel: "+582125454545",
    group: "emergency",
  },
  {
    id: "cruzroja",
    nameKey: "official.cruzroja.name",
    descKey: "official.cruzroja.desc",
    display: "(0422) 799-4880",
    tel: "+584227994880",
    group: "emergency",
  },
  {
    id: "funvisis",
    nameKey: "official.funvisis.name",
    descKey: "official.funvisis.desc",
    display: "0800-8362567",
    tel: "08008362567",
    group: "technical",
  },
  {
    id: "civ",
    nameKey: "official.civ.name",
    descKey: "official.civ.desc",
    // CIV's published phone is a placeholder; direct users to its site instead.
    display: null,
    tel: null,
    href: "https://www.civ.net.ve",
    group: "technical",
  },
];

export const CONTACT_GROUP_ORDER: ContactGroup[] = [
  "infra",
  "emergency",
  "technical",
];

export const CONTACT_GROUP_TITLE_KEY: Record<ContactGroup, string> = {
  infra: "official.dir.infraTitle",
  emergency: "official.dir.emergencyTitle",
  technical: "official.dir.technicalTitle",
};
