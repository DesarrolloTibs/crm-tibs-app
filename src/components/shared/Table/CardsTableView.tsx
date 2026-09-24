import { flexRender, type Table as TanStackTable, type ColumnDef } from '@tanstack/react-table';
import { ArrowUp, ArrowDown, ArrowUpDown, ChevronUp, ChevronDown } from 'lucide-react';
import TableEmpty from './TableEmpty';

interface CardsTableViewProps<T> {
  table: TanStackTable<T>;
  columns: ColumnDef<T, unknown>[];
  expandedRows: Record<string, boolean>;
  toggleRow: (id: string) => void;
  hasCollapsibleColumns: boolean;
  getRowKey: (row: T, index: number) => string;
  onRowClick?: (row: T) => void;
  rowClassName?: (row: T, index: number) => string;
  emptyTitle: string;
  emptyMessage: string;
}

export function CardsTableView<T>({
  table,
  columns,
  expandedRows,
  toggleRow,
  hasCollapsibleColumns,
  getRowKey,
  onRowClick,
  rowClassName,
  emptyTitle,
  emptyMessage,
}: CardsTableViewProps<T>) {
  const rows = table.getRowModel().rows;

  return (
    <table className="min-w-full border-separate block md:table" style={{ borderSpacing: '0 0.75rem', marginTop: '-0.75rem' }}>
      <thead className="hidden md:table-header-group">
        {table.getHeaderGroups().map((headerGroup) => (
          <tr key={headerGroup.id}>
            {headerGroup.headers.map((header, hIdx) => {
              const canSort = header.column.getCanSort();
              const isSorted = header.column.getIsSorted();
              const meta = header.column.columnDef.meta;
              const align = meta?.align ?? 'left';

              const alignClass =
                align === 'right'
                  ? 'text-right justify-end'
                  : align === 'center'
                  ? 'text-center justify-center'
                  : 'text-left justify-start';

              const isFirst = hIdx === 0;
              const isLast = hIdx === headerGroup.headers.length - 1;

              return (
                <th
                  key={header.id}
                  onClick={canSort ? header.column.getToggleSortingHandler() : undefined}
                  className={`sticky top-0 z-10 bg-slate-50 p-4 text-sm font-semibold text-gray-500 uppercase tracking-wider border-b border-slate-200/90 shadow-xs ${
                    isFirst ? 'rounded-l-lg' : ''
                  } ${isLast ? 'rounded-r-lg' : ''} ${
                    canSort ? 'cursor-pointer select-none group hover:text-slate-900 hover:bg-slate-100 transition-colors' : ''
                  } ${meta?.headerClassName || ''}`}
                >
                  <div className={`flex items-center gap-1.5 ${alignClass}`}>
                    <span>
                      {header.isPlaceholder
                        ? null
                        : flexRender(header.column.columnDef.header, header.getContext())}
                    </span>
                    {canSort && (
                      <span className="text-slate-400 group-hover:text-slate-700 transition-colors">
                        {isSorted === 'asc' ? (
                          <ArrowUp size={14} className="text-blue-600 stroke-[2.5]" />
                        ) : isSorted === 'desc' ? (
                          <ArrowDown size={14} className="text-blue-600 stroke-[2.5]" />
                        ) : (
                          <ArrowUpDown size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                        )}
                      </span>
                    )}
                  </div>
                </th>
              );
            })}
          </tr>
        ))}
      </thead>

      <tbody className="block md:table-row-group">
        {rows.length > 0 ? (
          rows.map((row, rIdx) => {
            const original = row.original;
            const rowId = getRowKey(original, rIdx);
            const isExpanded = !!expandedRows[rowId];
            const cells = row.getVisibleCells();

            return (
              <tr
                key={rowId}
                onClick={onRowClick ? () => onRowClick(original) : undefined}
                className={`bg-white shadow-sm rounded-lg transition-all hover:shadow-md hover:-translate-y-px block md:table-row mb-4 md:mb-0 ${
                  onRowClick ? 'cursor-pointer' : ''
                } ${rowClassName ? rowClassName(original, rIdx) : ''}`}
              >
                {cells.map((cell, cIdx) => {
                  const isFirst = cIdx === 0;
                  const isLast = cIdx === cells.length - 1;
                  const meta = cell.column.columnDef.meta;
                  const hideOnMobile = !!meta?.hideOnMobile;
                  const mobileLabel = meta?.mobileLabel ?? (typeof cell.column.columnDef.header === 'string' ? cell.column.columnDef.header : '');
                  const hideLabel = !!meta?.hideMobileLabel;

                  const mobileDisplayClass = hideOnMobile
                    ? isExpanded
                      ? 'block md:table-cell'
                      : 'hidden md:table-cell'
                    : 'block md:table-cell';

                  const borderRoundedClass = `p-4 ${
                    isFirst ? 'md:rounded-l-lg' : ''
                  } ${isLast ? 'md:rounded-r-lg' : 'border-b border-gray-100 md:border-none'}`;

                  return (
                    <td
                      key={cell.id}
                      className={`${borderRoundedClass} ${mobileDisplayClass} ${meta?.cellClassName || ''}`}
                    >
                      {isLast ? (
                        <div className="flex justify-between md:justify-end items-center mt-2 md:mt-0">
                          {hasCollapsibleColumns && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleRow(rowId);
                              }}
                              className="md:hidden text-blue-600 font-medium text-sm flex items-center hover:bg-blue-50 px-2 py-1 rounded cursor-pointer select-none"
                            >
                              {isExpanded ? (
                                <ChevronUp size={16} className="mr-1" />
                              ) : (
                                <ChevronDown size={16} className="mr-1" />
                              )}
                              {isExpanded ? 'Menos' : 'Más'} detalles
                            </button>
                          )}
                          <div className="flex space-x-1 justify-end">
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col md:block">
                          {!hideLabel && mobileLabel && (
                            <span className="md:hidden font-semibold text-xs text-gray-500 uppercase tracking-wider mb-1">
                              {mobileLabel}
                            </span>
                          )}
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </div>
                      )}
                    </td>
                  );
                })}
              </tr>
            );
          })
        ) : (
          <TableEmpty
            emptyTitle={emptyTitle}
            emptyMessage={emptyMessage}
            isTableRow
            colSpan={columns.length}
          />
        )}
      </tbody>
    </table>
  );
}

export default CardsTableView;
