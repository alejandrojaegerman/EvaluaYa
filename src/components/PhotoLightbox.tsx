import { ChevronLeft, ChevronRight, X, ZoomIn } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import { useLang } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export type LightboxPhoto = {
  url: string;
  caption?: string;
};

/**
 * Fullscreen photo viewer with pinch / double-tap / wheel zoom, drag-to-pan
 * when zoomed, and carousel navigation (swipe, arrows, keyboard) across all
 * photos of a case. This is the engineer's critical tool: without being able
 * to open and inspect each photo at full size, they cannot triage a case.
 */
export function PhotoLightbox({
  photos,
  index,
  onIndexChange,
  onClose,
}: {
  photos: LightboxPhoto[];
  index: number;
  onIndexChange: (i: number) => void;
  onClose: () => void;
}) {
  const { t } = useLang();
  const [scale, setScale] = useState(1);
  const [tx, setTx] = useState(0);
  const [ty, setTy] = useState(0);

  // Gesture bookkeeping (mutable refs — don't trigger re-renders mid-gesture).
  const pointers = useRef<Map<number, { x: number; y: number }>>(new Map());
  const pinchStart = useRef<{ dist: number; scale: number } | null>(null);
  const panStart = useRef<{ x: number; y: number; tx: number; ty: number } | null>(
    null,
  );
  const swipeStart = useRef<{ x: number; y: number; t: number } | null>(null);
  const lastTap = useRef(0);

  const count = photos.length;
  const current = photos[index];

  const resetZoom = useCallback(() => {
    setScale(1);
    setTx(0);
    setTy(0);
  }, []);

  const goTo = useCallback(
    (i: number) => {
      if (i < 0 || i >= count) return;
      resetZoom();
      onIndexChange(i);
    },
    [count, onIndexChange, resetZoom],
  );

  const next = useCallback(() => goTo(index + 1), [goTo, index]);
  const prev = useCallback(() => goTo(index - 1), [goTo, index]);

  // Keyboard navigation + lock background scroll while open.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowRight") next();
      else if (e.key === "ArrowLeft") prev();
    }
    window.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [next, prev, onClose]);

  function clampPan(nextScale: number, x: number, y: number) {
    // Keep the image from drifting too far off-screen when zoomed.
    const max = 600 * (nextScale - 1);
    return {
      x: Math.max(-max, Math.min(max, x)),
      y: Math.max(-max, Math.min(max, y)),
    };
  }

  function onPointerDown(e: React.PointerEvent) {
    (e.target as Element).setPointerCapture?.(e.pointerId);
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (pointers.current.size === 2) {
      const pts = [...pointers.current.values()];
      const dist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
      pinchStart.current = { dist, scale };
      swipeStart.current = null;
      panStart.current = null;
    } else if (pointers.current.size === 1) {
      if (scale > 1) {
        panStart.current = { x: e.clientX, y: e.clientY, tx, ty };
      } else {
        swipeStart.current = { x: e.clientX, y: e.clientY, t: Date.now() };
      }
    }
  }

  function onPointerMove(e: React.PointerEvent) {
    if (!pointers.current.has(e.pointerId)) return;
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (pointers.current.size === 2 && pinchStart.current) {
      const pts = [...pointers.current.values()];
      const dist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
      const nextScale = Math.max(
        1,
        Math.min(5, (dist / pinchStart.current.dist) * pinchStart.current.scale),
      );
      setScale(nextScale);
      if (nextScale === 1) {
        setTx(0);
        setTy(0);
      }
      return;
    }

    if (panStart.current && scale > 1) {
      const dx = e.clientX - panStart.current.x;
      const dy = e.clientY - panStart.current.y;
      const clamped = clampPan(scale, panStart.current.tx + dx, panStart.current.ty + dy);
      setTx(clamped.x);
      setTy(clamped.y);
    }
  }

  function onPointerUp(e: React.PointerEvent) {
    pointers.current.delete(e.pointerId);

    if (pinchStart.current && pointers.current.size < 2) {
      pinchStart.current = null;
    }

    // Horizontal swipe to change photo (only when not zoomed).
    if (swipeStart.current && scale === 1) {
      const dx = e.clientX - swipeStart.current.x;
      const dy = e.clientY - swipeStart.current.y;
      const dt = Date.now() - swipeStart.current.t;
      if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy)) {
        if (dx < 0) next();
        else prev();
      } else if (dt < 250 && Math.abs(dx) < 10 && Math.abs(dy) < 10) {
        // Double-tap to toggle zoom.
        const now = Date.now();
        if (now - lastTap.current < 300) {
          setScale((s) => (s > 1 ? 1 : 2.5));
          if (scale > 1) resetZoom();
        }
        lastTap.current = now;
      }
    }
    swipeStart.current = null;
    panStart.current = null;
  }

  function onWheel(e: React.WheelEvent) {
    const nextScale = Math.max(1, Math.min(5, scale - e.deltaY * 0.002));
    setScale(nextScale);
    if (nextScale === 1) resetZoom();
  }

  if (!current) return null;

  return (
    <div
      className="fixed inset-0 z-[120] flex flex-col bg-black/95 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label={t("lightbox.title")}
    >
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-3 text-white">
        <span className="rounded-full bg-white/15 px-3 py-1 text-sm font-semibold tabular-nums">
          {index + 1} / {count}
        </span>
        <button
          type="button"
          onClick={onClose}
          aria-label={t("lightbox.close")}
          className="flex size-10 items-center justify-center rounded-full bg-white/15 transition-colors hover:bg-white/25"
        >
          <X className="size-5" />
        </button>
      </div>

      {/* Stage */}
      <div
        className="relative flex flex-1 touch-none select-none items-center justify-center overflow-hidden"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onWheel={onWheel}
      >
        <img
          src={current.url}
          alt={current.caption ?? t("lightbox.title")}
          draggable={false}
          className="max-h-full max-w-full object-contain transition-transform duration-75 will-change-transform"
          style={{ transform: `translate(${tx}px, ${ty}px) scale(${scale})` }}
        />

        {count > 1 && (
          <>
            <button
              type="button"
              onClick={prev}
              disabled={index === 0}
              aria-label={t("lightbox.prev")}
              className={cn(
                "absolute left-2 top-1/2 flex size-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/15 text-white transition-colors hover:bg-white/25",
                index === 0 && "pointer-events-none opacity-30",
              )}
            >
              <ChevronLeft className="size-6" />
            </button>
            <button
              type="button"
              onClick={next}
              disabled={index === count - 1}
              aria-label={t("lightbox.next")}
              className={cn(
                "absolute right-2 top-1/2 flex size-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/15 text-white transition-colors hover:bg-white/25",
                index === count - 1 && "pointer-events-none opacity-30",
              )}
            >
              <ChevronRight className="size-6" />
            </button>
          </>
        )}

        {scale === 1 && (
          <span className="pointer-events-none absolute bottom-20 left-1/2 flex -translate-x-1/2 items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-medium text-white/90">
            <ZoomIn className="size-3.5" />
            {t("lightbox.zoomHint")}
          </span>
        )}
      </div>

      {/* Caption + thumbnail strip */}
      <div className="px-4 pb-[max(env(safe-area-inset-bottom),1rem)] pt-2">
        {current.caption && (
          <p className="mb-2 text-center text-sm text-white/80">{current.caption}</p>
        )}
        {count > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-1">
            {photos.map((p, i) => (
              <button
                key={i}
                type="button"
                onClick={() => goTo(i)}
                aria-label={`${i + 1}`}
                className={cn(
                  "size-14 shrink-0 overflow-hidden rounded-lg border-2 transition-colors",
                  i === index ? "border-white" : "border-transparent opacity-60",
                )}
              >
                <img
                  src={p.url}
                  alt=""
                  loading="lazy"
                  className="size-full object-cover"
                />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
