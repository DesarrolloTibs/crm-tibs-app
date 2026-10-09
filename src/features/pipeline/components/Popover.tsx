import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

interface PopoverProps {
  children: React.ReactNode;
  targetRef: React.RefObject<HTMLElement | null>;
  show: boolean;
  onClose: () => void;
  className?: string;
}

const Popover: React.FC<PopoverProps> = ({ children, targetRef, show, onClose, className }) => {
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
        // Hay espacio arriba
        top = targetRect.top - popoverRect.height - 8; // 8px de margen
      } else {
        // No hay espacio arriba, lo ponemos abajo
        top = targetRect.bottom + 8;
      }

      setPosition({
        top,
        left: targetRect.left + (targetRect.width / 2) - (popoverRect.width / 2),
      });
    };

    updatePosition(); // Calcular al mostrar

    window.addEventListener('scroll', updatePosition, true); // Recalcular en scroll
    return () => window.removeEventListener('scroll', updatePosition, true);
  }, [show]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (show && popoverRef.current && !popoverRef.current.contains(event.target as Node) && targetRef.current && !targetRef.current.contains(event.target as Node)) {
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
      style={position ? { top: `${position.top}px`, left: `${position.left}px`, opacity: 1 } : { opacity: 0 }}
      className={`fixed bg-white border rounded-lg shadow-lg p-3 z-[100] text-left transition-opacity duration-150 ${className}`}
    >
      {children}
    </div>,
    document.body
  );
};

export default Popover;