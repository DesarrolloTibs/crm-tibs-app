import React from 'react';
import SkeletonLoader from './SkeletonLoader';
import EmptyState from './EmptyState';

export interface TableColumn<T> {
  key: string;
  header: string;
  width?: string;
  render: (row: T, index: number) => React.ReactNode;
  sortable?: boolean;
}

interface TableProps<T> {
  columns: TableColumn<T>[];
  data: T[];
  loading?: boolean;
  emptyTitle?: string;
  emptyMessage?: string;
  keyExtractor: (row: T, index: number) => string | number;
  skeletonRows?: number;
  onRowClick?: (row: T) => void;
  rowClassName?: (row: T) => string;
  stickyHeader?: boolean;
}

function Table<T>({
  columns,
  data,
  loading = false,
  emptyTitle = 'Sin resultados',
  emptyMessage = 'No hay registros que mostrar.',
  keyExtractor,
  skeletonRows = 5,
  onRowClick,
  rowClassName,
  stickyHeader = false,
}: TableProps<T>) {
  if (loading) {
    return (
      <div className="w-full overflow-x-auto rounded-2xl border border-slate-100">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-100">
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-slate-500"
                  style={col.width ? { width: col.width } : undefined}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <SkeletonLoader variant="table-row" count={skeletonRows} columns={columns.length} />
          </tbody>
        </table>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="w-full overflow-x-auto rounded-2xl border border-slate-100">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-100">
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-slate-500"
                  style={col.width ? { width: col.width } : undefined}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
        </table>
        <EmptyState title={emptyTitle} message={emptyMessage} />
      </div>
    );
  }

  return (
    <div className="w-full overflow-x-auto rounded-2xl border border-slate-100">
      <table className="w-full text-sm">
        <thead
          className={`bg-slate-50 border-b border-slate-100 ${
            stickyHeader ? 'sticky top-0 z-10' : ''
          }`}
        >
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-slate-500 whitespace-nowrap"
                style={col.width ? { width: col.width } : undefined}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {data.map((row, index) => (
            <tr
              key={keyExtractor(row, index)}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
              className={`transition-colors ${
                onRowClick ? 'cursor-pointer hover:bg-slate-50' : 'hover:bg-slate-50/50'
              } ${rowClassName ? rowClassName(row) : ''}`}
            >
              {columns.map((col) => (
                <td key={col.key} className="px-4 py-3 text-slate-700">
                  {col.render(row, index)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default Table;
