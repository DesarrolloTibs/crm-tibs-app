import React, { useMemo, useState, useCallback } from 'react';
import {
  Mic,
  RefreshCw,
  X,
  AlertTriangle,
  Clock,
  Activity,
  CheckCircle2,
  HardDrive,
  ChevronRight,
  RotateCcw,
  Building2,
  ListChecks,
  Filter,
} from 'lucide-react';
import Modal from '@shared/components/Modal';
import Badge from '@shared/components/Badge';
import Button from '@shared/components/Button';
import Input from '@shared/components/Input';
import Tabs, { type Tab } from '@shared/components/Tabs';
import Loader from '@shared/components/Loader';
import EmptyState from '@shared/components/EmptyState';
import Table, { type ColumnDef } from '@shared/components/Table';
import Select from '@shared/components/Select';
import KpiCard from '@shared/components/KpiCard';
import {
  WhatsAppLogo,
  FacebookLogo,
  InstagramLogo,
  WebchatLogo,
} from '@shared/components/ChannelIcons';
import type {
  TenantPlanInfo,
  AudioUsageReportResponse,
  AudioUsageByTenant,
  AudioUsageLog,
} from '../schemas/tenants.schema';
import {
  formatAudioDuration,
  formatAudioBytes,
  getAudioChannelInfo,
} from '../utils/tenants.helpers';

interface TenantAudioUsageModalProps {
  open: boolean;
  onClose: () => void;
  tenants: TenantPlanInfo[];
  report: AudioUsageReportResponse | null;
  loading: boolean;
  selectedTenantId: number | null;
  startDate: string;
  endDate: string;
  onFilterChange: (filters: {
    tenantId: number | null;
    startDate: string;
    endDate: string;
  }) => void;
  onReload: () => void;
}

/**
 * Resuelve metadatos de organización soportando tanto `tenant_schema` (API real) como `schema_name`.
 */
const resolveTenantRowMeta = (tenants: TenantPlanInfo[], raw: Record<string, any>) => {
  const rawId = raw.tenant_id ?? raw.tenantId;
  const rawSchema =
    raw.tenant_schema || raw.tenantSchema || raw.schema_name || raw.schemaName || null;
  const rawName = raw.tenant_name || raw.tenantName || null;

  const matchedTenant = tenants.find(
    (t) =>
      (rawId !== undefined && rawId !== null && t.id === Number(rawId)) ||
      (rawSchema && t.schema_name === rawSchema) ||
      (rawName && t.name === rawName)
  );

  return {
    tenantId: rawId ?? matchedTenant?.id ?? null,
    name: rawName || matchedTenant?.name || rawSchema || 'Organización',
    schema: rawSchema || matchedTenant?.schema_name || null,
    ibmAudioEnabled:
      raw.ibm_audio_enabled !== undefined && raw.ibm_audio_enabled !== null
        ? Boolean(raw.ibm_audio_enabled)
        : matchedTenant?.ibm_audio_enabled,
  };
};

const renderChannelIcon = (kind: ReturnType<typeof getAudioChannelInfo>['kind']) => {
  switch (kind) {
    case 'whatsapp':
      return <WhatsAppLogo size={13} className="text-emerald-600 shrink-0" />;
    case 'messenger':
      return <FacebookLogo size={13} className="text-[#1877F2] shrink-0" />;
    case 'instagram':
      return <InstagramLogo size={13} className="text-pink-600 shrink-0" />;
    case 'webchat':
      return <WebchatLogo size={13} className="text-indigo-600 shrink-0" />;
    default:
      return <Activity size={13} className="text-slate-500 shrink-0" />;
  }
};

