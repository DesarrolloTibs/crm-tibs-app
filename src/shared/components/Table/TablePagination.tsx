import type { Table as TanStackTable } from '@tanstack/react-table';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface TablePaginationProps<T> {
  table: TanStackTable<T>;
  isExternalPagination: boolean;
  currentPage?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
  pageSize?: number;
  onPageSizeChange?: (size: number) => void;
  totalCount?: number;
  filteredCount?: number;
  useInternalPagination: boolean;
}

/**
 * Generates a strictly bounded array of page numbers and ellipsis tokens.
 * GUARANTEE: Never returns more than 7 items, regardless of totalPages.
 * - totalPages <= 7: [1, 2, ..., totalPages]
 * - current <= 4: [1, 2, 3, 4, 5, '...', totalPages] (7 items)
 * - current >= total - 3: [1, '...', total - 4, total - 3, total - 2, total - 1, total] (7 items)
 * - middle: [1, '...', current - 1, current, current + 1, '...', total] (7 items)
 */
function getPaginationItems(current: number, total: number): (number | string)[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  if (current <= 4) {
    return [1, 2, 3, 4, 5, '...right', total];
  }

  if (current >= total - 3) {
    return [1, '...left', total - 4, total - 3, total - 2, total - 1, total];
  }

  return [1, '...left', current - 1, current, current + 1, '...right', total];
}

export function TablePagination<T>({
  table,
  isExternalPagination,
  currentPage,
  totalPages,
  onPageChange,
  pageSize,
  onPageSizeChange,
  totalCount,
  filteredCount,
  useInternalPagination,
}: TablePaginationProps<T>) {
  // Determine if pagination is enabled at all
  if (!isExternalPagination && !useInternalPagination) {
    return null;
  }

  // Active values depending on mode (External vs Internal TanStack)
  const activePage = isExternalPagination
    ? currentPage || 1
    : table.getState().pagination.pageIndex + 1;

  const totalPagesCount = isExternalPagination
    ? totalPages || 1
    : table.getPageCount();

  const activePageSize = isExternalPagination
    ? pageSize
    : table.getState().pagination.pageSize;

  const activeFilteredCount = isExternalPagination
    ? filteredCount ?? totalCount
    : table.getFilteredRowModel().rows.length;

  const activeTotalCount = isExternalPagination
    ? totalCount ?? filteredCount
    : table.getCoreRowModel().rows.length;

  const hasPageSizeHandler = isExternalPagination
    ? typeof onPageSizeChange === 'function'
    : true;

  const handlePageSizeChange = (size: number) => {
    if (isExternalPagination) {
      onPageSizeChange?.(size);
    } else {
      // 0 means "show all" in the input convention
      table.setPageSize(size === 0 ? 100000 : size);
    }
  };

  const goToPage = (page: number) => {
    if (isExternalPagination) {
      onPageChange?.(page);
    } else {
      table.setPageIndex(page - 1);
    }
  };

  // If there are no records, hide pagination
  if (typeof activeTotalCount === 'number' && activeTotalCount === 0) {
    return null;
  }

  // If there's only 1 page and no page-size control, also hide
  const showPageSizeControl = typeof activePageSize !== 'undefined' && hasPageSizeHandler;
  if (totalPagesCount <= 1 && !showPageSizeControl) {
    return null;
  }

  const paginationItems = getPaginationItems(activePage, totalPagesCount);

  return (
    <div className="flex flex-col md:flex-row items-center justify-between mt-4 p-4 gap-4 bg-slate-50/50 rounded-xl border border-slate-100/60 print:hidden select-none shrink-0 pr-4 md:pr-20">
      {/* Left Side: pageSize input and record details */}
      <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 select-none w-full md:w-auto justify-center md:justify-start">
        {showPageSizeControl ? (
          <>
            <span>Mostrar</span>
            <input
              type="number"
              min="0"
              value={activePageSize === 0 ? '' : activePageSize}
              onChange={(e) => {
                const val = e.target.value;
                handlePageSizeChange(val === '' ? 0 : Math.max(0, parseInt(val, 10)));
              }}
              placeholder="Todos"
              className="w-16 text-center border border-slate-300 rounded-lg py-1.5 px-2 text-slate-800 font-bold focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white outline-none"
            />
            {typeof activeFilteredCount !== 'undefined' && typeof activeTotalCount !== 'undefined' ? (
              <span>
                registros de {activeFilteredCount} (total: {activeTotalCount})
              </span>
            ) : (
              <span>por página</span>
            )}
          </>
        ) : (
          typeof activeFilteredCount !== 'undefined' && typeof activeTotalCount !== 'undefined' && (
            <span>
              Mostrando {activeFilteredCount} de {activeTotalCount} registros
            </span>
          )
        )}
      </div>

      {/* Center: Page navigation buttons centered horizontally away from bottom-right chat */}
      {totalPagesCount > 1 ? (
        <div className="flex items-center space-x-1.5 mx-auto justify-center">
          {/* Previous Page Button */}
          <button
            type="button"
            disabled={activePage <= 1}
            onClick={() => goToPage(activePage - 1)}
            className="px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all border border-slate-200 bg-white text-slate-600 hover:text-slate-800 hover:bg-slate-50 disabled:opacity-40 disabled:pointer-events-none select-none cursor-pointer flex items-center justify-center min-w-[32px] h-[32px]"
            title="Página anterior"
          >
            <ChevronLeft size={14} />
          </button>

          {/* Page Number Buttons with Strictly Bounded 7-Items Guarantee */}
          {paginationItems.map((item, idx) => {
            if (typeof item === 'string') {
              return (
                <span
                  key={`ellipsis-${idx}-${item}`}
                  className="px-1 text-slate-400 text-xs font-bold select-none"
                >
                  ...
                </span>
              );
            }

            const pageNum = item;
            const isActive = activePage === pageNum;

            return (
              <button
                key={pageNum}
                type="button"
                onClick={() => goToPage(pageNum)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all border select-none cursor-pointer min-w-[32px] h-[32px] flex items-center justify-center ${
                  isActive
                    ? 'bg-blue-600 border-blue-600 text-white shadow-sm shadow-blue-500/10'
                    : 'bg-white border-slate-200 text-slate-600 hover:text-slate-800 hover:bg-slate-50'
                }`}
              >
                {pageNum}
              </button>
            );
          })}

          {/* Next Page Button */}
          <button
            type="button"
            disabled={activePage >= totalPagesCount}
            onClick={() => goToPage(activePage + 1)}
            className="px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all border border-slate-200 bg-white text-slate-600 hover:text-slate-800 hover:bg-slate-50 disabled:opacity-40 disabled:pointer-events-none select-none cursor-pointer flex items-center justify-center min-w-[32px] h-[32px]"
            title="Página siguiente"
          >
            <ChevronRight size={14} />
          </button>
        </div>
      ) : null}

      {/* Right Side Spacer: Keeps center mathematically centered and leaves clearance for chat button */}
      <div className="hidden md:block w-44 pointer-events-none" />
    </div>
  );
}

export default TablePagination;
