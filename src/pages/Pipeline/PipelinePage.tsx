import React, { useMemo } from 'react';
import Confetti from 'react-confetti-boom';
import { Filter, User, Tag, Star, Calendar } from 'lucide-react';

// Hook orquestador del módulo
import { usePipeline } from './hooks/usePipeline';

// Componentes compartidos del CRM
import Loader from '../../components/shared/Loader';
import type { SearchBadge } from '../../components/shared/UnifiedSearchBar';

// Subcomponentes modulares de Pipeline
import PipelineToolbar from './components/toolbar/PipelineToolbar';
import PipelineKanbanView from './components/kanban/PipelineKanbanView';
import PipelineTableView from './components/table/PipelineTableView';
import PipelineModalsManager from './components/modals/PipelineModalsManager';
import PipelineCustomFilterModal from './components/modals/PipelineCustomFilterModal';

export const PipelinePage: React.FC = () => {
  const p = usePipeline();

  const badges = useMemo<SearchBadge[]>(() => {
    const list: SearchBadge[] = [];
    if (p.isCustomFilterActive) {
      list.push({
        id: 'custom',
        label: 'Filtro Personalizado',
        icon: <Filter size={10} />,
        onRemove: () => {
          p.setIsCustomFilterActive(false);
          p.setCustomRules([]);
        },
      });
      return list;
    }
    if (p.archivedFilter === 'archived')
      list.push({
        id: 'archived',
        label: 'Archivadas',
        icon: <Filter size={10} />,
        onRemove: () => p.setArchivedFilter('active'),
      });
    if (p.archivedFilter === 'all')
      list.push({
        id: 'all',
        label: 'Todas',
        icon: <Filter size={10} />,
        onRemove: () => p.setArchivedFilter('active'),
      });
    if (p.contactFilter) {
      const contactItem = p.contactsList.find((c) => c.id === p.contactFilter);
      list.push({
        id: 'contact',
        label: `Contacto: ${contactItem?.name || 'Seleccionado'}`,
        icon: <User size={10} className="shrink-0" />,
        onRemove: () => p.setContactFilter(''),
      });
    }
    if (p.executiveFilter)
      list.push({
        id: 'executive',
        label:
          p.executives.find((e) => e.id === p.executiveFilter)?.username ||
          'Ejecutivo',
        icon: <User size={10} className="shrink-0" />,
        onRemove: () => p.setExecutiveFilter(''),
      });
    if (p.statusFilter)
      list.push({
        id: 'status',
        label:
          p.activeStages.find((s) => s.id === p.statusFilter)?.strname || 'Estatus',
        icon: <Tag size={10} className="shrink-0" />,
        onRemove: () => p.setStatusFilter(''),
      });
    if (p.priorityFilter !== null)
      list.push({
        id: 'priority',
        label:
          p.priorityFilter === 1
            ? '★ Baja+'
            : p.priorityFilter === 2
            ? '★★ Media+'
            : '★★★ Alta',
        icon: <Star size={10} className="shrink-0" />,
        onRemove: () => p.setPriorityFilter(null),
      });

    if (p.startDate || p.endDate) {
      const currentYear = new Date().getFullYear();
      const defaultStartDate = `${currentYear}-01-01`;
      const defaultEndDate = `${currentYear}-12-31`;
      const isDefault =
        p.startDate === defaultStartDate && p.endDate === defaultEndDate;
      list.push({
        id: 'dateRange',
        label: isDefault
          ? 'Año en curso'
          : `${p.startDate || 'Inicio'} a ${p.endDate || 'Fin'}`,
        icon: <Calendar size={10} className="shrink-0" />,
        onRemove: () => {
          p.setStartDate('');
          p.setEndDate('');
        },
      });
    }
    return list;
  }, [
    p.isCustomFilterActive,
    p.archivedFilter,
    p.contactFilter,
    p.contactsList,
    p.executiveFilter,
    p.statusFilter,
    p.priorityFilter,
    p.executives,
    p.activeStages,
    p.startDate,
    p.endDate,
  ]);

  if (p.loading) return <Loader />;

  return (
    <div className="space-y-6">
      {p.isExploding && (
        <div className="fixed top-0 left-0 w-full h-full z-[100] pointer-events-none">
          <Confetti
            deg={270}
            mode="boom"
            particleCount={150}
            spreadDeg={45}
            launchSpeed={3}
            effectCount={1}
            shapeSize={10}
            colors={['#22c55e', '#3b82f6', '#8b5cf6', '#a855f7', '#ffffff']}
          />
        </div>
      )}

      {/* Barra de herramientas modular */}
      <PipelineToolbar
        pipelineName={p.pipelineName}
        pipelineDescription={p.pipelineDescription}
        viewMode={p.viewMode}
        setViewMode={p.setViewMode}
        searchTerm={p.searchTerm}
        setSearchTerm={p.setSearchTerm}
        contactFilter={p.contactFilter}
        setContactFilter={p.setContactFilter}
        contactsList={p.contactsList}
        executiveFilter={p.executiveFilter}
        setExecutiveFilter={p.setExecutiveFilter}
        statusFilter={p.statusFilter}
        setStatusFilter={p.setStatusFilter}
        archivedFilter={p.archivedFilter}
        setArchivedFilter={p.setArchivedFilter}
        priorityFilter={p.priorityFilter}
        setPriorityFilter={p.setPriorityFilter}
        showFilters={p.showFilters}
        setShowFilters={p.setShowFilters}
        showToolbar={p.showToolbar}
        setShowToolbar={p.setShowToolbar}
        stages={p.stages}
        activeStages={p.activeStages}
        visibleStageIds={p.visibleStageIds}
        onVisibilityChange={p.handleStageVisibilityChange}
        executives={p.executives}
        isAdmin={p.isAdmin}
        isCustomFilterActive={p.isCustomFilterActive}
        searchDropdownRef={p.searchDropdownRef}
        onNewOpportunity={p.openCreateModal}
        onOpenSettings={() => p.setShowStagesConfig(true)}
        onOpenCustomFilter={() => p.setIsCustomFilterModalOpen(true)}
        onClearFilters={p.handleClearFilters}
        badges={badges}
        startDate={p.startDate}
        setStartDate={p.setStartDate}
        endDate={p.endDate}
        setEndDate={p.setEndDate}
        totalOpportunitiesCount={p.filteredOpportunities.length}
      />

      {/* Renderizado de Vista Activa: Kanban vs Tabla TanStack */}
      {p.viewMode === 'kanban' ? (
        <PipelineKanbanView
          sensors={p.sensors}
          activeStages={p.activeStages}
          visibleStageIds={p.visibleStageIds}
          filteredOpportunities={p.filteredOpportunities}
          foldedStageIds={p.foldedStageIds}
          setFoldedStageIds={p.setFoldedStageIds}
          activeOpportunity={p.activeOpportunity}
          activeStage={p.activeStage}
          stages={p.stages}
          isAdmin={p.isAdmin}
          isAddingStage={p.isAddingStage}
          setIsAddingStage={p.setIsAddingStage}
          newStageName={p.newStageName}
          setNewStageName={p.setNewStageName}
          newStageMaxDays={p.newStageMaxDays}
          setNewStageMaxDays={p.setNewStageMaxDays}
          addStageInputRef={p.addStageInputRef}
          onDragStart={p.handleDragStart}
          onDragEnd={p.handleDragEnd}
          onEditOpportunity={p.openEditModal}
          onDeleteOpportunity={p.openDeleteConfirm}
          onArchiveOpportunity={p.handleArchive}
          onEditStage={p.setEditingStage}
          onDisableStage={p.handleDisableStage}
          onAddOpportunity={p.openCreateModal}
          onCreateStage={p.handleCreateStage}
        />
      ) : (
        <PipelineTableView
          opportunities={p.paginatedOpportunities}
          onEdit={p.openEditModal}
          onDelete={p.openDeleteConfirm}
          onArchive={p.handleArchive}
          isAdmin={p.isAdmin}
          currentPage={p.currentPage}
          totalPages={p.totalPages}
          onPageChange={p.setCurrentPage}
          pageSize={p.pageSize}
          onPageSizeChange={p.setPageSize}
          totalCount={p.opportunities.length}
          filteredCount={p.filteredOpportunities.length}
          onExportPDF={p.handleExportPDF}
          onExportCSV={p.handleExportCSV}
        />
      )}

      {/* Modales Compartidos */}
      <PipelineModalsManager
        isFormModalOpen={p.isFormModalOpen}
        setIsFormModalOpen={p.setIsFormModalOpen}
        editingOpportunity={p.editingOpportunity}
        setEditingOpportunity={p.setEditingOpportunity}
        setOpportunities={p.setOpportunities}
        onCreateOpportunity={p.handleCreate}
        onUpdateOpportunity={p.handleUpdate}
        stages={p.stages}
        opportunityCatalogs={p.opportunityCatalogs}
        catalogsLoading={p.catalogsLoading}
        businessLines={p.businessLines}
        isConfirmModalOpen={p.isConfirmModalOpen}
        setIsConfirmModalOpen={p.setIsConfirmModalOpen}
        opportunityToDelete={p.opportunityToDelete}
        onConfirmDelete={p.handleDelete}
        editingStage={p.editingStage}
        setEditingStage={p.setEditingStage}
        onSaveStage={p.handleSaveStage}
        showStagesConfig={p.showStagesConfig}
        setShowStagesConfig={p.setShowStagesConfig}
        isAdmin={p.isAdmin}
        fetchPipelineAndOpportunities={p.fetchPipelineAndOpportunities}
      />

      {/* Modal de Filtro Avanzado */}
      <PipelineCustomFilterModal
        open={p.isCustomFilterModalOpen}
        onClose={() => p.setIsCustomFilterModalOpen(false)}
        matchType={p.matchType}
        setMatchType={p.setMatchType}
        includeArchived={p.includeArchived}
        setIncludeArchived={p.setIncludeArchived}
        customRules={p.customRules}
        setCustomRules={p.setCustomRules}
        stages={p.stages}
        executives={p.executives}
        businessLines={p.businessLines}
        getOperatorsForField={p.getOperatorsForField}
        handleRuleFieldChange={p.handleRuleFieldChange}
        handleRuleChange={p.handleRuleChange}
        onApply={p.handleApplyCustomFilter}
      />
    </div>
  );
};

export default PipelinePage;
