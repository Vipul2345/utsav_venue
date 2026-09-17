import { useEffect, RefObject } from 'react';

/**
 * Custom hook that listens for clicks outside a target element
 * and the 'Escape' key press to trigger dismissal of modals, popups, or dropdowns.
 *
 * @param ref - Ref of the modal/dropdown container element
 * @param onDismiss - Callback to invoke when an outside click or Escape key is detected
 * @param isOpen - Boolean indicating if the modal is currently active
 */
export function useModalDismiss(
  ref: RefObject<HTMLElement | null>,
  onDismiss: () => void,
  isOpen: boolean = true,
  ignoreRef?: RefObject<HTMLElement | null>
) {
  useEffect(() => {
    if (!isOpen) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault();
        onDismiss();
      }
    }

    function handleClickOutside(event: MouseEvent | TouchEvent) {
      const target = event.target as Node;
      if (ref.current && ref.current.contains(target)) {
        return;
      }
      if (ignoreRef?.current && ignoreRef.current.contains(target)) {
        return;
      }
      onDismiss();
    }

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside, { passive: true });

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [ref, onDismiss, isOpen, ignoreRef]);
}
