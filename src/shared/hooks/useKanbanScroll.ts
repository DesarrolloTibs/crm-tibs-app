import { useRef, useState, useEffect, useCallback } from 'react';

export interface UseKanbanScrollOptions {
  step?: number;
  disabled?: boolean;
}

export function useKanbanScroll<T extends HTMLElement = HTMLDivElement>({
  step = 360,
  disabled = false,
}: UseKanbanScrollOptions = {}) {
  const containerRef = useRef<T | null>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  // Comprobar límites de scroll para activar o desactivar controles
  const updateScrollBounds = useCallback(() => {
    const el = containerRef.current;
    if (!el || disabled) {
      setCanScrollLeft(false);
      setCanScrollRight(false);
      return;
    }
    const { scrollLeft, scrollWidth, clientWidth } = el;
    setCanScrollLeft(scrollLeft > 10);
    setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 10);
  }, [disabled]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el || disabled) return;

    updateScrollBounds();
    el.addEventListener('scroll', updateScrollBounds, { passive: true });
    window.addEventListener('resize', updateScrollBounds);

    const observer = new ResizeObserver(updateScrollBounds);
    observer.observe(el);

    return () => {
      el.removeEventListener('scroll', updateScrollBounds);
      window.removeEventListener('resize', updateScrollBounds);
      observer.disconnect();
    };
  }, [updateScrollBounds, disabled]);

  const scrollByStep = useCallback(
    (direction: 'left' | 'right') => {
      const el = containerRef.current;
      if (!el || disabled) return;
      const delta = direction === 'left' ? -step : step;
      el.scrollBy({ left: delta, behavior: 'smooth' });
    },
    [step, disabled]
  );

  const scrollToLeft = useCallback(() => scrollByStep('left'), [scrollByStep]);
  const scrollToRight = useCallback(() => scrollByStep('right'), [scrollByStep]);

  return {
    containerRef,
    canScrollLeft,
    canScrollRight,
    scrollToLeft,
    scrollToRight,
    updateScrollBounds,
  };
}

export default useKanbanScroll;

