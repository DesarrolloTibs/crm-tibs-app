import type { Table as TanStackTable } from '@tanstack/react-table';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import Button from '../Button';

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
  // 1. External controlled pagination
  if (isExternalPagination && totalPages && totalPages > 1 && onPageChange) {
    return (
      <div className="flex flex-col sm:flex-row justify-between items-center mt-4 p-3 gap-4 select-none shrink-0">
        {typeof pageSize !== 'undefined' && typeof onPageSizeChange === 'function' && (
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
            <span>Mostrar</span>
            <input
              type="number"
              min="0"
              value={pageSize === 0 ? '' : pageSize}
              onChange={(e) => {
                const val = e.target.value;
                onPageSizeChange(val === '' ? 0 : Math.max(0, parseInt(val, 10)));
              }}
              placeholder="Todos"
              className="w-16 text-center border border-slate-300 rounded-lg py-1.5 px-2 text-slate-800 font-bold focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white outline-none"
            />
            {typeof filteredCount !== 'undefined' && typeof totalCount !== 'undefined' ? (
              <span>registros de {filteredCount} (total: {totalCount})</span>
            ) : (
              <span>por página</span>
            )}
          </div>
        )}

        <div className="flex justify-center items-center space-x-2 mx-auto">
          {currentPage && currentPage > 1 && (
            <Button
              variant="secondary"
              onClick={() => onPageChange?.(currentPage - 1)}
              className="px-3 py-2 text-sm min-w-[38px] flex items-center justify-center !rounded-lg"
              title="Página anterior"
            >
              <ChevronLeft size={16} />
            </Button>
          )}

          {Array.from({ length: totalPages }, (_, i) => {
            const pageNum = i + 1;
            if (
              totalPages <= 7 ||
              pageNum === 1 ||
              pageNum === totalPages ||
              (currentPage && Math.abs(pageNum - currentPage) <= 1)
            ) {
              return (
                <Button
                  key={pageNum}
                  variant={currentPage === pageNum ? 'primary' : 'secondary'}
                  onClick={() => onPageChange?.(pageNum)}
                  className="px-4 py-2 text-sm min-w-[38px] !rounded-lg"
                >
                  {pageNum}
                </Button>
              );
            }
            if (
              currentPage &&
              (pageNum === currentPage - 2 || pageNum === currentPage + 2)
            ) {
              return <span key={pageNum} className="px-1 text-slate-400">...</span>;
            }
            return null;
          })}

          {currentPage && currentPage < totalPages && (
            <Button
              variant="secondary"
              onClick={() => onPageChange?.(currentPage + 1)}
              className="px-3 py-2 text-sm min-w-[38px] flex items-center justify-center !rounded-lg"
              title="Página siguiente"
            >
              <ChevronRight size={16} />
            </Button>
          )}
        </div>
      </div>
    );
  }

  // 2. Internal TanStack pagination
  if (useInternalPagination && table.getPageCount() > 1) {
    const pageIndex = table.getState().pagination.pageIndex;
    const count = table.getPageCount();
    const currentPageNum = pageIndex + 1;

    return (
      <div className="flex justify-center items-center mt-4 p-3 select-none shrink-0">
        <div className="flex space-x-2 items-center">
          <Button
            variant="secondary"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            className="px-3 py-2 text-sm min-w-[38px] flex items-center justify-center !rounded-lg"
            title="Página anterior"
          >
            <ChevronLeft size={16} />
          </Button>

          {Array.from({ length: count }, (_, i) => {
            const pageNum = i + 1;
            if (
              count <= 7 ||
              pageNum === 1 ||
              pageNum === count ||
              Math.abs(pageNum - currentPageNum) <= 1
            ) {
              return (
                <Button
                  key={pageNum}
                  variant={pageIndex === i ? 'primary' : 'secondary'}
                  onClick={() => table.setPageIndex(i)}
                  className="px-4 py-2 text-sm min-w-[38px] !rounded-lg"
                >
                  {pageNum}
                </Button>
              );
            }
            if (pageNum === currentPageNum - 2 || pageNum === currentPageNum + 2) {
              return (
                <span key={pageNum} className="px-1 text-slate-400">
                  ...
                </span>
              );
            }
            return null;
          })}

          <Button
            variant="secondary"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            className="px-3 py-2 text-sm min-w-[38px] flex items-center justify-center !rounded-lg"
            title="Página siguiente"
          >
            <ChevronRight size={16} />
          </Button>
        </div>
      </div>
    );
  }

  return null;
}

export default TablePagination;
