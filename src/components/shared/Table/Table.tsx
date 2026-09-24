import { useState, useMemo } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  type SortingState,
  type RowSelectionState,
} from '@tanstack/react-table';
import type { TableProps } from './types';
import TableLoading from './TableLoading';
import CardsTableView from './CardsTableView';
import FlatTableView from './FlatTableView';
import TablePagination from './TablePagination';

export function Table<T>({
  columns,
  data,
  variant = 'cards',
  loading = false,
  emptyTitle = 'Sin resultados',
  emptyMessage = 'No hay registros que mostrar.',
  keyExtractor,
  skeletonRows = 5,
  onRowClick,
  rowClassName,

  // Layout & Viewport Height
  maxHeight = 'calc(100vh - 275px)',
  minHeight = '240px',
  containerClassName = '',

  // Sorting
  enableSorting = true,
  sorting: controlledSorting,
  onSortingChange: setControlledSorting,

  // External pagination
  currentPage,
  totalPages,
  onPageChange,
  pageSize,
  onPageSizeChange,
  totalCount,
  filteredCount,

  // Internal pagination
  enablePagination = false,
  initialPageSize = 10,

  // Selection
  enableRowSelection = false,
  rowSelection: controlledRowSelection,
  onRowSelectionChange: setControlledRowSelection,
}: TableProps<T>) {
  // Local sorting state if not controlled
  const [internalSorting, setInternalSorting] = useState<SortingState>([]);
  const sortingState = controlledSorting ?? internalSorting;
  const onSortingChangeHandler = setControlledSorting ?? setInternalSorting;

  // Local selection state if not controlled
  const [internalRowSelection, setInternalRowSelection] = useState<RowSelectionState>({});
  const selectionState = controlledRowSelection ?? internalRowSelection;
  const onSelectionChangeHandler = setControlledRowSelection ?? setInternalRowSelection;

  // Local mobile expanded rows (for variant='cards')
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});
  const toggleRow = (id: string) => {
    setExpandedRows((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Determine if any column has hideOnMobile enabled
  const hasCollapsibleColumns = useMemo(() => {
    return columns.some((col) => col.meta?.hideOnMobile);
  }, [columns]);

  // Determine if using internal TanStack pagination
  const isExternalPagination = typeof totalPages === 'number' && typeof onPageChange === 'function';
  const useInternalPagination = enablePagination && !isExternalPagination;

  // Initialize TanStack Table instance
  const table = useReactTable({
    data,
    columns,
    state: {
      sorting: sortingState,
      rowSelection: selectionState,
    },
    enableSorting,
    enableRowSelection,
    onSortingChange: onSortingChangeHandler,
    onRowSelectionChange: onSelectionChangeHandler,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: enableSorting ? getSortedRowModel() : undefined,
    getPaginationRowModel: useInternalPagination ? getPaginationRowModel() : undefined,
    initialState: {
      pagination: {
        pageSize: initialPageSize,
      },
    },
  });

  const getRowKey = (row: T, index: number): string => {
    if (keyExtractor) return String(keyExtractor(row, index));
    const r = row as Record<string, unknown>;
    return r?.id ? String(r.id) : String(index);
  };

  // Loading State
  if (loading) {
    return (
      <TableLoading
        columns={columns}
        variant={variant}
        skeletonRows={skeletonRows}
        containerClassName={containerClassName}
      />
    );
  }

  // Variant: CARDS
  if (variant === 'cards') {
    return (
      <div className={`flex flex-col w-full ${containerClassName}`}>
        <div
          className="overflow-x-auto overflow-y-auto relative rounded-2xl pr-1 pb-1 custom-scrollbar"
          style={{ maxHeight, minHeight }}
        >
          <CardsTableView
            table={table}
            columns={columns}
            expandedRows={expandedRows}
            toggleRow={toggleRow}
            hasCollapsibleColumns={hasCollapsibleColumns}
            getRowKey={getRowKey}
            onRowClick={onRowClick}
            rowClassName={rowClassName}
            emptyTitle={emptyTitle}
            emptyMessage={emptyMessage}
          />
        </div>

        <TablePagination
          table={table}
          isExternalPagination={isExternalPagination}
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={onPageChange}
          pageSize={pageSize}
          onPageSizeChange={onPageSizeChange}
          totalCount={totalCount}
          filteredCount={filteredCount}
          useInternalPagination={useInternalPagination}
        />
      </div>
    );
  }

  // Variant: FLAT
  return (
    <div className={`flex flex-col w-full ${containerClassName}`}>
      <div
        className="w-full overflow-x-auto overflow-y-auto relative rounded-2xl border border-slate-100 bg-white shadow-sm custom-scrollbar"
        style={{ maxHeight, minHeight }}
      >
        <FlatTableView
          table={table}
          columns={columns}
          getRowKey={getRowKey}
          onRowClick={onRowClick}
          rowClassName={rowClassName}
          emptyTitle={emptyTitle}
          emptyMessage={emptyMessage}
        />
      </div>

      <TablePagination
        table={table}
        isExternalPagination={isExternalPagination}
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={onPageChange}
        pageSize={pageSize}
        onPageSizeChange={onPageSizeChange}
        totalCount={totalCount}
        filteredCount={filteredCount}
        useInternalPagination={useInternalPagination}
      />
    </div>
  );
}

export const DataTable = Table;
export default Table;
