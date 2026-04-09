import { useEffect, useRef, useState, type RefObject } from 'react';

const DEFAULT_THRESHOLD = 10;

/**
 * Hides a fixed header-style control while the user scrolls down, shows again on scroll up
 * or when near the top of the scroll container (common mobile pattern).
 */
export function useHideOnScrollDown(
  scrollRef: RefObject<HTMLElement | null>,
  options?: { threshold?: number; disabled?: boolean }
): boolean {
  const [hidden, setHidden] = useState(false);
  const lastY = useRef(0);
  const threshold = options?.threshold ?? DEFAULT_THRESHOLD;
  const disabled = options?.disabled ?? false;

  useEffect(() => {
    if (disabled) {
      setHidden(false);
      return;
    }
    const el = scrollRef.current;
    if (!el) return;

    const reduceMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduceMotion) {
      setHidden(false);
      return;
    }

    lastY.current = el.scrollTop;

    const onScroll = () => {
      const y = el.scrollTop;
      const delta = y - lastY.current;

      if (y <= threshold) {
        setHidden(false);
      } else if (delta > threshold) {
        setHidden(true);
      } else if (delta < -threshold) {
        setHidden(false);
      }
      lastY.current = y;
    };

    el.addEventListener('scroll', onScroll, { passive: true });
    return () => el.removeEventListener('scroll', onScroll);
  }, [scrollRef, threshold, disabled]);

  return disabled ? false : hidden;
}
