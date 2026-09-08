---
title: Matriz de Servicios y Hooks API Frontend
tags:
  - "#indices-ai"
  - "#api"
  - "#servicios"
  - "#hooks"
  - "#axios"
date: 2026-09-08
status: produccion
---

# ⚡ Matriz de Servicios y Hooks API Frontend

Este documento detalla la capa de comunicación HTTP y reactiva de **CRM TIBS App**, integrando los **23 servicios centralizados** de `src/services/`, los **13 custom hooks** de `src/hooks/` y su correspondencia con los endpoints REST y WebSockets del backend NestJS.

---

## 📡 1. Matriz de los 23 Servicios HTTP (`src/services/`)

Toda solicitud se despacha a través de [`axiosInstance`](file:///c:/Users/sopor/Proyectos/CRM/crm-tibs-app/src/core/axios/axiosInstance.ts), inyectando el token JWT y el encabezado `x-tenant-schema`.

| Servicio | Métodos Principales | Endpoint Base / Rutas | Modelo / DTO Retornado |
| :--- | :--- | :--- | :--- |
| [`activitiesService.ts`](file:///c:/Users/sopor/Proyectos/CRM/crm-tibs-app/src/services/activitiesService.ts) | `getActivities`, `createActivity`, `updateActivity`, `deleteActivity`, `getActivityTypes` | `GET/POST/PUT/DELETE /api/activities`, `/api/activities/types` | `Activity[]`, `TypeActivity[]` |
| [`authService.ts`](file:///c:/Users/sopor/Proyectos/CRM/crm-tibs-app/src/services/authService.ts) | `login` | `POST /api/auth/login` | `User` (guarda token en `localStorage`) |
| [`calendarIntegrationsService.ts`](file:///c:/Users/sopor/Proyectos/CRM/crm-tibs-app/src/services/calendarIntegrationsService.ts) | `getCalendarIntegrationStatus`, `getCalendarAuthUrl`, `connectICloudCalendar`, `disconnectCalendar` | `GET/POST/DELETE /api/calendar-integrations/*` | `CalendarIntegrationStatus` |
| [`clientsService.ts`](file:///c:/Users/sopor/Proyectos/CRM/crm-tibs-app/src/services/clientsService.ts) | `getClients`, `getClientById`, `createClient`, `updateClient`, `deleteClient`, `getActiveClients`, `updateClientStatus` | `GET/POST/PUT/DELETE/PATCH /api/clients/*` | `Client[]`, `Client` |
| [`companiesService.ts`](file:///c:/Users/sopor/Proyectos/CRM/crm-tibs-app/src/services/companiesService.ts) | `getCompanies`, `getCompanyById`, `createCompany`, `updateCompany`, `deleteCompany`, `getActiveCompanies`, `updateCompanyStatus` | `GET/POST/PUT/DELETE/PATCH /api/companies/*` | `Company[]`, `Company` |
| [`conversationsService.ts`](file:///c:/Users/sopor/Proyectos/CRM/crm-tibs-app/src/services/conversationsService.ts) | `getConversations`, `getConversationMessages`, `sendMessage`, `toggleBotStatus`, `assignConversation`, `simulateIncomingMessage`, `getAiAgentConfig`, `saveAiAgentConfig`, `getChannelConfigs`, `saveChannelConfig`, `getSubAgents` | `GET/POST/PATCH/DELETE /api/conversations/*` | `any[]`, `Conversation`, `Message` |
| [`expensesService.ts`](file:///c:/Users/sopor/Proyectos/CRM/crm-tibs-app/src/services/expensesService.ts) | `getExpenses`, `getExpenseById`, `createExpense`, `updateExpense`, `deleteExpense`, `uploadReceipt`, `downloadReceipt`, `deleteReceipt` | `GET/POST/PUT/DELETE /api/expenses/*` | `Expense[]`, `Expense` |
| [`helpdeskCronService.ts`](file:///c:/Users/sopor/Proyectos/CRM/crm-tibs-app/src/services/helpdeskCronService.ts) | `getHelpdeskCronConfig`, `saveHelpdeskCronConfig` | `GET/POST /api/helpdesks/cron-config` | `HelpdeskCronConfig` |
| [`interactionsService.ts`](file:///c:/Users/sopor/Proyectos/CRM/crm-tibs-app/src/services/interactionsService.ts) | `getInteractionsByOpportunity`, `createInteraction`, `deleteInteraction` | `GET/POST/DELETE /api/interactions/*` | `Interaction[]`, `Interaction` |
| [`notificationsService.ts`](file:///c:/Users/sopor/Proyectos/CRM/crm-tibs-app/src/services/notificationsService.ts) | `getMyNotifications`, `markNotificationAsRead`, `markAllNotificationsAsRead` | `GET/PATCH /api/notifications/*` | `NotificationItem[]` |
| [`opportunitiesService.ts`](file:///c:/Users/sopor/Proyectos/CRM/crm-tibs-app/src/services/opportunitiesService.ts) | `getOpportunities`, `getOpportunity`, `createOpportunity`, `updateOpportunity`, `deleteOpportunity`, `archiveOpportunity`, `uploadOpportunityFile`, `downloadOpportunityFile`, `deleteOpportunityFile` | `GET/POST/PUT/DELETE/PATCH /api/opportunities/*` | `Opportunity[]`, `Opportunity` |
| [`opportunityCatalogsService.ts`](file:///c:/Users/sopor/Proyectos/CRM/crm-tibs-app/src/services/opportunityCatalogsService.ts) | `getCatalogOptions`, `getActiveCatalogOptions`, `createCatalogOption`, `updateCatalogOption`, `deleteCatalogOption` | `GET/POST/PUT/DELETE /api/business-lines`, `/api/delivery-types`, `/api/licensings` | `OpportunityCatalogOption[]` |
| [`opportunityLabelsService.ts`](file:///c:/Users/sopor/Proyectos/CRM/crm-tibs-app/src/services/opportunityLabelsService.ts) | `getOpportunityLabels`, `updateOpportunityLabel` | `GET/PUT /api/opportunity-labels/*` | `OpportunityLabel[]` |
| [`pipelinesService.ts`](file:///c:/Users/sopor/Proyectos/CRM/crm-tibs-app/src/services/pipelinesService.ts) | `getMainPipeline`, `getActiveStages`, `updateMainPipeline`, `getPipelines` | `GET/PUT /api/pipelines/*` | `Pipeline`, `Stage[]` |
| [`plansService.ts`](file:///c:/Users/sopor/Proyectos/CRM/crm-tibs-app/src/services/plansService.ts) | `getPlans`, `getPlanById`, `createPlan`, `updatePlan`, `deletePlan` | `GET/POST/PUT/DELETE /api/plans/*` | `Plan[]`, `Plan` |
| [`productsService.ts`](file:///c:/Users/sopor/Proyectos/CRM/crm-tibs-app/src/services/productsService.ts) | `getProducts`, `getProduct`, `createProduct`, `updateProduct`, `deleteProduct`, `updateProductStatus`, `uploadProductFile`, `deleteProductFile` | `GET/POST/PUT/DELETE/PATCH /api/products/*` | `Product[]`, `Product` |
| [`remindersService.ts`](file:///c:/Users/sopor/Proyectos/CRM/crm-tibs-app/src/services/remindersService.ts) | `getRemindersByOpportunity`, `createReminder`, `updateReminder`, `deleteReminder` | `GET/POST/PUT/DELETE /api/reminders/*` | `Reminder[]`, `Reminder` |
| [`reportsService.ts`](file:///c:/Users/sopor/Proyectos/CRM/crm-tibs-app/src/services/reportsService.ts) | `getDashboardData`, `getIndicators`, `createIndicator`, `updateIndicator`, `deleteIndicator` | `GET/POST/PUT/DELETE /api/reports/*` | `DashboardData`, `DashboardIndicator[]` |
| [`tenantsService.ts`](file:///c:/Users/sopor/Proyectos/CRM/crm-tibs-app/src/services/tenantsService.ts) | `getTenants`, `getTenantById`, `getMyTenantInfo`, `getTenantConsumption`, `updateTenantPlan`, `updateAllowExtra`, `updateTenant`, `deleteTenant` | `GET/PUT/PATCH/DELETE /api/tenants/*` | `TenantPlanInfo[]`, `TenantConsumptionData` |
| [`ticketInteractionsService.ts`](file:///c:/Users/sopor/Proyectos/CRM/crm-tibs-app/src/services/ticketInteractionsService.ts) | `getTicketInteractions`, `createTicketInteraction`, `deleteTicketInteraction` | `GET/POST/DELETE /api/ticket-interactions/*` | `TicketInteraction[]` |
| [`ticketsService.ts`](file:///c:/Users/sopor/Proyectos/CRM/crm-tibs-app/src/services/ticketsService.ts) | `getMainHelpdesk`, `updateMainHelpdesk`, `getActiveTicketStages`, `getTickets`, `getTicket`, `createTicket`, `updateTicket`, `deleteTicket`, `archiveTicket` | `GET/POST/PUT/DELETE/PATCH /api/tickets/*`, `/api/helpdesks/*` | `Helpdesk`, `TicketStage[]`, `Ticket[]` |
| [`usersService.ts`](file:///c:/Users/sopor/Proyectos/CRM/crm-tibs-app/src/services/usersService.ts) | `getUsers`, `getUserById`, `createUser`, `updateUser`, `deleteUser`, `getActiveUsers`, `updateUserStatus`, `uploadProfileImage` | `GET/POST/PUT/DELETE/PATCH /api/users/*` | `User[]`, `User` |
| [`webchatService.ts`](file:///c:/Users/sopor/Proyectos/CRM/crm-tibs-app/src/services/webchatService.ts) | `queryWebChat` | `POST /api/webchat/query` | `WebChatResponse` (`response`, `data`, `dashboardRedirect`) |

---

## 🎣 2. Catálogo de los 13 Custom Hooks (`src/hooks/`)

| Hook | Archivo | Responsabilidad y Flujo Reactivo | Servicios Consumidos |
| :--- | :--- | :--- | :--- |
| `usePipeline` | [`usePipeline.ts`](file:///c:/Users/sopor/Proyectos/CRM/crm-tibs-app/src/hooks/usePipeline.ts) | Orquesta el tablero Drag & Drop (`@dnd-kit`), estados de etapas plegadas (`foldedStageIds`), cálculo de montos totales, filtros de texto y contacto, animación de confeti al ganar tratos y exportación a PDF. | `opportunitiesService`, `pipelinesService`, `opportunityCatalogsService` |
| `useConversationsSocket` | [`useConversationsSocket.ts`](file:///c:/Users/sopor/Proyectos/CRM/crm-tibs-app/src/hooks/useConversationsSocket.ts) | Mantiene el ciclo de vida del WebSocket con Socket.IO (`/conversations`), gestiona el feed de mensajes activos, scroll automático, toggle del bot de IA, reasignación de ejecutivos y panel simulador. | `conversationsService`, `usersService` |
| `useActivities` | [`useActivities.ts`](file:///c:/Users/sopor/Proyectos/CRM/crm-tibs-app/src/hooks/useActivities.ts) | Administra la agenda de actividades y eventos de FullCalendar, filtrado por fecha/usuario/tipo, modales de edición y sincronización externa. | `activitiesService`, `usersService` |
| `useHelpdesk` | [`useHelpdesk.ts`](file:///c:/Users/sopor/Proyectos/CRM/crm-tibs-app/src/hooks/useHelpdesk.ts) | Controla el flujo Kanban de soporte técnico con `@dnd-kit`, prioridades cromáticas, cálculo de antigüedad en etapa, conversión a oportunidad comercial y modales de ticket. | `ticketsService`, `opportunitiesService`, `pipelinesService` |
| `useDashboard` | [`useDashboard.ts`](file:///c:/Users/sopor/Proyectos/CRM/crm-tibs-app/src/hooks/useDashboard.ts) | Procesa la agregación de métricas de ventas y soporte, filtrado por fechas/moneda, configuración de tipos de gráficos y generación de resumen PDF. | `reportsService` |
| `useAuth` | [`useAuth.ts`](file:///c:/Users/sopor/Proyectos/CRM/crm-tibs-app/src/hooks/useAuth.ts) | Decodifica el token JWT (`jwtDecode`), expone estados de autenticación y booleanos de rol (`isAdmin`, `isSuperAdmin`, `isEjecutivo`), y ejecuta el logout. | `localStorage` |
| `useAuthForms` | [`useAuthForms.ts`](file:///c:/Users/sopor/Proyectos/CRM/crm-tibs-app/src/hooks/useAuthForms.ts) | Maneja validaciones y estados de formularios para login, recuperación de contraseña y cambio de clave con esquemas Yup. | `authService` |
| `useClients` | [`useClients.ts`](file:///c:/Users/sopor/Proyectos/CRM/crm-tibs-app/src/hooks/useClients.ts) | Gestiona la tabla de clientes/contactos, filtros de búsqueda, cambio de estatus activo y modal de edición. | `clientsService` |
| `useCompanies` | [`useCompanies.ts`](file:///c:/Users/sopor/Proyectos/CRM/crm-tibs-app/src/hooks/useCompanies.ts) | Administra el catálogo de empresas B2B, sus contactos subordinados y operaciones de guardado/eliminación. | `companiesService` |
| `useExpenses` | [`useExpenses.ts`](file:///c:/Users/sopor/Proyectos/CRM/crm-tibs-app/src/hooks/useExpenses.ts) | Controla la lista de gastos corporativos, totalizadores acumulados y gestión de archivos de recibos / comprobantes. | `expensesService` |
| `useNotifications` | [`useNotifications.ts`](file:///c:/Users/sopor/Proyectos/CRM/crm-tibs-app/src/hooks/useNotifications.ts) | Consulta y actualiza notificaciones de usuario en tiempo real en la barra de navegación. | `notificationsService` |
| `useProducts` | [`useProducts.ts`](file:///c:/Users/sopor/Proyectos/CRM/crm-tibs-app/src/hooks/useProducts.ts) | Administra el catálogo de productos y servicios ofertados, estado de habilitación y anexos técnicos. | `productsService` |
| `useUsers` | [`useUsers.ts`](file:///c:/Users/sopor/Proyectos/CRM/crm-tibs-app/src/hooks/useUsers.ts) | Facilita la administración de usuarios del sistema, asignación de roles y carga de avatar de perfil. | `usersService` |

---

## 🔗 Enlaces Relacionados
* [[MOC - Mapa de Contenidos Frontend]] — Índice maestro de notas.
* [[CRM TIBS - Multi-Tenancy, Axios & Interceptores]] — Explicación a fondo del cliente HTTP y cabeceras.
* [[Catalogo de Componentes y Vistas]] — Vistas que consumen estos hooks y servicios.
* [[Guia de Contexto para Agentes de IA (MCP Retrieval)]] — Protocolo de consulta para agentes inteligentes.
