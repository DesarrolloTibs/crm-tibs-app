import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

interface PopoverProps {
  children: React.ReactNode;
  targetRef: React.RefObject<HTMLElement | null>;
  show: boolean;
  onClose: () => void;
  className?: string;
}

export const OpportunityCardPopover: React.FC<PopoverProps> = ({ children, targetRef, show, onClose, className }) => {
  const popoverRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null);

  useEffect(() => {
    const updatePosition = () => {
      if (!show || !targetRef.current || !popoverRef.current) {
        setPosition(null);
        return;
      }

      const targetRect = targetRef.current.getBoundingClientRect();
      const popoverRect = popoverRef.current.getBoundingClientRect();
      const spaceAbove = targetRect.top;
      let top;
      if (spaceAbove > popoverRect.height + 8) {
        top = targetRect.top - popoverRect.height - 8;
      } else {
        top = targetRect.bottom + 8;
      }

      setPosition({
        top,
        left: targetRect.left + targetRect.width / 2 - popoverRect.width / 2,
      });
    };

    updatePosition();
    window.addEventListener('scroll', updatePosition, true);
    return () => window.removeEventListener('scroll', updatePosition, true);
  }, [show, targetRef]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        show &&
        popoverRef.current &&
        !popoverRef.current.contains(event.target as Node) &&
        targetRef.current &&
        !targetRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [show, onClose, targetRef]);

  if (!show) return null;

  return createPortal(
    <div
      ref={popoverRef}
      style={{
        position: 'fixed',
        top: position ? `${position.top}px` : '-9999px',
        left: position ? `${position.left}px` : '-9999px',
        zIndex: 50,
      }}
      className={`bg-white border border-gray-200 rounded-lg shadow-lg p-3 ${className || ''}`}
    >
      {children}
    </div>,
    document.body
  );
};

export const Popover = OpportunityCardPopover;
export default OpportunityCardPopover;
