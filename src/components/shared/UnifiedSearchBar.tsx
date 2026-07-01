import React, { useRef, useImperativeHandle, useEffect } from 'react';
import type { ReactNode } from 'react';
import { Search, ChevronDown, X } from 'lucide-react';

export interface SearchBadge {
  id: string;
  label: string;
  icon?: ReactNode;
  onRemove: () => void;
}

interface UnifiedSearchBarProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  placeholder?: string;
  badges?: SearchBadge[];
  showFilters: boolean;
  setShowFilters: (show: boolean) => void;
  dropdownWidthClass?: string;
  dropdownAlign?: 'left' | 'right';
  className?: string;
  children: ReactNode;
}

export const UnifiedSearchBar = React.forwardRef<HTMLDivElement, UnifiedSearchBarProps>(
  (
    {
      searchTerm,
      onSearchChange,
      placeholder = 'Buscar...',
      badges = [],
      showFilters,
      setShowFilters,
      dropdownWidthClass = 'w-[340px]',
      dropdownAlign = 'right',
      className,
      children,
    },
    ref
  ) => {
    const inputRef = useRef<HTMLInputElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // Reenviar la referencia del contenedor
    useImperativeHandle(ref, () => containerRef.current as HTMLDivElement);

    // Close dropdown when clicking outside the container
    useEffect(() => {
      if (!showFilters) return;

      const handlePointerDown = (e: PointerEvent) => {
        if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
          setShowFilters(false);
        }
      };

      document.addEventListener('pointerdown', handlePointerDown);
      return () => document.removeEventListener('pointerdown', handlePointerDown);
    }, [showFilters, setShowFilters]);

    const handleContainerClick = () => {
      inputRef.current?.focus();
    };

    const hasBadges = badges.length > 0;
    const alignClass = dropdownAlign === 'left' ? 'left-0' : 'right-0';

    return (
      <div className={className || "relative w-full sm:w-auto"} ref={containerRef}>
        <div
          className="flex items-center gap-1.5 bg-white border border-gray-300 rounded-lg px-2.5 py-1.5 shadow-sm hover:border-gray-400 focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500 min-h-[38px] cursor-text transition-all w-full sm:min-w-[280px]"
          onClick={handleContainerClick}
        >
          <Search size={16} className="text-gray-400 shrink-0" />

          {/* Badges de filtros activos e input de búsqueda */}
          <div className="flex flex-wrap gap-1 items-center flex-1 min-w-0">
            {badges.map((badge) => (
              <span
                key={badge.id}
                className="flex items-center gap-1 bg-indigo-50 text-indigo-700 text-[10px] px-1.5 py-0.5 rounded border border-indigo-100 font-bold shrink-0"
              >
                {badge.icon && <span className="shrink-0">{badge.icon}</span>}
                <span className="max-w-[100px] truncate shrink-0">{badge.label}</span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    badge.onRemove();
                  }}
                  className="hover:text-indigo-950 font-black ml-0.5 cursor-pointer shrink-0"
                >
                  <X size={10} />
                </button>
              </span>
            ))}

            <input
              ref={inputRef}
              type="text"
              placeholder={hasBadges ? '' : placeholder}
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="border-none outline-none focus:ring-0 p-0 text-xs sm:text-sm bg-transparent placeholder-gray-400 min-w-[60px] flex-grow focus:outline-none"
            />
          </div>

          {/* Toggle de menú desplegable */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setShowFilters(!showFilters);
            }}
            className="p-1 hover:bg-gray-100 rounded-md text-gray-400 hover:text-gray-700 transition-colors ml-auto shrink-0 cursor-pointer"
          >
            <ChevronDown
              size={14}
              className={`transform transition-transform duration-200 ${
                showFilters ? 'rotate-180' : ''
              }`}
            />
          </button>
        </div>

        {/* Panel desplegable */}
        {showFilters && (
          <div
            className={`absolute ${alignClass} sm:left-auto left-0 mt-1.5 ${dropdownWidthClass} max-w-[95vw] bg-white border border-gray-200 rounded-lg shadow-xl z-50 p-4 flex gap-4 animate-fade-in text-left`}
          >
            {children}
          </div>
        )}
      </div>
    );
  }
);

UnifiedSearchBar.displayName = 'UnifiedSearchBar';
export default UnifiedSearchBar;
