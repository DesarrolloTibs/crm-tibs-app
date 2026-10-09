export * from './PipelinePage';
export * from './schemas/pipeline.schema';
export * from './hooks/usePipeline';
export * from './utils/pipeline.helpers';
export * from './utils/pipeline.columns';

// Toolbar & Vistas
export * from './components/toolbar/PipelineToolbar';
export * from './components/toolbar/PipelineViewTabs';

// Kanban Board
export * from './components/kanban/PipelineKanbanView';
export * from './components/kanban/PipelineKanbanColumn';
export * from './components/kanban/OpportunityKanbanCard';
export * from './components/kanban/OpportunityCardPopover';

// Table
export * from './components/table/PipelineTableView';

// Modales, Formularios y Pestañas
export * from './components/modals/PipelineModalsManager';
export * from './components/modals/OpportunityForm';
export * from './components/modals/OpportunityFilesTab';
export * from './components/modals/OpportunityInteractionsTab';
export * from './components/modals/PipelineStagesSettingsDrawer';
export * from './components/modals/PipelineCustomFilterModal';

// Aliases para retrocompatibilidad
export { PipelineViewTabs as PipelineNavTabs } from './components/toolbar/PipelineViewTabs';
export { PipelineKanbanView as PipelineKanban } from './components/kanban/PipelineKanbanView';
export { PipelineKanbanColumn as PipelineColumn } from './components/kanban/PipelineKanbanColumn';
export { OpportunityKanbanCard as OpportunityCard } from './components/kanban/OpportunityKanbanCard';
export { OpportunityCardPopover as Popover } from './components/kanban/OpportunityCardPopover';
export { PipelineTableView as PipelineTable } from './components/table/PipelineTableView';
export { PipelineModalsManager as PipelineModals } from './components/modals/PipelineModalsManager';
export { PipelineStagesSettingsDrawer as PipelineStagesSettings } from './components/modals/PipelineStagesSettingsDrawer';
export { OpportunityFilesTab as FilesTab } from './components/modals/OpportunityFilesTab';
export { OpportunityInteractionsTab as InteractionsTab } from './components/modals/OpportunityInteractionsTab';
export { PipelinePage as PipelineContainer, PipelinePage as PipelineBoard } from './PipelinePage';

export { default } from './PipelinePage';
