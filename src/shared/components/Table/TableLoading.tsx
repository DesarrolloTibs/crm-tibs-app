import type { ColumnDef } from './types';
import SkeletonLoader from '../SkeletonLoader';

interface TableLoadingProps<T> {
  columns: ColumnDef<T, unknown>[];
  variant?: 'cards' | 'flat';
  skeletonRows?: number;
  containerClassName?: string;
}

export function TableLoading<T>({
  columns,
  variant = 'cards',
  skeletonRows = 5,
  containerClassName = '',
}: TableLoadingProps<T>) {
  if (variant === 'cards') {
    return (
      <div className={`flex flex-col w-full ${containerClassName}`}>
        <div className="overflow-x-auto">
          <table className="min-w-full border-separate block md:table" style={{ borderSpacing: '0 0.75rem' }}>
            <thead className="hidden md:table-header-group">
              <tr>
                {columns.map((col, idx) => (
                  <th
                    key={col.id ?? idx}
                    className="p-4 text-left text-sm font-semibold text-gray-500 uppercase tracking-wider"
                  >
                    {typeof col.header === 'string' ? col.header : ''}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="block md:table-row-group">
              {Array.from({ length: skeletonRows }).map((_, i) => (
                <tr key={i} className="bg-white shadow-sm rounded-lg block md:table-row mb-4 md:mb-0 p-4">
                  {columns.map((_, cIdx) => (
                    <td key={cIdx} className="p-4 block md:table-cell">
                      <div className="h-4 bg-slate-100 rounded-lg animate-pulse" />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex flex-col w-full ${containerClassName}`}>
      <div className="w-full overflow-x-auto rounded-2xl border border-slate-100 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-100">
            <tr>
              {columns.map((col, idx) => (
                <th
                  key={col.id ?? idx}
                  className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-slate-500"
                >
                  {typeof col.header === 'string' ? col.header : ''}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <SkeletonLoader variant="table-row" count={skeletonRows} columns={columns.length} />
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default TableLoading;
