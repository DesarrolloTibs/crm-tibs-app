import { flexRender, type Table as TanStackTable, type ColumnDef } from '@tanstack/react-table';
import { ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react';
import TableEmpty from './TableEmpty';

interface FlatTableViewProps<T> {
  table: TanStackTable<T>;
  columns: ColumnDef<T, unknown>[];
  getRowKey: (row: T, index: number) => string;
  onRowClick?: (row: T) => void;
  rowClassName?: (row: T, index: number) => string;
  emptyTitle: string;
  emptyMessage: string;
}

export function FlatTableView<T>({
  table,
  columns,
  getRowKey,
  onRowClick,
  rowClassName,
  emptyTitle,
  emptyMessage,
}: FlatTableViewProps<T>) {
  const rows = table.getRowModel().rows;

  return (
    <table className="w-full text-sm text-left border-collapse">
      <thead className="bg-slate-50 border-b border-slate-200">
        {table.getHeaderGroups().map((headerGroup) => (
          <tr key={headerGroup.id}>
            {headerGroup.headers.map((header) => {
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

              return (
                <th
                  key={header.id}
                  onClick={canSort ? header.column.getToggleSortingHandler() : undefined}
                  className={`sticky top-0 z-10 bg-slate-50 px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-500 whitespace-nowrap border-b border-slate-200 shadow-xs ${
                    canSort ? 'cursor-pointer select-none group hover:text-slate-800' : ''
                  } ${meta?.headerClassName || ''}`}
                >
                  <div className={`flex items-center gap-1.5 ${alignClass}`}>
                    <span>
                      {header.isPlaceholder
                        ? null
                        : flexRender(header.column.columnDef.header, header.getContext())}
                    </span>
                    {canSort && (
                      <span className="text-slate-400 group-hover:text-slate-600 transition-colors">
                        {isSorted === 'asc' ? (
                          <ArrowUp size={13} className="text-indigo-600 stroke-[2.5]" />
                        ) : isSorted === 'desc' ? (
                          <ArrowDown size={13} className="text-indigo-600 stroke-[2.5]" />
                        ) : (
                          <ArrowUpDown size={13} className="opacity-0 group-hover:opacity-100 transition-opacity" />
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

      <tbody className="divide-y divide-slate-100">
        {rows.length > 0 ? (
          rows.map((row, rIdx) => {
            const original = row.original;
            const rowId = getRowKey(original, rIdx);

            return (
              <tr
                key={rowId}
                onClick={onRowClick ? () => onRowClick(original) : undefined}
                className={`transition-colors ${
                  onRowClick ? 'cursor-pointer hover:bg-slate-50' : 'hover:bg-slate-50/50'
                } ${rowClassName ? rowClassName(original, rIdx) : ''}`}
              >
                {row.getVisibleCells().map((cell) => {
                  const meta = cell.column.columnDef.meta;
                  return (
                    <td
                      key={cell.id}
                      className={`px-4 py-3.5 text-slate-700 ${meta?.cellClassName || ''}`}
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  );
                })}
              </tr>
            );
          })
        ) : (
          <tr>
            <td colSpan={columns.length} className="p-0">
              <TableEmpty emptyTitle={emptyTitle} emptyMessage={emptyMessage} />
            </td>
          </tr>
        )}
      </tbody>
    </table>
  );
}

export default FlatTableView;