export const TenantAudioUsageModal: React.FC<TenantAudioUsageModalProps> = ({
  open,
  onClose,
  tenants,
  report,
  loading,
  selectedTenantId,
  startDate,
  endDate,
  onFilterChange,
  onReload,
}) => {
  const [activeTabIndex, setActiveTabIndex] = useState<number>(0);

  const tenantOptions = useMemo(() => {
    const base = [{ value: 'all', label: 'Todas las organizaciones (Global)' }];
    const items = tenants.map((t) => ({
      value: String(t.id),
      label: `${t.name} (${t.schema_name})`,
    }));
    return [...base, ...items];
  }, [tenants]);

  const selectedTenantObj = useMemo(() => {
    if (!selectedTenantId) return null;
    return tenants.find((t) => t.id === selectedTenantId) || null;
  }, [tenants, selectedTenantId]);

  const summary = report?.summary;
  const byTenant = report?.by_tenant || [];
  const byChannel = report?.by_channel || [];
  const recentLogs = report?.recent_logs || [];

  // Mostrar columna de volumen por organización solo si el backend envía métrica de bytes en by_tenant
  const hasTenantBytes = useMemo(
    () =>
      byTenant.some((row: any) => {
        const val = row?.total_bytes ?? row?.audio_bytes ?? row?.bytes;
        return val !== undefined && val !== null;
      }),
    [byTenant]
  );

  const handleInspectTenant = useCallback(
    (item: AudioUsageByTenant) => {
      const { tenantId } = resolveTenantRowMeta(tenants, item as any);
      if (!tenantId) return;

      onFilterChange({
        tenantId: Number(tenantId),
        startDate,
        endDate,
      });
      setActiveTabIndex(1);
    },
    [tenants, onFilterChange, startDate, endDate]
  );

  const byTenantColumns = useMemo<ColumnDef<AudioUsageByTenant, unknown>[]>(
    () => [
      {
        id: 'tenant_name',
        accessorFn: (row) => row.tenant_name || row.tenant_schema || row.schema_name || '',
        header: 'Organización',
        cell: ({ row }) => {
          const { name, schema, ibmAudioEnabled } = resolveTenantRowMeta(
            tenants,
            row.original as any
          );

          return (
            <div className="flex items-center gap-3 py-0.5">
              <div className="w-8 h-8 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center shrink-0 text-indigo-600 shadow-2xs">
                <Building2 size={15} />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-slate-800 text-xs truncate">{name}</span>
                  {ibmAudioEnabled !== undefined && ibmAudioEnabled !== null && (
                    <Badge
                      variant={ibmAudioEnabled ? 'success' : 'neutral'}
                      size="sm"
                      dot
                    >
                      {ibmAudioEnabled ? 'Add-on activo' : 'Inactivo'}
                    </Badge>
                  )}
                </div>
                {schema && (
                  <div className="text-[11px] font-mono text-indigo-600 truncate">
                    {schema}
                  </div>
                )}
              </div>
            </div>
          );
        },
        meta: {
          mobileLabel: 'Organización',
          align: 'left',
          headerClassName: 'text-left min-w-[200px]',
          cellClassName: 'text-left',
        },
      },
      {
        id: 'total_requests',
        accessorKey: 'total_requests',
        header: 'Solicitudes',
        cell: ({ row }) => {
          const item = row.original as any;
          const totalReq = Number(item.total_requests ?? 0);
          const okReq = item.successful_requests;
          return (
            <div className="inline-flex flex-col items-center">
              <span className="font-mono font-bold text-slate-800 text-xs tabular-nums">
                {totalReq.toLocaleString()}
              </span>
              {okReq !== undefined && okReq !== null && (
                <span className="text-[10px] text-emerald-700 font-semibold">
                  {Number(okReq).toLocaleString()} exitosas
                </span>
              )}
            </div>
          );
        },
        meta: {
          mobileLabel: 'Solicitudes',
          align: 'center',
          headerClassName: 'text-center min-w-[110px]',
          cellClassName: 'text-center',
        },
      },
      {
        id: 'total_minutes',
        accessorKey: 'total_minutes',
        header: 'Minutos',
        cell: ({ row }) => (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-lg bg-indigo-50/80 border border-indigo-100 font-mono font-bold text-indigo-700 text-xs tabular-nums">
            {Number(row.original.total_minutes || 0).toFixed(2)} min
          </span>
        ),
        meta: {
          mobileLabel: 'Minutos',
          align: 'right',
          headerClassName: 'text-right min-w-[115px]',
          cellClassName: 'text-right',
        },
      },
      {
        id: 'total_seconds',
        accessorKey: 'total_seconds',
        header: 'Duración',
        cell: ({ row }) => {
          const secs = Number(row.original.total_seconds || 0);
          const rounded = Math.round(secs);
          return (
            <div className="text-right">
              <span className="font-mono font-semibold text-xs text-slate-800 tabular-nums block">
                {formatAudioDuration(secs)}
              </span>
              {rounded >= 60 && (
                <span className="text-[10px] font-mono text-slate-400 tabular-nums">
                  {rounded.toLocaleString()}s totales
                </span>
              )}
            </div>
          );
        },
        meta: {
          mobileLabel: 'Duración',
          align: 'right',
          headerClassName: 'text-right min-w-[110px]',
          cellClassName: 'text-right',
        },
      },
      ...(hasTenantBytes
        ? [
            {
              id: 'total_bytes',
              header: 'Volumen',
              cell: ({ row }: { row: { original: AudioUsageByTenant } }) => {
                const raw = row.original as any;
                const bytes = raw.total_bytes ?? raw.audio_bytes ?? raw.bytes;
                return (
                  <span className="font-mono text-xs text-slate-600 tabular-nums">
                    {bytes !== undefined && bytes !== null ? formatAudioBytes(bytes) : '—'}
                  </span>
                );
              },
              meta: {
                mobileLabel: 'Volumen',
                align: 'right',
                headerClassName: 'text-right min-w-[100px]',
                cellClassName: 'text-right',
              },
            } as ColumnDef<AudioUsageByTenant, unknown>,
          ]
        : []),
      {
        id: 'actions',
        header: 'Detalle',
        enableSorting: false,
        cell: ({ row }) => {
          const { tenantId } = resolveTenantRowMeta(tenants, row.original as any);
          if (!tenantId) return <span className="text-xs text-slate-300">—</span>;

          const isAlreadyFiltered = selectedTenantId === Number(tenantId);

          return (
            <div className="flex justify-end">
              <Button
                variant="secondary"
                onClick={(e) => {
                  e.stopPropagation();
                  handleInspectTenant(row.original);
                }}
                title="Filtrar por esta organización y ver registros recientes"
                className={`!py-1 !px-2.5 !text-xs !font-semibold !normal-case !tracking-normal !rounded-lg gap-1 shadow-2xs ${
                  isAlreadyFiltered
                    ? '!bg-indigo-50 !text-indigo-700 !border-indigo-200'
                    : '!border-slate-200 hover:!border-indigo-200 hover:!bg-indigo-50 hover:!text-indigo-700'
                }`}
              >
                <span>{isAlreadyFiltered ? 'Ver registros' : 'Inspeccionar'}</span>
                <ChevronRight size={12} />
              </Button>
            </div>
          );
        },
        meta: {
          mobileLabel: 'Detalle',
          align: 'right',
          headerClassName: 'text-right w-36',
          cellClassName: 'text-right w-36',
        },
      },
    ],
    [tenants, hasTenantBytes, selectedTenantId, handleInspectTenant]
  );

  const recentLogsColumns = useMemo<ColumnDef<AudioUsageLog, unknown>[]>(
    () => [
      {
        id: 'created_at',
        accessorFn: (row: any) => row.created_at || row.createdAt || '',
        header: 'Fecha / Hora',
        cell: ({ row }) => {
          const raw = row.original as any;
          const dt = raw.created_at || raw.createdAt;
          if (!dt) return <span className="text-xs text-slate-400">—</span>;
          return (
            <span className="text-[11px] text-slate-700 font-mono font-semibold whitespace-nowrap">
              {new Date(dt).toLocaleString('es-MX', {
                day: '2-digit',
                month: 'short',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
          );
        },
        meta: {
          mobileLabel: 'Fecha / Hora',
          align: 'left',
          headerClassName: 'text-left min-w-[130px]',
          cellClassName: 'text-left',
        },
      },
      {
        id: 'tenant',
        header: 'Organización',
        cell: ({ row }) => {
          const { name, schema } = resolveTenantRowMeta(tenants, row.original as any);
          return (
            <div className="min-w-0">
              <div className="text-xs font-bold text-slate-800 truncate">{name}</div>
              {schema && <div className="text-[10px] font-mono text-indigo-600 truncate">{schema}</div>}
            </div>
          );
        },
        meta: {
          mobileLabel: 'Organización',
          align: 'left',
          headerClassName: 'text-left min-w-[160px]',
          cellClassName: 'text-left',
        },
      },
      {
        id: 'channel',
        accessorKey: 'channel',
        header: 'Canal',
        cell: ({ row }) => {
          const meta = getAudioChannelInfo(row.original.channel);
          return (
            <Badge variant={meta.variant} size="sm">
              {renderChannelIcon(meta.kind)}
              <span>{meta.label}</span>
            </Badge>
          );
        },
        meta: {
          mobileLabel: 'Canal',
          align: 'left',
          headerClassName: 'text-left min-w-[145px]',
          cellClassName: 'text-left',
        },
      },
      {
        id: 'duration_seconds',
        accessorFn: (row: any) => row.duration_seconds ?? row.durationSeconds ?? row.seconds ?? 0,
        header: 'Duración',
        cell: ({ row }) => {
          const raw = row.original as any;
          const secs = raw.duration_seconds ?? raw.durationSeconds ?? raw.seconds ?? 0;
          return (
            <span className="font-mono text-xs font-bold text-slate-800 tabular-nums">
              {formatAudioDuration(secs)}
            </span>
          );
        },
        meta: {
          mobileLabel: 'Duración',
          align: 'right',
          headerClassName: 'text-right min-w-[95px]',
          cellClassName: 'text-right',
        },
      },
      {
        id: 'audio_bytes',
        accessorFn: (row: any) => row.audio_bytes ?? row.audioBytes ?? row.bytes ?? 0,
        header: 'Tamaño',
        cell: ({ row }) => {
          const raw = row.original as any;
          const bytes = raw.audio_bytes ?? raw.audioBytes ?? raw.bytes;
          return (
            <span className="font-mono text-xs text-slate-500 tabular-nums">
              {bytes !== undefined && bytes !== null ? formatAudioBytes(bytes) : '—'}
            </span>
          );
        },
        meta: {
          mobileLabel: 'Tamaño',
          align: 'right',
          headerClassName: 'text-right min-w-[95px]',
          cellClassName: 'text-right',
        },
      },
      {
        id: 'has_speech',
        header: 'Resultado',
        cell: ({ row }) => {
          const raw = row.original as any;
          const speechRaw =
            raw.has_speech ?? raw.hasSpeech ?? raw.speech_detected ?? raw.speechDetected;
          const ok = raw.success !== false;
          if (!ok) {
            return (
              <span title={raw.error_message || undefined} className="inline-flex">
                <Badge variant="error" size="sm" dot>
                  Error
                </Badge>
              </span>
            );
          }
          if (speechRaw === undefined || speechRaw === null) {
            return (
              <Badge variant="neutral" size="sm" dot>
                Procesado
              </Badge>
            );
          }
          const hasSpeech = typeof speechRaw === 'string' ? speechRaw === 'true' : Boolean(speechRaw);
          return (
            <Badge variant={hasSpeech ? 'success' : 'warning'} size="sm" dot>
              {hasSpeech ? 'Voz detectada' : 'Sin voz / Silencio'}
            </Badge>
          );
        },
        meta: {
          mobileLabel: 'Resultado',
          align: 'center',
          headerClassName: 'text-center min-w-[140px]',
          cellClassName: 'text-center',
        },
      },
    ],
    [tenants]
  );

  const auditTabs: Tab[] = useMemo(
    () => [
      {
        label: `Por Organización (${byTenant.length})`,
        icon: <Building2 size={15} />,
        content: (
          <Table<AudioUsageByTenant>
            columns={byTenantColumns}
            data={byTenant}
            variant="flat"
            maxHeight="320px"
            minHeight="0px"
            onRowClick={handleInspectTenant}
            emptyTitle="Sin consumo registrado"
            emptyMessage="No hay peticiones de audio registradas para los filtros seleccionados."
            keyExtractor={(item, idx) =>
              `${item.tenant_id ?? item.tenant_schema ?? item.schema_name ?? idx}`
            }
            enablePagination
            initialPageSize={10}
            footerRow={({ visibleData }) => {
              const totalReq = visibleData.reduce(
                (acc, r) => acc + Number(r.total_requests || 0),
                0
              );
              const totalMin = visibleData.reduce(
                (acc, r) => acc + Number(r.total_minutes || 0),
                0
              );
              const totalSec = visibleData.reduce(
                (acc, r) => acc + Number(r.total_seconds || 0),
                0
              );
              const totalBytes = visibleData.reduce((acc, r: any) => {
                const b = r.total_bytes ?? r.audio_bytes ?? r.bytes ?? 0;
                return acc + Number(b || 0);
              }, 0);

              return (
                <tr className="bg-slate-100/95 backdrop-blur-xs border-t-2 border-slate-300 text-slate-800 shadow-xs">
                  <td className="px-4 py-3 text-slate-800 font-bold text-xs uppercase tracking-wider">
                    <div className="flex items-center gap-2">
                      <Building2 size={14} className="text-indigo-600 shrink-0" />
                      <span>Total Visible:</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center font-mono font-bold text-xs text-slate-900 tabular-nums">
                    {totalReq.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-right font-mono font-bold text-xs text-indigo-700 tabular-nums">
                    {totalMin.toFixed(2)} min
                  </td>
                  <td className="px-4 py-3 text-right font-mono font-semibold text-xs text-slate-800 tabular-nums">
                    {formatAudioDuration(totalSec)}
                  </td>
                  {hasTenantBytes && (
                    <td className="px-4 py-3 text-right font-mono text-xs text-slate-600 tabular-nums">
                      {formatAudioBytes(totalBytes)}
                    </td>
                  )}
                  <td className="px-4 py-3 text-right">
                    <Badge variant="indigo" size="sm" className="font-bold">
                      {visibleData.length} en página
                    </Badge>
                  </td>
                </tr>
              );
            }}
          />
        ),
      },
      {
        label: `Registros Recientes (${recentLogs.length})`,
        icon: <ListChecks size={15} />,
        content: (
          <Table<AudioUsageLog>
            columns={recentLogsColumns}
            data={recentLogs}
            variant="flat"
            maxHeight="320px"
            minHeight="0px"
            emptyTitle="Sin registros recientes"
            emptyMessage="No hay registros de transcripción recientes para los filtros seleccionados."
            keyExtractor={(item, idx) => String(item.id ?? idx)}
            enablePagination
            initialPageSize={10}
            footerRow={({ visibleData }) => {
              const visibleSec = visibleData.reduce((acc, r: any) => {
                const s = r.duration_seconds ?? r.durationSeconds ?? r.seconds ?? 0;
                return acc + Number(s || 0);
              }, 0);
              const visibleBytes = visibleData.reduce((acc, r: any) => {
                const b = r.audio_bytes ?? r.audioBytes ?? r.bytes ?? 0;
                return acc + Number(b || 0);
              }, 0);

              return (
                <tr className="bg-slate-100/95 backdrop-blur-xs border-t-2 border-slate-300 text-slate-800 shadow-xs">
                  <td colSpan={3} className="px-4 py-3 text-slate-800 font-bold text-xs uppercase tracking-wider">
                    <div className="flex items-center gap-2">
                      <Activity size={14} className="text-indigo-600 shrink-0" />
                      <span>Total Registros Visibles:</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right font-mono font-bold text-xs text-slate-900 tabular-nums">
                    {formatAudioDuration(visibleSec)}
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-xs text-slate-600 tabular-nums">
                    {formatAudioBytes(visibleBytes)}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <Badge variant="indigo" size="sm" className="font-bold">
                      {visibleData.length} en página
                    </Badge>
                  </td>
                </tr>
              );
            }}
          />
        ),
      },
    ],
    [byTenant, recentLogs, byTenantColumns, recentLogsColumns, handleInspectTenant, hasTenantBytes]
  );

  return (
    <Modal
      open={open}
      onClose={onClose}
      maxWidth="max-w-6xl"
      height="h-auto max-h-[92vh]"
      padding="p-6"
      hideCloseButton={true}
      className="rounded-2xl shadow-2xl"
    >
      <div className="space-y-5">
        {/* Cabecera */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-700 shrink-0">
              <Mic size={22} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 flex flex-wrap items-center gap-2">
                Auditoría de Uso de Audio (IBM Speech-to-Text)
                <Badge variant="indigo" size="sm">Solo SuperAdmin</Badge>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Control interno de minutos, segundos y peticiones procesadas por organización y canal. No descuenta tokens del plan del cliente.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
            <Button
              variant="secondary"
              onClick={onReload}
              disabled={loading}
              title="Recargar auditoría de audio"
              className="!py-2 !px-3 !text-xs !normal-case !tracking-normal !font-semibold !border-slate-300 !rounded-xl text-slate-700 shadow-2xs gap-1.5"
            >
              <RefreshCw
                size={14}
                className={loading ? 'animate-spin text-indigo-600' : 'text-slate-500'}
              />
              <span>Actualizar</span>
            </Button>

            <Button
              variant="icon"
              onClick={onClose}
              className="!text-slate-400 hover:!text-slate-700 !p-1.5 hover:!bg-slate-100 !rounded-xl"
              title="Cerrar auditoría"
            >
              <X size={18} />
            </Button>
          </div>
        </div>

        {/* Barra de Filtros con Componentes Compartidos (Select e Input) */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 bg-slate-50/80 p-3.5 rounded-2xl border border-slate-200/80 items-end">
          <div className="md:col-span-2">
            <Select
              label="Organización"
              value={tenantOptions.find(
                (opt) => opt.value === (selectedTenantId ? String(selectedTenantId) : 'all')
              )}
              onChange={(selected: any) => {
                const val = selected?.value;
                onFilterChange({
                  tenantId: val && val !== 'all' ? Number(val) : null,
                  startDate,
                  endDate,
                });
              }}
              options={tenantOptions}
              isSearchable={true}
            />
          </div>

          <Input
            type="date"
            label="Desde"
            value={startDate}
            onChange={(e) =>
              onFilterChange({
                tenantId: selectedTenantId,
                startDate: e.target.value,
                endDate,
              })
            }
            className="bg-white"
          />

          <div className="flex items-end gap-2">
            <Input
              type="date"
              label="Hasta"
              value={endDate}
              onChange={(e) =>
                onFilterChange({
                  tenantId: selectedTenantId,
                  startDate,
                  endDate: e.target.value,
                })
              }
              className="bg-white"
            />

            {(selectedTenantId || startDate || endDate) && (
              <Button
                variant="secondary"
                onClick={() =>
                  onFilterChange({
                    tenantId: null,
                    startDate: '',
                    endDate: '',
                  })
                }
                title="Limpiar filtros"
                className="!py-4 !px-3.5 !rounded-2xl !border-slate-200 shrink-0"
              >
                <RotateCcw size={15} />
              </Button>
            )}
          </div>
        </div>

        {/* Banner contextual si hay filtro activo por organización */}
        {selectedTenantObj && (
          <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 rounded-xl bg-indigo-50/80 border border-indigo-200/80 text-xs">
            <div className="flex items-center gap-2 text-indigo-950 font-medium">
              <Filter size={13} className="text-indigo-600 shrink-0" />
              <span>
                Auditando organización:{' '}
                <strong className="font-bold text-indigo-700">{selectedTenantObj.name}</strong>
              </span>
              <span className="font-mono text-[11px] text-indigo-600 bg-white px-2 py-0.5 rounded-md border border-indigo-200/70">
                {selectedTenantObj.schema_name}
              </span>
            </div>
            <Button
              variant="ghost"
              onClick={() => {
                onFilterChange({ tenantId: null, startDate, endDate });
                setActiveTabIndex(0);
              }}
              className="!text-indigo-700 hover:!bg-indigo-100 !py-1 !px-2 !text-xs font-bold gap-1"
            >
              <X size={12} />
              <span>Ver todas las organizaciones</span>
            </Button>
          </div>
        )}

        {/* Contenido */}
        {loading ? (
          <div className="py-12 text-center text-slate-400 flex flex-col items-center justify-center gap-2">
            <Loader size="md" className="h-20" />
            <span className="text-xs font-semibold">Consultando auditoría de audio...</span>
          </div>
        ) : !report || !summary ? (
          <EmptyState
            icon={<AlertTriangle className="w-8 h-8 text-rose-500" />}
            title="Sin datos disponibles"
            message="No se pudo obtener el reporte de uso de audio."
            className="py-10"
          />
        ) : (
          <div className="space-y-4">
            {/* Tarjetas KPI de Resumen */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
              <KpiCard
                variant="tinted"
                tone="indigo"
                monoValue
                label="Duración Acumulada"
                value={`${Number(summary.total_minutes || 0).toFixed(2)} min`}
                subtext={`${Math.round(Number(summary.total_seconds || 0)).toLocaleString()} segundos totales`}
                icon={<Clock size={20} />}
              />

              <KpiCard
                variant="tinted"
                tone="slate"
                monoValue
                label="Peticiones Totales"
                value={Number(summary.total_requests || 0).toLocaleString()}
                subtext={
                  <span className="text-emerald-700 font-semibold">
                    {Number(summary.successful_requests || 0).toLocaleString()} exitosas
                  </span>
                }
                icon={<Activity size={20} />}
              />

              <KpiCard
                variant="tinted"
                tone="emerald"
                monoValue
                label="Voz Detectada"
                value={Number(summary.speech_detected_requests || 0).toLocaleString()}
                subtext="transcripciones efectivas"
                icon={<CheckCircle2 size={20} />}
              />

              <KpiCard
                variant="tinted"
                tone="amber"
                monoValue
                label="Volumen Procesado"
                value={formatAudioBytes(summary.total_bytes)}
                subtext="audio enviado a IBM STT"
                icon={<HardDrive size={20} />}
              />
            </div>

            {/* Desglose rápido por canal con ChannelIcons */}
            {byChannel.length > 0 && (
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mr-1">
                  Por Canal:
                </span>
                {byChannel.map((ch) => {
                  const meta = getAudioChannelInfo(ch.channel);
                  return (
                    <div
                      key={ch.channel}
                      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs"
                    >
                      {renderChannelIcon(meta.kind)}
                      <span className="font-bold text-slate-700">{meta.label}</span>
                      <span className="text-slate-400">•</span>
                      <span className="font-mono font-semibold text-indigo-700 tabular-nums">
                        {Number(ch.total_minutes || 0).toFixed(2)}m (
                        {formatAudioDuration(ch.total_seconds)})
                      </span>
                      <span className="text-[10px] text-slate-400">({ch.total_requests} req)</span>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Sub-vistas mediante Tabs compartidas */}
            <Tabs
              tabs={auditTabs}
              activeIndex={activeTabIndex}
              onTabChange={setActiveTabIndex}
            />
          </div>
        )}
      </div>
    </Modal>
  );
};

export default TenantAudioUsageModal;
