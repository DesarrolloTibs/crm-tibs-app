import React, { useMemo } from 'react';
import type { Expense } from '../../core/models/Expense';
import { Edit, Trash2, Inbox, Calendar, Briefcase } from 'lucide-react';
import Table, { type ColumnDef } from '../shared/Table';

interface Props {
  expenses: Expense[];
  onEdit: (expense: Expense) => void;
  onDelete: (expense: Expense) => void;
  onUploadReceipt: (expense: Expense) => void;
  currentPage?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
  maxHeight?: string;
  loading?: boolean;
}

const ExpensesTable: React.FC<Props> = ({
  expenses,
  onEdit,
  onDelete,
  onUploadReceipt,
  currentPage,
  totalPages,
  onPageChange,
  maxHeight,
  loading = false,
}) => {
  const columns = useMemo<ColumnDef<Expense>[]>(
    () => [
      {
        accessorKey: 'fecha',
        header: 'Fecha',
        cell: ({ row }) => (
          <div className="flex items-center text-gray-700">
            <Calendar size={16} className="mr-2 text-gray-400 shrink-0" />
            {new Date(row.original.fecha + 'T12:00:00').toLocaleDateString()}
          </div>
        ),
        meta: {
          mobileLabel: 'Fecha',
        },
      },
      {
        accessorKey: 'concepto',
        header: 'Concepto',
        cell: ({ getValue }) => (
          <p className="font-semibold text-gray-900">{getValue<string>()}</p>
        ),
        meta: {
          mobileLabel: 'Concepto',
        },
      },
      {
        id: 'usuario',
        header: 'Usuario',
        cell: ({ row }) => {
          const usuario = row.original.usuario;
          const isSuper =
            (usuario as { role?: string } | undefined)?.role?.toLowerCase() ===
            'superadmin';
          const name = !usuario || isSuper ? 'Sistema' : usuario.username;
          return <p className="text-gray-700 font-medium">{name}</p>;
        },
        meta: {
          mobileLabel: 'Usuario',
        },
      },
      {
        accessorKey: 'monto',
        header: 'Monto',
        cell: ({ getValue }) => {
          const amount = Number(getValue<number>() || 0);
          return (
            <div className="flex items-center font-medium text-emerald-600">
              {new Intl.NumberFormat('es-MX', {
                style: 'currency',
                currency: 'MXN',
              }).format(amount)}
            </div>
          );
        },
        meta: {
          mobileLabel: 'Monto',
        },
      },
      {
        id: 'asociado',
        header: 'Asociado A',
        cell: ({ row }) => {
          const expense = row.original;
          if (expense.client) {
            return (
              <span className="flex items-center text-blue-600 bg-blue-50 px-2 py-1 rounded text-sm w-fit">
                <Briefcase size={14} className="mr-1 shrink-0" />
                Cliente: {expense.client.nombre} {expense.client.apellido}
              </span>
            );
          }
          if (expense.opportunity) {
            return (
              <span className="flex items-center text-purple-600 bg-purple-50 px-2 py-1 rounded text-sm w-fit">
                <Briefcase size={14} className="mr-1 shrink-0" />
                Oportunidad: {expense.opportunity.nombre_proyecto}
              </span>
            );
          }
          return <span className="text-gray-400 italic">Sin asociación</span>;
        },
        meta: {
          mobileLabel: 'Asociado A',
          hideOnMobile: true,
        },
      },
      {
        id: 'acciones',
        header: '',
        enableSorting: false,
        meta: {
          align: 'right',
        },
        cell: ({ row }) => {
          const expense = row.original;
          return (
            <div className="flex space-x-1 justify-end">
              <button
                onClick={() => onUploadReceipt(expense)}
                className={`p-2 rounded-full cursor-pointer transition-colors ${
                  expense.receiptUrl
                    ? 'text-green-600 hover:bg-green-100'
                    : 'text-gray-400 hover:text-blue-600 hover:bg-blue-100'
                }`}
                title={
                  expense.receiptUrl
                    ? 'Ver/Actualizar Comprobante'
                    : 'Subir Comprobante'
                }
              >
                <div className="relative">
                  <Inbox size={18} />
                  {expense.receiptUrl && (
                    <span className="absolute -top-1 -right-1 block h-2 w-2 rounded-full bg-green-500 ring-2 ring-white"></span>
                  )}
                </div>
              </button>
              <button
                onClick={() => onEdit(expense)}
                className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-100 rounded-full cursor-pointer transition-colors"
                title="Editar"
              >
                <Edit size={18} />
              </button>
              <button
                onClick={() => onDelete(expense)}
                className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-100 rounded-full cursor-pointer transition-colors"
                title="Eliminar"
              >
                <Trash2 size={18} />
              </button>
            </div>
          );
        },
      },
    ],
    [onEdit, onDelete, onUploadReceipt]
  );

  const isExternalPagination =
    typeof totalPages === 'number' && typeof onPageChange === 'function';

  return (
    <Table
      data={expenses}
      columns={columns}
      variant="cards"
      loading={loading}
      emptyTitle="No se encontraron gastos"
      emptyMessage="Registra un nuevo gasto para comenzar."
      enablePagination={!isExternalPagination}
      initialPageSize={10}
      currentPage={currentPage}
      totalPages={totalPages}
      onPageChange={onPageChange}
      maxHeight={maxHeight}
    />
  );
};

export default ExpensesTable;
