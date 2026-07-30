import React, { useMemo } from 'react';
import { LifeBuoy, ChevronUp, ChevronDown, Filter, Tag, Star } from 'lucide-react';
import { useHelpdesk } from '../hooks/useHelpdesk';
import Notification from '../components/Modal/Notification';
import Loader from '../components/Loader/Loader';
import TicketsListTable from '../components/Helpdesk/TicketsListTable';
import HelpdeskToolbar from '../components/Helpdesk/HelpdeskToolbar';
import HelpdeskKanban from '../components/Helpdesk/HelpdeskKanban';
import HelpdeskModals from '../components/Helpdesk/HelpdeskModals';
import type { SearchBadge } from '../components/shared/UnifiedSearchBar';

const HelpdeskPage: React.FC = () => {
  const hd = useHelpdesk();

  const badges = useMemo<SearchBadge[]>(() => {
    const list: SearchBadge[] = [];
    if (hd.archivedFilter === 'archived') list.push({ id: 'archived', label: 'Archivados', icon: <Filter size={10} />, onRemove: () => hd.setArchivedFilter('active') });
    if (hd.archivedFilter === 'all')      list.push({ id: 'all',      label: 'Todos',       icon: <Filter size={10} />, onRemove: () => hd.setArchivedFilter('active') });
    if (hd.priorityFilter !== 'all')      list.push({ id: 'priority', label: hd.priorityFilter === 0 ? 'Sin prioridad' : hd.priorityFilter === 1 ? 'Baja' : hd.priorityFilter === 2 ? 'Media' : 'Alta', icon: <Star size={10} />, onRemove: () => hd.setPriorityFilter('all') });
    if (hd.incidenceTypeFilter !== 'all') list.push({ id: 'incidence', label: hd.incidenceTypeFilter, icon: <Tag size={10} />, onRemove: () => hd.setIncidenceTypeFilter('all') });
    return list;
  }, [hd.archivedFilter, hd.priorityFilter, hd.incidenceTypeFilter]);

  if (hd.loading) return <div className="flex justify-center items-center py-20"><Loader /></div>;

  return (
    <div className="space-y-4">
      <Notification {...hd.notification} />

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-2">
        <div className="flex justify-between items-start w-full md:w-auto">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 border border-indigo-100">
              <LifeBuoy size={20} className="stroke-[2.5]" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-800 leading-tight">{hd.helpdesk?.strname}</h1>
              {hd.helpdesk?.strdescription && <p className="text-sm text-indigo-500 font-medium mt-0.5">{hd.helpdesk.strdescription}</p>}
            </div>
          </div>
          <button className="md:hidden p-2 text-gray-500 hover:text-indigo-600 bg-gray-100 rounded-full transition-colors ml-3" onClick={() => hd.setShowToolbar(!hd.showToolbar)}>
            {hd.showToolbar ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </button>
        </div>

        {hd.showToolbar && (
          <HelpdeskToolbar
            helpdesk={hd.helpdesk}
            viewMode={hd.viewMode}
            setViewMode={hd.setViewMode}
            searchTerm={hd.searchTerm}
            setSearchTerm={hd.setSearchTerm}
            priorityFilter={hd.priorityFilter}
            setPriorityFilter={hd.setPriorityFilter}
            incidenceTypeFilter={hd.incidenceTypeFilter}
            setIncidenceTypeFilter={hd.setIncidenceTypeFilter}
            archivedFilter={hd.archivedFilter}
            setArchivedFilter={hd.setArchivedFilter}
            showFilters={hd.showFilters}
            setShowFilters={hd.setShowFilters}
            stages={hd.stages}
            visibleStageIds={hd.visibleStageIds}
            onVisibilityChange={hd.handleStageVisibilityChange}
            uniqueIncidenceTypes={hd.uniqueIncidenceTypes}
            isAdmin={hd.isAdmin}
            searchDropdownRef={hd.searchDropdownRef}
            onNewTicket={() => hd.setIsCreatingTicket(true)}
            onOpenSettings={() => hd.setShowStagesConfig(true)}
            onExportPDF={hd.handleExportPDF}
            onExportCSV={hd.handleExportCSV}
            badges={badges}
          />
        )}
      </div>

      {/* Main content */}
      {hd.actionLoading ? (
        <div className="flex justify-center items-center py-20"><Loader /></div>
      ) : hd.viewMode === 'kanban' ? (
        <HelpdeskKanban
          sensors={hd.sensors}
          stages={hd.stages}
          visibleStageIds={hd.visibleStageIds}
          filteredTickets={hd.filteredTickets}
          foldedStageIds={hd.foldedStageIds}
          setFoldedStageIds={hd.setFoldedStageIds}
          activeTicket={hd.activeTicket}
          activeStage={hd.activeStage}
          isAdmin={hd.isAdmin}
          isAddingStage={hd.isAddingStage}
          setIsAddingStage={hd.setIsAddingStage}
          newStageName={hd.newStageName}
          setNewStageName={hd.setNewStageName}
          newStageMaxDays={hd.newStageMaxDays}
          setNewStageMaxDays={hd.setNewStageMaxDays}
          addStageInputRef={hd.addStageInputRef}
          onDragStart={hd.handleDragStart}
          onDragEnd={hd.handleDragEnd}
          onClickTicket={hd.setSelectedTicket}
          onEditStage={hd.setEditingStage}
          onDisableStage={hd.handleDisableStage}
          onAddTicket={(_stageId: string) => hd.setIsCreatingTicket(true)}
          onDeleteTicket={hd.handleDeleteTicket}
          onArchiveTicket={hd.handleArchive}
          onCreateStage={hd.handleCreateStage}
        />
      ) : (
        <TicketsListTable
          tickets={hd.paginatedTickets}
          onTicketClick={hd.setSelectedTicket}
          currentPage={hd.currentPage}
          totalPages={hd.totalPages}
          onPageChange={hd.setCurrentPage}
          pageSize={hd.pageSize}
          onPageSizeChange={hd.setPageSize}
          totalCount={hd.tickets.length}
          filteredCount={hd.filteredTickets.length}
        />
      )}

      <HelpdeskModals
        editingStage={hd.editingStage}
        setEditingStage={hd.setEditingStage}
        onSaveStage={hd.handleSaveStage}
        resolutionTicketInfo={hd.resolutionTicketInfo}
        resolutionNotesTemp={hd.resolutionNotesTemp}
        setResolutionNotesTemp={hd.setResolutionNotesTemp}
        onResolutionSubmit={hd.handleResolutionSubmit}
        onResolutionCancel={hd.handleResolutionCancel}
        selectedTicket={hd.selectedTicket}
        setSelectedTicket={hd.setSelectedTicket}
        stages={hd.stages}
        onUpdateTicket={hd.handleUpdateTicketSubmit}
        onDeleteTicket={hd.handleDeleteTicket}
        onConvertToOpportunity={hd.handleConvertToOpportunityClick}
        onArchive={hd.handleArchive}
        isCreatingTicket={hd.isCreatingTicket}
        setIsCreatingTicket={hd.setIsCreatingTicket}
        onCreateTicket={hd.handleCreateTicketSubmit}
        ticketToConvert={hd.ticketToConvert}
        setTicketToConvert={hd.setTicketToConvert}
        commercialStages={hd.commercialStages}
        onConvertSubmit={hd.handleConvertToOpportunitySubmit}
        showStagesConfig={hd.showStagesConfig}
        setShowStagesConfig={hd.setShowStagesConfig}
        loadData={hd.loadData}
      />
    </div>
  );
};

export default HelpdeskPage;
