import { useEffect, useRef, useState, type ReactNode } from "react";

/**
 * Scroll-reveal wrapper. Renders identical markup on the server and the first
 * client render (children always present, just visually offset) so it never
 * triggers a hydration mismatch. After mount, an IntersectionObserver fades +
 * slides the content in once when it enters the viewport. Honors
 * `prefers-reduced-motion` by skipping the transform entirely.
 */
export function Reveal({
  children,
  className,
  delayMs = 0,
  as: Tag = "div",
  onReveal,
}: {
  children: ReactNode;
  className?: string;
  /** small stagger between sibling sections */
  delayMs?: number;
  as?: "div" | "section";
  /** fired once when the element first enters the viewport */
  onReveal?: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [reduced, setReduced] = useState(false);
  const onRevealRef = useRef(onReveal);
  onRevealRef.current = onReveal;

  useEffect(() => {
    const prefersReduced =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced) {
      setReduced(true);
      setVisible(true);
      onRevealRef.current?.();
      return;
    }
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") {
      setVisible(true);
      onRevealRef.current?.();
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setVisible(true);
            onRevealRef.current?.();
            observer.disconnect();
            break;
          }
        }
      },
      { rootMargin: "0px 0px -10% 0px", threshold: 0.08 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const style = reduced
    ? undefined
    : {
        transition:
          "opacity 450ms ease-out, transform 450ms ease-out",
        transitionDelay: visible ? `${delayMs}ms` : "0ms",
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(12px)",
        willChange: "opacity, transform",
      };

  return (
    <Tag ref={ref} className={className} style={style}>
      {children}
    </Tag>
  );
}
