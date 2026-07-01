import scale from "@/assets/photo-guide/scale.jpg";
import rebar from "@/assets/photo-guide/rebar.jpg";
import joint from "@/assets/photo-guide/joint.jpg";
import wideClose from "@/assets/photo-guide/wide-close.jpg";

/**
 * Visual examples of "what a useful photo looks like" for the engineer.
 * Replaces the old text-only bullet list in the checklist photo section.
 * Each item is an example image + short i18n title/description keys.
 */
export type PhotoGuideExample = {
  img: string;
  titleKey: string;
  descKey: string;
};

export const PHOTO_GUIDE_EXAMPLES: PhotoGuideExample[] = [
  {
    img: scale,
    titleKey: "checklist.usefulEx.scale.title",
    descKey: "checklist.usefulEx.scale.desc",
  },
  {
    img: rebar,
    titleKey: "checklist.usefulEx.rebar.title",
    descKey: "checklist.usefulEx.rebar.desc",
  },
  {
    img: joint,
    titleKey: "checklist.usefulEx.joint.title",
    descKey: "checklist.usefulEx.joint.desc",
  },
  {
    img: wideClose,
    titleKey: "checklist.usefulEx.wideClose.title",
    descKey: "checklist.usefulEx.wideClose.desc",
  },
];
