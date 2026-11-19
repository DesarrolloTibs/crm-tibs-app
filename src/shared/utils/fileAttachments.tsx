import {
  FileText,
  FileSpreadsheet,
  FileArchive,
  Image,
  File,
  Download,
  Trash2,
} from 'lucide-react';
import type { ColumnDef } from '@shared/components/Table';
import Button from '@shared/components/Button';
import Loader from '@shared/components/Loader';

export interface BaseAttachmentRecord {
  id: string;
  fileName: string;
  title: string | null;
}

/**
 * Devuelve el icono representativo según la extensión del archivo adjunto.
 */
export const getFileAttachmentIcon = (fileName: string, size = 20) => {
  const ext = fileName.split('.').pop()?.toLowerCase() || '';
  if (ext === 'pdf') {
    return <FileText size={size} className="text-red-500 shrink-0" />;
  }
  if (['doc', 'docx', 'odt'].includes(ext)) {
    return <FileText size={size} className="text-blue-500 shrink-0" />;
  }
  if (['xls', 'xlsx', 'ods', 'csv'].includes(ext)) {
    return <FileSpreadsheet size={size} className="text-green-500 shrink-0" />;
  }
  if (['zip', 'rar', 'tar', 'gz', '7z'].includes(ext)) {
    return <FileArchive size={size} className="text-yellow-600 shrink-0" />;
  }
  if (['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp'].includes(ext)) {
    return <Image size={size} className="text-purple-500 shrink-0" />;
  }
  return <File size={size} className="text-gray-500 shrink-0" />;
};

/**
 * Formatea una fecha ISO o `YYYY-MM-DD` de archivo adjunto para visualización tabular.
 */
export const formatAttachmentDate = (dateString: string | null | undefined): string => {
  if (!dateString) return 'Sin fecha';
  try {
    const parts = dateString.split('-');
    if (parts.length === 3 && parts[2].length <= 2) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return new Date(dateString).toLocaleDateString();
  } catch {
    return dateString;
  }
};

interface BuildFileAttachmentColumnsOptions<T extends BaseAttachmentRecord> {
  dateHeader: string;
  getDateValue: (row: T) => string | null | undefined;
  downloadingFileId: string | null;
  deletingFileId: string | null;
  onDownload: (row: T) => void;
  onDelete: (row: T) => void;
}

/**
 * Construye columnas TanStack Table reutilizables para listados de archivos adjuntos y fichas técnicas.
 */
export function buildFileAttachmentColumns<T extends BaseAttachmentRecord>({
  dateHeader,
  getDateValue,
  downloadingFileId,
  deletingFileId,
  onDownload,
  onDelete,
}: BuildFileAttachmentColumnsOptions<T>): ColumnDef<T, unknown>[] {
  return [
    {
      id: 'fileName',
      accessorKey: 'fileName',
      header: 'Archivo',
      cell: ({ row }) => {
        const file = row.original;
        return (
          <div className="flex items-center gap-2 max-w-[200px] sm:max-w-[260px]">
            {getFileAttachmentIcon(file.fileName)}
            <span className="font-semibold text-slate-700 truncate text-xs" title={file.fileName}>
              {file.fileName}
            </span>
          </div>
        );
      },
      meta: {
        mobileLabel: 'Archivo',
        headerClassName: 'text-left',
      },
    },
    {
      id: 'title',
      accessorKey: 'title',
      header: 'Título / Etiqueta',
      cell: ({ row }) => {
        const title = row.original.title;
        return title ? (
          <span className="text-slate-600 font-medium text-xs truncate block max-w-[180px]">
            {title}
          </span>
        ) : (
          <span className="italic text-slate-400 text-xs">Sin etiqueta</span>
        );
      },
      meta: {
        mobileLabel: 'Título / Etiqueta',
        headerClassName: 'text-left',
      },
    },
    {
      id: 'date',
      accessorFn: (row) => getDateValue(row) || '',
      header: dateHeader,
      cell: ({ row }) => (
        <span className="text-slate-500 font-medium text-xs whitespace-nowrap">
          {formatAttachmentDate(getDateValue(row.original))}
        </span>
      ),
      meta: {
        mobileLabel: dateHeader,
        headerClassName: 'text-left',
      },
    },
    {
      id: 'actions',
      header: 'Acciones',
      enableSorting: false,
      cell: ({ row }) => {
        const file = row.original;
        const isBusy = downloadingFileId === file.id || deletingFileId === file.id;
        return (
          <div className="inline-flex justify-end gap-1">
            <Button
              type="button"
              variant="icon"
              onClick={(e) => {
                e.stopPropagation();
                onDownload(file);
              }}
              disabled={isBusy}
              className="!p-1.5 !text-indigo-500 hover:!text-indigo-700 hover:!bg-indigo-50"
              title="Descargar archivo"
            >
              {downloadingFileId === file.id ? (
                <Loader inline size="xs" colorClassName="text-indigo-500" />
              ) : (
                <Download size={15} />
              )}
            </Button>
            <Button
              type="button"
              variant="icon"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(file);
              }}
              disabled={isBusy}
              className="!p-1.5 !text-red-500 hover:!text-red-700 hover:!bg-red-50"
              title="Eliminar archivo"
            >
              {deletingFileId === file.id ? (
                <Loader inline size="xs" colorClassName="text-red-500" />
              ) : (
                <Trash2 size={15} />
              )}
            </Button>
          </div>
        );
      },
      meta: {
        mobileLabel: 'Acciones',
        align: 'right',
        headerClassName: 'text-right',
        cellClassName: 'text-right',
      },
    },
  ];
}
