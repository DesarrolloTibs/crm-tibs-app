---
title: Catálogo de Componentes y Vistas Frontend
tags:
  - "#indices-ai"
  - "#componentes"
  - "#ui-ux"
  - "#react"
  - "#tanstack-table"
date: 2026-10-01
status: produccion
---

# 🧩 Catálogo de Componentes y Vistas Frontend

Este documento compendia la totalidad de vistas y componentes modulares que conforman la interfaz de usuario de **CRM TIBS App**, organizados por dominio funcional, integración con la suite compartida de tablas (`Table`) y nivel de abstracción.

---

## 📄 1. Vistas y Páginas Principales (`src/pages/`)

| Vista / Archivo | Ruta | Nivel de Acceso | Responsabilidad Funcional |
| :--- | :--- | :--- | :--- |
| [`LoginPage.tsx`](file:///Users/eimvi/Documents/GitHub/crm-tibs-app/src/pages/LoginPage.tsx) | `/login` | Público | Autenticación de usuarios por email/contraseña, renderizado de fondo visual e inicio de sesión. |
| [`SupportTicketPage.tsx`](file:///Users/eimvi/Documents/GitHub/crm-tibs-app/src/pages/SupportTicketPage.tsx) | `/support` | Público | Portal abierto de autoservicio para consulta y registro directo de tickets de clientes. |
| [`ForgotPasswordPage.tsx`](file:///Users/eimvi/Documents/GitHub/crm-tibs-app/src/pages/ForgotPasswordPage.tsx) | `/forgot-password` | Público | Solicitud de restablecimiento de contraseña vía correo electrónico institucional. |
| [`ResetPasswordPage.tsx`](file:///Users/eimvi/Documents/GitHub/crm-tibs-app/src/pages/ResetPasswordPage.tsx) | `/reset-password` | Público | Ingreso de nueva contraseña mediante token temporal recibido por correo. |
| [`DashboardPage.tsx`](file:///Users/eimvi/Documents/GitHub/crm-tibs-app/src/pages/DashboardPage.tsx) | `/dashboard` | Protegido | Central analítica con KPIs comerciales y de soporte, gráficos interactivos y exportación a PDF. |
| [`CompaniesPage.tsx`](file:///Users/eimvi/Documents/GitHub/crm-tibs-app/src/pages/CompaniesPage.tsx) | `/companies` | Protegido | Directorio B2B de empresas cliente, razón social, RFC, teléfonos y gestión de estatus. |
| [`ClientsPage.tsx`](file:///Users/eimvi/Documents/GitHub/crm-tibs-app/src/pages/ClientsPage.tsx) | `/clients` | Protegido | Directorio de contactos y clientes particulares asociados o no a empresas, importación y edición. |
| [`ProductsPage.tsx`](file:///Users/eimvi/Documents/GitHub/crm-tibs-app/src/pages/ProductsPage.tsx) | `/products` | Protegido | Catálogo de productos y servicios ofertados, lista de precios, fichas técnicas y notas para IA. |
| [`PipelinePage.tsx`](file:///Users/eimvi/Documents/GitHub/crm-tibs-app/src/pages/PipelinePage.tsx) | `/pipeline` | Protegido | Tablero Kanban comercial y vista de lista, Drag & Drop (`@dnd-kit`) y filtros avanzados. |
| [`HelpdeskPage.tsx`](file:///Users/eimvi/Documents/GitHub/crm-tibs-app/src/pages/HelpdeskPage.tsx) | `/helpdesk` | Protegido | Mesa de soporte y atención técnica con flujo Kanban de etapas, prioridades y bitácora de mensajes. |
| [`ConversationsPage.tsx`](file:///Users/eimvi/Documents/GitHub/crm-tibs-app/src/pages/ConversationsPage.tsx) | `/conversations` | Protegido | Consola de mensajería omnicanal en tiempo real (WhatsApp, redes sociales y chat web) con WebSocket. |
| [`ActivitiesPage.tsx`](file:///Users/eimvi/Documents/GitHub/crm-tibs-app/src/pages/ActivitiesPage.tsx) | `/activities` | Protegido | Calendario operativo con FullCalendar (`@fullcalendar/react`), tipos cromáticos y tabla de citas. |
| [`ExpensesPage.tsx`](file:///Users/eimvi/Documents/GitHub/crm-tibs-app/src/pages/ExpensesPage.tsx) | `/expenses` | Protegido | Registro y control de gastos corporativos, subida y descarga de comprobantes / facturas. |
| [`UsersPage.tsx`](file:///Users/eimvi/Documents/GitHub/crm-tibs-app/src/pages/UsersPage.tsx) | `/users` | Protegido (Admin) | Administración de usuarios, asignación de roles RBAC, activación/desactivación y avatar. |
| [`SettingsPage.tsx`](file:///Users/eimvi/Documents/GitHub/crm-tibs-app/src/pages/Settings/SettingsPage.tsx) | `/settings` | Protegido | Centro global de configuración: empresa, canales, calendarios externos, catálogos, credenciales IA y tenants. |

---

## 📦 2. Componentes por Dominio Funcional

### 2.1 Tablero Comercial y Pipeline (`src/components/Pipeline/`)
* [`PipelineBoard.tsx`](file:///Users/eimvi/Documents/GitHub/crm-tibs-app/src/components/Pipeline/PipelineBoard.tsx) — Contenedor maestro del tablero comercial, coordina cambio de vistas (Kanban vs Tabla) y sensor DndContext.
* [`PipelineKanban.tsx`](file:///Users/eimvi/Documents/GitHub/crm-tibs-app/src/components/Pipeline/PipelineKanban.tsx) — Renderiza las columnas dinámicas del pipeline y maneja zonas de soltado para `@dnd-kit`.
* [`PipelineColumn.tsx`](file:///Users/eimvi/Documents/GitHub/crm-tibs-app/src/components/Pipeline/PipelineColumn.tsx) — Columna de etapa con header de métricas monetarias acumuladas, colapso visual y listado ordenado.
* [`OpportunityCard.tsx`](file:///Users/eimvi/Documents/GitHub/crm-tibs-app/src/components/Pipeline/OpportunityCard.tsx) — Tarjeta de oportunidad comercial con chip de estado, ejecutivo, monto y menú rápido.
* [`OpportunityForm.tsx`](file:///Users/eimvi/Documents/GitHub/crm-tibs-app/src/components/Pipeline/OpportunityForm.tsx) — Modal interactivo de alta/edición de acuerdos, selección de empresa, cliente, montos y catálogo.
* [`OpportunityHistoryTable.tsx`](file:///Users/eimvi/Documents/GitHub/crm-tibs-app/src/components/Pipeline/OpportunityHistoryTable.tsx) — Vista tabular de lista comercial integrada sobre el componente compartido `Table` (`@tanstack/react-table` variante `cards`), con ordenamiento interactivo por encabezados, acordeón responsive en móvil (`hideOnMobile`) y paginación desacoplada.
* [`PipelineToolbar.tsx`](file:///Users/eimvi/Documents/GitHub/crm-tibs-app/src/components/Pipeline/PipelineToolbar.tsx) — Barra superior con búsqueda, filtros rápidos por contacto/ejecutivo, selector de vista y exportación a PDF.
* [`PipelineStagesSettings.tsx`](file:///Users/eimvi/Documents/GitHub/crm-tibs-app/src/components/Pipeline/PipelineStagesSettings.tsx) — Panel de configuración de etapas comerciales, ordenación y colores.

### 2.2 Mesa de Ayuda y Soporte (`src/components/Helpdesk/`)
* [`HelpdeskKanban.tsx`](file:///Users/eimvi/Documents/GitHub/crm-tibs-app/src/components/Helpdesk/HelpdeskKanban.tsx) — Tablero de soporte por etapas de resolución (Abierto, En Progreso, Esperando Cliente, Resuelto).
* [`HelpdeskColumn.tsx`](file:///Users/eimvi/Documents/GitHub/crm-tibs-app/src/components/Helpdesk/HelpdeskColumn.tsx) — Columna droppable de tickets con contadores de volumen y severidad.
* [`TicketCard.tsx`](file:///Users/eimvi/Documents/GitHub/crm-tibs-app/src/components/Helpdesk/TicketCard.tsx) — Tarjeta de ticket con indicador de prioridad cromática, número de folio y días transcurridos.
* [`TicketDetail.tsx`](file:///Users/eimvi/Documents/GitHub/crm-tibs-app/src/components/Helpdesk/TicketDetail.tsx) — Panel lateral / modal de detalle integral con cambio de etapa, asignación y pestañas.
* [`TicketInteractionsTab.tsx`](file:///Users/eimvi/Documents/GitHub/crm-tibs-app/src/components/Helpdesk/TicketInteractionsTab.tsx) — Feed de notas públicas e internas entre técnicos y clientes.
* [`TicketsListTable.tsx`](file:///Users/eimvi/Documents/GitHub/crm-tibs-app/src/components/Helpdesk/TicketsListTable.tsx) — Vista de lista de tickets integrada sobre el componente compartido `Table` (`@tanstack/react-table` con variante `cards` o `flat`), con ordenamiento interactivo multivariable, semáforo SLA de días en etapa, alerta de casos desatendidos (>24h sin agente), estrellas de severidad y paginación centralizada.
* [`HelpdeskCronSettings.tsx`](file:///Users/eimvi/Documents/GitHub/crm-tibs-app/src/components/Helpdesk/HelpdeskCronSettings.tsx) — Configuración del cron de revisión de tickets huérfanos y SLAs.

### 2.3 Agenda y Actividades (`src/components/Activity/`)
* [`ActivitiesCalendar.tsx`](file:///Users/eimvi/Documents/GitHub/crm-tibs-app/src/components/Activity/ActivitiesCalendar.tsx) — Integración de FullCalendar con vistas de cuadrícula horaria, mensual e interacción con clics de slot.
* [`ActivitiesTable.tsx`](file:///Users/eimvi/Documents/GitHub/crm-tibs-app/src/components/Activity/ActivitiesTable.tsx) — Vista tabular de citas y tareas integrada sobre el componente compartido `Table` (`@tanstack/react-table` variante `cards`), con badges de proveedores de calendario (Google, Outlook, iCloud), celda de recordatorio interactiva (`ActivityReminderCell`) con campana animada y tooltip flotante, y paginación desacoplada.
* [`ActivityEventCard.tsx`](file:///Users/eimvi/Documents/GitHub/crm-tibs-app/src/components/Activity/ActivityEventCard.tsx) — Renderizador personalizado del chip de evento dentro de la celda de FullCalendar.
* [`ActivityPopover.tsx`](file:///Users/eimvi/Documents/GitHub/crm-tibs-app/src/components/Activity/ActivityPopover.tsx) — Popover flotante con detalles de la cita, participantes y accesos de edición/borrado.
* [`ActivityForm.tsx`](file:///Users/eimvi/Documents/GitHub/crm-tibs-app/src/components/Activity/ActivityForm.tsx) — Modal para programar llamadas, reuniones, demostraciones o tareas.
* [`ActivityTypeLegend.tsx`](file:///Users/eimvi/Documents/GitHub/crm-tibs-app/src/components/Activity/ActivityTypeLegend.tsx) — Barra de insignias cromáticas explicativas de cada tipo de actividad operativa.

### 2.4 Directorio de Clientes y Cuentas B2B (`src/pages/Clients/`)
* [`ClientsPage.tsx`](file:///Users/eimvi/Documents/GitHub/crm-tibs-app/src/pages/ClientsPage.tsx) — Orquestador del directorio comercial con conmutador de sub-pestañas ("Contactos" vs "Empresas") y sincronización de datos.
* [`ContactsTable.tsx`](file:///Users/eimvi/Documents/GitHub/crm-tibs-app/src/pages/Clients/contacts/components/ContactsTable.tsx) — Vista tabular de contactos sobre el componente compartido `Table` (`variant="cards"`), con avatar dinámico, categoría comercial (`Badge`), buscador y filtros.
* [`CompaniesTable.tsx`](file:///Users/eimvi/Documents/GitHub/crm-tibs-app/src/pages/Clients/companies/components/CompaniesTable.tsx) — Vista tabular de empresas B2B sobre `Table` (`variant="cards"`), con razón social, enlace web externo, contador de contactos y switch reactivo de estatus.
* [`ContactModal.tsx`](file:///Users/eimvi/Documents/GitHub/crm-tibs-app/src/pages/Clients/contacts/components/ContactModal.tsx) & [`ContactForm.tsx`](file:///Users/eimvi/Documents/GitHub/crm-tibs-app/src/pages/Clients/contacts/components/ContactForm.tsx) — Modal y formulario de contacto con validación declarativa Yup (`contactValidationSchema`).
* [`CompanyModal.tsx`](file:///Users/eimvi/Documents/GitHub/crm-tibs-app/src/pages/Clients/companies/components/CompanyModal.tsx) & [`CompanyForm.tsx`](file:///Users/eimvi/Documents/GitHub/crm-tibs-app/src/pages/Clients/companies/components/CompanyForm.tsx) — Modal y formulario de empresa B2B con validación declarativa Yup (`companyValidationSchema`).

### 2.5 Catálogo de Productos y Servicios (`src/components/Product/`)
* [`ProductsTable.tsx`](file:///Users/eimvi/Documents/GitHub/crm-tibs-app/src/components/Product/ProductsTable.tsx) — Vista tabular de productos y servicios homologada sobre el componente compartido `Table` (`@tanstack/react-table` variante `cards`), con ordenamiento por SKU, nombre y precio, preview de miniatura de imagen, switch de activación y menú de acciones.
* [`ProductForm.tsx`](file:///Users/eimvi/Documents/GitHub/crm-tibs-app/src/components/Product/ProductForm.tsx) — Modal y formulario reactivo para creación/edición de productos con pestañas de datos generales, fichas técnicas y notas para el agente IA.
* [`ProductFiltersBar.tsx`](file:///Users/eimvi/Documents/GitHub/crm-tibs-app/src/components/Product/ProductFiltersBar.tsx) — Barra de búsqueda y filtrado por categoría y disponibilidad en catálogo.
* [`ProductFilesTab.tsx`](file:///Users/eimvi/Documents/GitHub/crm-tibs-app/src/components/Product/ProductFilesTab.tsx) — Gestión y previsualización de archivos técnicos adjuntos en PDF e imágenes.

### 2.6 Control de Gastos Corporativos (`src/components/Expense/`)
* [`ExpensesTable.tsx`](file:///Users/eimvi/Documents/GitHub/crm-tibs-app/src/components/Expense/ExpensesTable.tsx) — Vista tabular de gastos homologada sobre el componente compartido `Table` (`@tanstack/react-table` variante `cards`), con formateo monetario en MXN/USD, fecha, categoría, usuario responsable y descarga de comprobantes.
* [`ExpenseForm.tsx`](file:///Users/eimvi/Documents/GitHub/crm-tibs-app/src/components/Expense/ExpenseForm.tsx) — Formulario reactivo para registro y edición de gastos corporativos con selector de divisas y categorías.
* [`ExpenseFiltersBar.tsx`](file:///Users/eimvi/Documents/GitHub/crm-tibs-app/src/components/Expense/ExpenseFiltersBar.tsx) — Barra de filtros por categoría de gasto, rango de fechas y buscador en tiempo real.
* [`ReceiptUploadModal.tsx`](file:///Users/eimvi/Documents/GitHub/crm-tibs-app/src/components/Expense/ReceiptUploadModal.tsx) — Diálogo modal interactivo para visualización y carga de recibos y facturas fiscales.

### 2.7 Administración de Usuarios y RBAC (`src/components/User/`)
* [`UsersTable.tsx`](file:///Users/eimvi/Documents/GitHub/crm-tibs-app/src/components/User/UsersTable.tsx) — Vista tabular de administración de usuarios homologada sobre el componente compartido `Table` (`@tanstack/react-table` variante `cards`), con avatar dinámico, badges cromáticos de roles RBAC, switches de activación/desactivación y modal de edición.
* [`UserForm.tsx`](file:///Users/eimvi/Documents/GitHub/crm-tibs-app/src/components/User/UserForm.tsx) — Formulario de alta y edición de cuentas de ejecutivos y administradores con validación de roles y contraseña.
* [`UserFiltersBar.tsx`](file:///Users/eimvi/Documents/GitHub/crm-tibs-app/src/components/User/UserFiltersBar.tsx) — Barra de búsqueda por nombre/correo y filtrado por roles del sistema (`Admin`, `Sales`, `Support`).
* [`ProfileImageUploadModal.tsx`](file:///Users/eimvi/Documents/GitHub/crm-tibs-app/src/components/User/ProfileImageUploadModal.tsx) — Diálogo interactivo para carga y recorte de fotografía de perfil institucional.

### 2.8 Chat Omnicanal y Asistente Virtual (`src/components/WebChat/`)
* [`ChatListSidebar.tsx`](file:///Users/eimvi/Documents/GitHub/crm-tibs-app/src/components/WebChat/ChatListSidebar.tsx) — Bandeja lateral de conversaciones entrantes con buscador, filtros por canal, badges compartidos (`Badge`) de estado bot/humano y ventana de WhatsApp, y estado vacío (`EmptyState`).
* [`ChatWindowHeader.tsx`](file:///Users/eimvi/Documents/GitHub/crm-tibs-app/src/components/WebChat/ChatWindowHeader.tsx) — Encabezado limpio de la conversación activa con badge de canal, selector compacto de asignación de ejecutivo y toggle interactivo IA / Humano.
* [`MessageFeed.tsx`](file:///Users/eimvi/Documents/GitHub/crm-tibs-app/src/components/WebChat/MessageFeed.tsx) — Feed cronológico con divisores de día estilo WhatsApp, visualización de estados de entrega y renderizado de plantillas y cotizaciones PDF.
* [`MessageInputBar.tsx`](file:///Users/eimvi/Documents/GitHub/crm-tibs-app/src/components/WebChat/MessageInputBar.tsx) — Barra de entrada con detección de ventana de 23h, botón compartido (`Button`) con spinner de carga (`Loader`), badge de verificación de Meta (`Badge`), hover preview interactivo de WhatsApp en vivo y enlace al catálogo completo.
* [`WhatsAppTemplateSelectorModal.tsx`](file:///Users/eimvi/Documents/GitHub/crm-tibs-app/src/components/WebChat/WhatsAppTemplateSelectorModal.tsx) — Modal modular basado en el componente compartido (`Modal`) con catálogo filtrable de plantillas de Meta, insignias (`Badge`), campos dinámicos de parámetros (`Input`), estados vacíos (`EmptyState`) y botones de acción (`Button`).
* [`SimulatorPanel.tsx`](file:///Users/eimvi/Documents/GitHub/crm-tibs-app/src/components/WebChat/SimulatorPanel.tsx) — Panel desplegable para simular mensajes entrantes de WhatsApp o redes sociales, estandarizado con componentes compartidos (`Input`, `TextArea`, `Button`).
* [`WebChat.tsx`](file:///Users/eimvi/Documents/GitHub/crm-tibs-app/src/components/WebChat/WebChat.tsx) — Widget flotante de asistencia inteligente en el sistema para consultas en lenguaje natural.

### 2.9 Centro de Configuración (`src/pages/settings/`)
* [`SettingsSidebar.tsx`](file:///Users/eimvi/Documents/GitHub/crm-tibs-app/src/pages/settings/SettingsSidebar.tsx) — Menú de navegación vertical de opciones del tenant y del sistema.
* [`MyCompanyPage.tsx`](file:///Users/eimvi/Documents/GitHub/crm-tibs-app/src/pages/settings/MyCompany/MyCompanyPage.tsx) — Módulo desacoplado de la organización: identidad, suscripción contratada, consumo de IA, actividad diaria interactiva y auditoría exportable.
* [`InteractionHistoryTable.tsx`](file:///Users/eimvi/Documents/GitHub/crm-tibs-app/src/pages/settings/MyCompany/components/InteractionHistoryTable.tsx) — Historial de interacciones de IA sobre `Table` (`variant="cards"`), con banner de filtro activo y exportación a Excel/PDF.
* [`MyCalendarPage.tsx`](file:///Users/eimvi/Documents/GitHub/crm-tibs-app/src/pages/settings/MyCalendar/MyCalendarPage.tsx) — Módulo modular de agenda y calendarios externos: vinculación OAuth2 con Google Calendar y Microsoft Outlook, sincronización en tiempo real y bloqueo por proveedor activo.
* [`ActivityTypesPage.tsx`](file:///Users/eimvi/Documents/GitHub/crm-tibs-app/src/pages/settings/ActivityTypes/ActivityTypesPage.tsx) — Módulo modular de tipos de actividad del CRM: arquitectura desacoplada (`components/`, `schemas/`, `utils/`), TanStack Table (`Table`), validación Yup, vista previa cromática y búsqueda unificada.
* [`AiAgentChannelsPage.tsx`](file:///Users/eimvi/Documents/GitHub/crm-tibs-app/src/pages/settings/AiAgentChannels/AiAgentChannelsPage.tsx) — Módulo modular de Agente IA y Canales de Comunicación: banner de salud operativa (`AiAgentStatsBanner`), lienzo orquestador visual con curvas Bézier (`AiOrchestratorCanvas`), tabla de sub-agentes sobre `Table`, validación Yup y tarjetas de canales Meta.
* [`GlobalAiCredentialsPage.tsx`](file:///Users/eimvi/Documents/GitHub/crm-tibs-app/src/pages/settings/GlobalAiCredentials/GlobalAiCredentialsPage.tsx) — Módulo modular de Credenciales & LLM Global: tabla TanStack Table sobre `Table`, banner de KPIs, tarjeta de inferencia rápida y toggle seguro de llaves de API.
* [`TenantsPage.tsx`](file:///Users/eimvi/Documents/GitHub/crm-tibs-app/src/pages/settings/Tenants/TenantsPage.tsx) — Módulo modular de Gestión de Organizaciones (Tenants): tabla sobre `Table`, banner de KPIs, validación Yup, switches de sobregiro y cola de renovación.
* [`SubscriptionPlansPage.tsx`](file:///Users/eimvi/Documents/GitHub/crm-tibs-app/src/pages/settings/SubscriptionPlans/SubscriptionPlansPage.tsx) — Módulo modular de Planes de Suscripción SaaS: tabla sobre `Table`, banner de KPIs, validación declarativa con Yup y atajos de periodicidad.
* [`OpportunityCatalogsPage.tsx`](file:///Users/eimvi/Documents/GitHub/crm-tibs-app/src/pages/settings/OpportunityCatalogs/OpportunityCatalogsPage.tsx) — Módulo modular de catálogos comerciales (Línea de Negocio, Tipo de Entrega, Licenciamiento) sobre `Table` con sub-pestañas dinámicas.
* [`DashboardIndicatorsPage.tsx`](file:///Users/eimvi/Documents/GitHub/crm-tibs-app/src/pages/settings/DashboardIndicators/DashboardIndicatorsPage.tsx) — Módulo de indicadores analíticos del dashboard sobre `Table`.

---

## 🛠️ 3. Componentes Compartidos del Sistema (`src/components/shared/` & Utilerías)

| Componente / Utilidad | Propósito Técnico |
| :--- | :--- |
| **`Table`** ([`src/components/shared/Table/`](file:///Users/eimvi/Documents/GitHub/crm-tibs-app/src/components/shared/Table/)) | **Suite integral headless de tablas basada en `@tanstack/react-table` 8.x.** Estandarizada como componente único consumido en todo el CRM (Pipeline, Helpdesk, Actividades, Clientes, Empresas, Productos, Gastos, Usuarios y Ajustes). Provee soporte para: <br/>• **Variante `cards`:** Filas elevadas tipo tarjeta con separación (`borderSpacing: 0 0.75rem`), hover states, badge visual y acordeón responsive en móvil (`hideOnMobile`).<br/>• **Variante `flat`:** Estilo tabular clásico compacto con cabecera fija y bordes sutiles.<br/>• **Paginación Desacoplada (`TablePagination`):** Detección automática de paginación interna o externa (`totalPages`, `onPageChange`), navegación acotada a 7 botones con elipsis.<br/>• **Estados Integrados:** Esqueletos de carga animados (`TableLoading`) y estado vacío estilizado (`TableEmpty`). |
| [`Button.tsx`](file:///Users/eimvi/Documents/GitHub/crm-tibs-app/src/components/shared/Button.tsx) | Botón interactivo multivariante (`primary`, `secondary`, `danger`, `outline`) con soporte de spinners de carga (`Loader`). |
| [`Input.tsx`](file:///Users/eimvi/Documents/GitHub/crm-tibs-app/src/components/shared/Input.tsx) | Campo de texto accesible con soporte de iconos prefix/suffix y estados de error. |
| [`TextArea.tsx`](file:///Users/eimvi/Documents/GitHub/crm-tibs-app/src/components/shared/TextArea.tsx) | Área de texto multi-línea con control de filas, resize y estados de error. |
| [`Select.tsx`](file:///Users/eimvi/Documents/GitHub/crm-tibs-app/src/components/shared/Select.tsx) | Selector desplegable estilizado con soporte para temas claros y oscuros. |
| [`CreatableSelect.tsx`](file:///Users/eimvi/Documents/GitHub/crm-tibs-app/src/components/shared/CreatableSelect.tsx) | Selector avanzado con capacidad de creación de nuevas opciones al vuelo (`react-select`). |
| [`Modal.tsx`](file:///Users/eimvi/Documents/GitHub/crm-tibs-app/src/components/shared/Modal.tsx) | Ventana modal accesible con backdrop desenfocado, cierre con Escape y animaciones. |
| [`ConfirmModal.tsx`](file:///Users/eimvi/Documents/GitHub/crm-tibs-app/src/components/shared/ConfirmModal.tsx) | Diálogo de confirmación para acciones destructivas o cambios de estado críticos. |
| [`FormField.tsx`](file:///Users/eimvi/Documents/GitHub/crm-tibs-app/src/components/shared/FormField.tsx) | Envoltorio para campos de formulario con etiquetas, asterisco de obligatoriedad y mensaje de error Yup. |
| [`SettingsContainer.tsx`](file:///Users/eimvi/Documents/GitHub/crm-tibs-app/src/components/shared/SettingsContainer.tsx) | Contenedor unificado para módulos de configuración con encabezado, descripción y slots de acción. |
| [`Tabs.tsx`](file:///Users/eimvi/Documents/GitHub/crm-tibs-app/src/components/shared/Tabs.tsx) | Pestañas de navegación interna estilizadas con transiciones de contenido y contadores. |
| [`Dropzone.tsx`](file:///Users/eimvi/Documents/GitHub/crm-tibs-app/src/components/shared/Dropzone.tsx) | Área de arrastrar y soltar para carga de archivos adjuntos (PDFs, recibos, fotos de perfil). |
| [`UnifiedSearchBar.tsx`](file:///Users/eimvi/Documents/GitHub/crm-tibs-app/src/components/shared/UnifiedSearchBar.tsx) | Barra de búsqueda universal con debounce, sugerencias rápidas y chips de parámetros activos. |
| [`StageStepper.tsx`](file:///Users/eimvi/Documents/GitHub/crm-tibs-app/src/components/shared/StageStepper.tsx) | Indicador visual interactivo de progreso tipo "pasos" para el avance de oportunidades o tickets. |
| [`StageVisibilitySelector.tsx`](file:///Users/eimvi/Documents/GitHub/crm-tibs-app/src/components/shared/StageVisibilitySelector.tsx) | Selector de visibilidad de etapas del embudo comercial. |
| [`Badge.tsx`](file:///Users/eimvi/Documents/GitHub/crm-tibs-app/src/components/shared/Badge.tsx) | Etiqueta cromática compacta para estatus, roles y tipos (soporta modo `dot` y múltiples temas). |
| [`EmptyState.tsx`](file:///Users/eimvi/Documents/GitHub/crm-tibs-app/src/components/shared/EmptyState.tsx) | Mensaje visual estilizado para listas, bandejas o búsquedas sin resultados. |
| [`Loader.tsx`](file:///Users/eimvi/Documents/GitHub/crm-tibs-app/src/components/shared/Loader.tsx) | Spinner de carga animado multivariante y adaptable a tema. |
| [`SkeletonLoader.tsx`](file:///Users/eimvi/Documents/GitHub/crm-tibs-app/src/components/shared/SkeletonLoader.tsx) | Efecto esqueleto de carga de baja fidelidad para suavizar la percepción de latencia. |
| [`Notification.tsx`](file:///Users/eimvi/Documents/GitHub/crm-tibs-app/src/components/shared/Notification.tsx) | Banner de aviso informativo, de advertencia, éxito o error con botón de descarte. |
| [`PwaUpdateNotification.tsx`](file:///c:/Users/sopor/Proyectos/CRM/crm-tibs-app/src/components/shared/PwaUpdateNotification.tsx) | Banner / Toast flotante para notificación interactiva de nuevas versiones disponibles de la PWA. Gestiona `useRegisterSW` (`virtual:pwa-register/react`), verificación periódica y al recuperar el foco (`visibilitychange`), y activación controlada (`SKIP_WAITING` + reload). |
| [`ConnectionStatusBadge.tsx`](file:///c:/Users/sopor/Proyectos/CRM/crm-tibs-app/src/components/shared/ConnectionStatusBadge.tsx) | Indicador visual de estado de conectividad en tiempo real (WebSocket). Renderiza un punto verde pulsante ("En vivo") o ámbar con animación ping ("Reconectando...") con tooltip contextual para retroalimentación UX no intrusiva. |
| [`useFormValidation.ts`](file:///Users/eimvi/Documents/GitHub/crm-tibs-app/src/components/shared/useFormValidation.ts) | Hook para validación declarativa de formularios acoplado a esquemas de Yup. |
| [`toast.ts`](file:///Users/eimvi/Documents/GitHub/crm-tibs-app/src/utils/toast.ts) | Utilería `showToast` construida sobre SweetAlert2 (`Swal.mixin({ toast: true, ... })`), proveyendo retroalimentación visual reactiva. |

---

## 🔗 Enlaces Relacionados
* [[MOC - Mapa de Contenidos Frontend]] — Índice maestro de contenidos.
* [[Matriz de Servicios y Hooks API]] — Servicios y hooks que alimentan estos componentes.
* [[CRM TIBS APP]] — Hub Principal.
