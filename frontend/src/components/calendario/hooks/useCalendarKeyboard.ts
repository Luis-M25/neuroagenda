import { useEffect } from 'react';

export function useCalendarKeyboard(handlers: {
  onEscape?: () => void;
  onArrowLeft?: () => void;
  onArrowRight?: () => void;
  onToday?: () => void;
  onSelectAll?: () => void;
  onDeselectAll?: () => void;
}) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLSelectElement) {
        return;
      }

      switch (e.key) {
        case 'Escape':
          handlers.onEscape?.();
          break;
        case 'ArrowLeft':
          if (e.ctrlKey || e.metaKey) break;
          handlers.onArrowLeft?.();
          break;
        case 'ArrowRight':
          if (e.ctrlKey || e.metaKey) break;
          handlers.onArrowRight?.();
          break;
        case 't':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            handlers.onToday?.();
          }
          break;
        case 'a':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            handlers.onSelectAll?.();
          }
          break;
        case 'd':
          if (e.ctrlKey || e.metaKey && e.shiftKey) {
            e.preventDefault();
            handlers.onDeselectAll?.();
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handlers]);
}
