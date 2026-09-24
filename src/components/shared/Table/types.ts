import type {
  ColumnDef,
  SortingState,
  OnChangeFn,
  RowSelectionState,
  RowData,
} from '@tanstack/react-table';

// ── Extend TanStack ColumnMeta for custom styling and mobile responsive settings ──
declare module '@tanstack/react-table' {
  interface ColumnMeta<TData extends RowData, TValue> {
    headerClassName?: string;
    cellClassName?: string;
    /** If true, this column will be hidden on mobile until the user expands row details */
    hideOnMobile?: boolean;
    /** Text shown as the label header on mobile card view */
    mobileLabel?: string;
    /** Whether to suppress rendering the mobile label in card view */
    hideMobileLabel?: boolean;
    align?: 'left' | 'center' | 'right';
    /** Optional typed cell formatter referencing TData and TValue */
    formatter?: (value: TValue, row: TData) => unknown;
  }
}

export type { ColumnDef };

export interface TableProps<T> {
  columns: ColumnDef<T, unknown>[];
  data: T[];
  /** Visual variant: 'cards' has floating cards on desktop & mobile; 'flat' is a clean bordered grid */
  variant?: 'cards' | 'flat';
  loading?: boolean;
  emptyTitle?: string;
  emptyMessage?: string;
  keyExtractor?: (row: T, index: number) => string | number;
  skeletonRows?: number;
  onRowClick?: (row: T) => void;
  rowClassName?: (row: T, index: number) => string;

  // ── Layout & Viewport Height ──
  /** Maximum height of the scrollable table container. Defaults to 'calc(100vh - 275px)' */
  maxHeight?: string;
  /** Minimum height of the scrollable table container. Defaults to '240px' */
  minHeight?: string;
  /** Optional container class name */
  containerClassName?: string;

  // ── Sorting ──
  enableSorting?: boolean;
  sorting?: SortingState;
  onSortingChange?: OnChangeFn<SortingState>;

  // ── Controlled / External Pagination (backward compatibility with existing hooks) ──
  currentPage?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
  pageSize?: number;
  onPageSizeChange?: (size: number) => void;
  totalCount?: number;
  filteredCount?: number;

  // ── Internal Pagination (managed by TanStack Table) ──
  enablePagination?: boolean;
  initialPageSize?: number;

  // ── Row Selection / Bulk Actions ──
  enableRowSelection?: boolean;
  rowSelection?: RowSelectionState;
  onRowSelectionChange?: OnChangeFn<RowSelectionState>;
}
