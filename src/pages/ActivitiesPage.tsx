import React, { useMemo } from 'react';
import { Plus, XCircle, User, LayoutGrid, Table2, FileSpreadsheet, FileText, CalendarDays, Tag } from 'lucide-react';
import { useActivities } from '../hooks/useActivities';
import ActivityForm from '../components/Activity/ActivityForm';
import Modal from '../components/Modal/Modal';
import Loader from '../components/Loader/Loader';
import ActivitiesTable from '../components/Activity/ActivitiesTable';
import ActivitiesCalendar from '../components/Activity/ActivitiesCalendar';
import Notification from '../components/Modal/Notification';
import Input from '../components/shared/Input';
import Select from '../components/shared/Select';
import Button from '../components/shared/Button';
import UnifiedSearchBar from '../components/shared/UnifiedSearchBar';
import type { SearchBadge } from '../components/shared/UnifiedSearchBar';

const ActivitiesPage: React.FC = () => {
  const a = useActivities();

  const badges = useMemo<SearchBadge[]>(() => {
    const list: SearchBadge[] = [];
    if (a.filterUser) list.push({ id:'user', label:a.userOptions.find(o=>o.value===a.filterUser)?.label||'Usuario', icon:<User size={10} />, onRemove:()=>a.setFilterUser('') });
    if (a.filterType) list.push({ id:'type', label:a.typeOptions.find(o=>o.value===a.filterType)?.label||'Tipo', icon:<Tag size={10} />, onRemove:()=>a.setFilterType('') });
    if (a.filterDate) list.push({ id:'date', label:a.formatDateBadge(a.filterDate), icon:<CalendarDays size={10} />, onRemove:()=>a.setFilterDate('') });
    return list;
  }, [a.filterUser, a.filterType, a.filterDate, a.userOptions, a.typeOptions]);

  return (
    <>
      <Notification {...a.notification} />

      {/* Print header */}
      <div className="hidden print-only-block mb-6 border-b border-gray-300 pb-4">
        <h1 className="text-3xl font-bold text-gray-900">Reporte de Actividades</h1>
        <div className="mt-2 grid grid-cols-2 gap-2 text-sm text-gray-600">
          <div><span className="font-semibold">Usuario:</span> {a.isAdmin ? (a.filterUser ? a.userOptions.find(o=>o.value===a.filterUser)?.label||'Desconocido' : 'Todos los usuarios') : (a.user?.username||'Ejecutivo')}</div>
          {a.filterDate && <div><span className="font-semibold">Fecha:</span> {a.filterDate}</div>}
          {a.filterTitle && <div><span className="font-semibold">Búsqueda:</span> "{a.filterTitle}"</div>}
          <div><span className="font-semibold">Generado el:</span> {new Date().toLocaleString('es-MX')}</div>
        </div>
      </div>

      {/* Header toolbar */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4 print:hidden">
        <h1 className="text-2xl font-bold text-gray-800">Actividades</h1>
        <div className="flex flex-col sm:flex-row w-full md:w-auto gap-3 items-center">
          {/* View toggle */}
          <div className="flex items-center bg-gray-100 rounded-lg p-1 gap-1 shrink-0">
            <button onClick={() => a.setViewMode('table')} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all cursor-pointer ${a.viewMode==='table'?'bg-white text-indigo-700 shadow-sm':'text-gray-500 hover:text-gray-700'}`}>
              <Table2 size={15} /> Tabla
            </button>
            <button onClick={() => a.setViewMode('calendar')} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all cursor-pointer ${a.viewMode==='calendar'?'bg-white text-indigo-700 shadow-sm':'text-gray-500 hover:text-gray-700'}`}>
              <LayoutGrid size={15} /> Calendario
            </button>
          </div>

          <UnifiedSearchBar
            ref={a.searchDropdownRef}
            searchTerm={a.filterTitle}
            onSearchChange={a.setFilterTitle}
            placeholder={!a.filterUser && !a.filterDate && !a.filterType ? 'Buscar actividad...' : ''}
            badges={badges}
            showFilters={a.showFilters}
            setShowFilters={a.setShowFilters}
            dropdownWidthClass="w-[420px]"
          >
            <div className="flex gap-4 w-full">
              <div className="flex flex-col gap-3 flex-1 min-w-0">
                {a.isAdmin && (
                  <div>
                    <h4 className="font-bold text-[10px] text-gray-400 uppercase tracking-wider mb-1.5 select-none flex items-center gap-1"><User size={9} /> Usuario</h4>
                    <Select inputId="user-filter" options={a.userOptions} value={a.filterUser ? a.userOptions.find(o=>o.value===a.filterUser)||null : null} onChange={a.handleUserFilterChange} placeholder="Todos los usuarios" isClearable isSearchable noOptionsMessage={() => 'No se encontraron usuarios'} />
                  </div>
                )}
                <div>
                  <h4 className="font-bold text-[10px] text-gray-400 uppercase tracking-wider mb-1.5 select-none flex items-center gap-1"><Tag size={9} /> Tipo de Actividad</h4>
                  <Select inputId="type-filter" options={a.typeOptions} value={a.filterType ? a.typeOptions.find(o=>o.value===a.filterType)||null : null} onChange={(opt: any) => a.setFilterType(opt ? opt.value : '')} placeholder="Todos los tipos" isClearable />
                </div>
              </div>
              <div className="w-px bg-gray-100 self-stretch" />
              <div className="flex flex-col gap-3 flex-1 min-w-0">
                <div>
                  <h4 className="font-bold text-[10px] text-gray-400 uppercase tracking-wider mb-1.5 select-none flex items-center gap-1"><CalendarDays size={9} /> Fecha</h4>
                  <Input type="date" value={a.filterDate} onChange={e => a.setFilterDate(e.target.value)} className="text-xs bg-white cursor-pointer py-2 rounded-xl" />
                </div>
                <div className="border-t border-gray-100 pt-2">
                  <button type="button" onClick={a.handleClearFilters} className="flex items-center gap-1.5 text-xs text-red-500 hover:text-red-700 px-2 py-1.5 rounded w-full text-left hover:bg-red-50 transition-colors cursor-pointer">
                    <XCircle size={12} /> Limpiar Filtros
                  </button>
                </div>
              </div>
            </div>
          </UnifiedSearchBar>

          {a.viewMode === 'table' && (
            <>
              <Button onClick={a.handleExportPDF} variant="secondary" className="text-red-500 border border-blue-100 hover:bg-red-50/50 w-full sm:w-auto h-[38px] py-0 px-4 flex items-center justify-center font-bold text-xs tracking-wider">
                <FileText size={16} className="text-red-500 mr-2" /><span>PDF</span>
              </Button>
              <Button onClick={a.handleExportCSV} variant="secondary" className="text-emerald-600 border border-blue-100 hover:bg-emerald-50/50 w-full sm:w-auto h-[38px] py-0 px-4 flex items-center justify-center font-bold text-xs tracking-wider">
                <FileSpreadsheet size={16} className="text-emerald-600 mr-2" /><span>EXCEL</span>
              </Button>
            </>
          )}

          <Button variant="success" className="w-full sm:w-auto whitespace-nowrap h-[38px] py-0 px-4" onClick={a.openCreateModal}>
            <Plus size={18} className="mr-2" /> Nueva Actividad
          </Button>
        </div>
      </div>

      {/* Main content */}
      {a.loading ? (
        <Loader />
      ) : a.viewMode === 'calendar' ? (
        <ActivitiesCalendar activities={a.filteredActivities} activityTypes={a.activityTypes} onEdit={a.openEditModal} onDelete={a.handleDelete} onCreateWithDate={a.openCreateModalWithDate} />
      ) : (
        <ActivitiesTable
          activities={a.paginatedActivities}
          onEdit={a.openEditModal}
          onDelete={a.handleDelete}
          currentPage={a.currentPage}
          totalPages={a.totalPages}
          onPageChange={a.setCurrentPage}
          pageSize={a.pageSize}
          onPageSizeChange={a.setPageSize}
          totalCount={a.activities.length}
          filteredCount={a.filteredActivities.length}
        />
      )}

      <Modal open={a.modalOpen} onClose={() => a.setModalOpen(false)}>
        <ActivityForm
          initialData={a.editing ? a.editing : (a.initialDate ? { date: a.initialDate } : undefined)}
          activityTypes={a.activityTypes}
          onSubmit={a.editing ? a.handleUpdate : a.handleCreate}
          onCancel={() => a.setModalOpen(false)}
        />
      </Modal>
    </>
  );
};

export default ActivitiesPage;
