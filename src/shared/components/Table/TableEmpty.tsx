import React from 'react';
import { Inbox } from 'lucide-react';

interface TableEmptyProps {
  emptyTitle: string;
  emptyMessage: string;
  isTableRow?: boolean;
  colSpan?: number;
}

export const TableEmpty: React.FC<TableEmptyProps> = ({
  emptyTitle,
  emptyMessage,
  isTableRow = false,
  colSpan = 1,
}) => {
  const content = (
    <div className="flex flex-col items-center justify-center text-center text-gray-500 w-full mx-auto py-16 px-6">
      <Inbox size={48} className="mb-4 mx-auto text-gray-400" />
      <h3 className="text-xl font-semibold text-center w-full text-gray-700">{emptyTitle}</h3>
      <p className="text-sm text-center w-full mt-1 text-gray-400">{emptyMessage}</p>
    </div>
  );

  if (isTableRow) {
    return (
      <tr className="block md:table-row w-full">
        <td colSpan={colSpan} className="text-center py-4 block md:table-cell w-full">
          {content}
        </td>
      </tr>
    );
  }

  return content;
};

export default TableEmpty;
