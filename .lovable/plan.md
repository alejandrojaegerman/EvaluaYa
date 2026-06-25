## Goal

Right now each checklist item only lets people take a *new* photo with the live camera (the file input forces `capture="environment"`). Many people can't or won't re-enter a damaged building, but already have photos of the damage in their camera roll. We'll let them pick existing photos from their phone (or computer) in addition to taking a new one.

## What changes

In the checklist photo capture (`src/routes/assess/checklist.tsx`), each item gets **two ways** to add a photo:

- **Take photo** — opens the camera (current behavior).
- **Choose from gallery** — opens the phone's photo library / file picker, so previously-taken damage photos can be used.

Both paths run through the same existing compression + 3-photos-per-item logic, so nothing downstream (AI analysis, offline draft, upload) needs to change.

```text
┌──────────────────────────────────────┐
│  📷 Take photo   │   🖼 From gallery   │
└──────────────────────────────────────┘
```

When photos already exist, the "add more" tile offers the same two choices until the 3-photo limit is reached.

## Bilingual copy

Add new labels (Spanish primary, English secondary) in `src/lib/i18n.tsx`:
- `checklist.takePhoto` → "Tomar foto" / "Take photo"
- `checklist.fromGallery` → "Desde la galería" / "From gallery"
- Update `checklist.photoHint` to mention old photos are fine, e.g. "Una foto clara mejora el análisis. Puedes usar fotos que ya tengas." / "A clear photo improves the analysis. You can use photos you already have."

## Technical details

- Use **two hidden `<input type="file">` elements** per card: one with `accept="image/*" capture="environment"` (camera) and one with only `accept="image/*"` (gallery — omitting `capture` is what makes browsers show the photo library). They share one `handleFile` handler.
- Keep the single-button layout when no photo exists by showing the two choices side by side; reuse existing `Camera` icon and add an `Image`/`ImagePlus` icon from `lucide-react` for the gallery action.
- No backend, schema, or AI changes — purely a frontend/presentation enhancement.

## Out of scope

- No multi-select gallery import (still one photo per tap, up to the existing 3-per-item cap).
- No changes to property info, map, or analysis flows.
