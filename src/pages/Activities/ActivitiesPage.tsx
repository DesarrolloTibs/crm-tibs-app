import React from 'react';
import { CalendarDays, Plus } from 'lucide-react';

// Componentes Compartidos
import Button from '../../components/shared/Button';
import Notification from '../../components/shared/Notification';
import ConfirmModal from '../../components/shared/ConfirmModal';

// Subcomponentes Modulares de Actividades
import { ActivitiesNavTabs } from './components/ActivitiesNavTabs';
import { ActivitiesFilters } from './components/ActivitiesFilters';
import { ActivitiesTable } from './components/ActivitiesTable';
import { ActivityModal } from './components/ActivityModal';
import ActivitiesCalendar from './components/calendar/ActivitiesCalendar';

// Tipos
import type { ActivityViewMode } from './schemas/activities.schema';

// Hook Orquestador Modular
import { useActivities } from './hooks/useActivities';

interface ActivitiesPageProps {
  defaultView?: ActivityViewMode;
}

export const ActivitiesPage: React.FC<ActivitiesPageProps> = ({ defaultView = 'calendar' }) => {
  const act = useActivities({ defaultView });

  return (
    <>
      <Notification
        show={act.notification.show}
        type={act.notification.type}
        title={act.notification.title}
        message={act.notification.message}
        onConfirm={act.hideNotification}
      />

      <ConfirmModal
        open={act.confirmConfig.open}
        message={act.confirmConfig.description}
        onConfirm={act.confirmConfig.onConfirm}
        onClose={act.closeConfirmModal}
        confirmLabel="Eliminar"
        cancelLabel="Cancelar"
        variant="danger"
      />

      {/* Contenedor Principal */}
      <div className="space-y-6">
        {/* Cabecera Principal del Módulo con Selector de Vista, Sockets y Refresco */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0 shadow-2xs">
              <CalendarDays size={24} />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  Agenda Comercial
                </h1>
              </div>
              <p className="text-xs text-slate-400 mt-0.5 font-medium">
                Gestión integral de citas, reuniones, demos y bitácora de seguimiento comercial.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Navegación por Vistas (Tabla vs Calendario) */}
            <ActivitiesNavTabs
              activeView={act.activeView}
              onChangeView={act.handleChangeView}
              activitiesCount={act.activities.length}
            />

            {/* Filtro Unificado en el lugar del botón Actualizar */}
            <ActivitiesFilters
              filters={act.filters}
              onFilterChange={act.handleFilterChange}
              onClearFilters={act.handleClearFilters}
              activityTypes={act.activityTypes}
              userOptions={act.executives}
              isAdmin={act.isPrivilegedUser}
              currentUserId={act.user?.id}
              currentUserName={act.user?.username}
            />

            {/* Botón Nueva Cita rápido */}
            <Button
              variant="success"
              onClick={act.handleOpenCreate}
              className="gap-2 !py-2 !px-4 text-xs font-bold tracking-wide shadow-2xs whitespace-nowrap"
            >
              <Plus size={15} />
              <span>Nueva Actividad</span>
            </Button>
          </div>
        </div>

        {/* Renderizado de Vista Activa */}
        {act.activeView === 'calendar' ? (
          <div className="bg-white rounded-3xl border border-slate-200/80 p-4 sm:p-6 shadow-xs">
            <ActivitiesCalendar
              activities={act.filteredActivities}
              activityTypes={act.activityTypes}
              onEdit={act.handleOpenEdit}
              onDelete={act.handleDeleteActivity}
              onCreateWithDate={act.handleOpenCreateWithDate}
              selectedDate={act.filters.date}
            />
          </div>
        ) : (
          <ActivitiesTable
            activities={act.paginatedActivities}
            totalCount={act.activities.length}
            filteredCount={act.filteredActivities.length}
            loading={act.loading}
            filters={act.filters}
            onClearFilters={act.handleClearFilters}
            onEdit={act.handleOpenEdit}
            onDelete={act.handleDeleteActivity}
            onExportPDF={act.handleExportPDF}
            onExportCSV={act.handleExportCSV}
            currentPage={act.currentPage}
            totalPages={act.totalPages}
            onPageChange={act.setCurrentPage}
            pageSize={act.pageSize}
            onPageSizeChange={act.setPageSize}
          />
        )}
      </div>

      {/* Modal de Actividades */}
      {act.modalOpen && (
        <ActivityModal
          open={act.modalOpen}
          editingActivity={act.editingActivity}
          activityTypes={act.activityTypes}
          onClose={act.handleCloseModal}
          onSubmit={act.handleSubmitActivity}
          submitting={act.submitting}
          opportunities={act.opportunities}
          clients={act.clients}
          companies={act.companies}
        />
      )}
    </>
  );
};

export default ActivitiesPage;
