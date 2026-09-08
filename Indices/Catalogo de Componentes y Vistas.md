---
title: Catálogo de Componentes y Vistas Frontend
tags:
  - "#indices-ai"
  - "#componentes"
  - "#ui-ux"
  - "#react"
date: 2026-09-08
status: produccion
---

# 🧩 Catálogo de Componentes y Vistas Frontend

Este documento compendia la totalidad de vistas y componentes modulares que conforman la interfaz de usuario de **CRM TIBS App**, organizados por dominio funcional y nivel de abstracción.

---

## 📄 1. Vistas y Páginas Principales (`src/pages/`)

| Vista / Archivo | Ruta | Nivel de Acceso | Responsabilidad Funcional |
| :--- | :--- | :--- | :--- |
| [`LoginPage.tsx`](file:///c:/Users/sopor/Proyectos/CRM/crm-tibs-app/src/pages/LoginPage.tsx) | `/login` | Público | Autenticación de usuarios por email/contraseña, renderizado de fondo visual e inicio de sesión. |
| [`SupportTicketPage.tsx`](file:///c:/Users/sopor/Proyectos/CRM/crm-tibs-app/src/pages/SupportTicketPage.tsx) | `/support` | Público | Portal abierto de autoservicio para consulta y registro directo de tickets de clientes. |
| [`ForgotPasswordPage.tsx`](file:///c:/Users/sopor/Proyectos/CRM/crm-tibs-app/src/pages/ForgotPasswordPage.tsx) | `/forgot-password` | Público | Solicitud de restablecimiento de contraseña vía correo electrónico institucional. |
| [`ResetPasswordPage.tsx`](file:///c:/Users/sopor/Proyectos/CRM/crm-tibs-app/src/pages/ResetPasswordPage.tsx) | `/reset-password` | Público | Ingreso de nueva contraseña mediante token temporal recibido por correo. |
| [`DashboardPage.tsx`](file:///c:/Users/sopor/Proyectos/CRM/crm-tibs-app/src/pages/DashboardPage.tsx) | `/dashboard` | Protegido | Central analítica con KPIs comerciales y de soporte, gráficos interactivos y exportación a PDF. |
| [`CompaniesPage.tsx`](file:///c:/Users/sopor/Proyectos/CRM/crm-tibs-app/src/pages/CompaniesPage.tsx) | `/companies` | Protegido | Directorio B2B de empresas cliente, razón social, RFC, teléfonos y gestión de estatus. |
| [`ClientsPage.tsx`](file:///c:/Users/sopor/Proyectos/CRM/crm-tibs-app/src/pages/ClientsPage.tsx) | `/clients` | Protegido | Directorio de contactos y clientes particulares asociados o no a empresas, importación y edición. |
| [`ProductsPage.tsx`](file:///c:/Users/sopor/Proyectos/CRM/crm-tibs-app/src/pages/ProductsPage.tsx) | `/products` | Protegido | Catálogo de productos y servicios ofertados, lista de precios, fichas técnicas y notas para IA. |
| [`PipelinePage.tsx`](file:///c:/Users/sopor/Proyectos/CRM/crm-tibs-app/src/pages/PipelinePage.tsx) | `/pipeline` | Protegido | Tablero Kanban comercial y vista de lista, Drag & Drop (`@dnd-kit`) y filtros avanzados. |
| [`HelpdeskPage.tsx`](file:///c:/Users/sopor/Proyectos/CRM/crm-tibs-app/src/pages/HelpdeskPage.tsx) | `/helpdesk` | Protegido | Mesa de soporte y atención técnica con flujo Kanban de etapas, prioridades y bitácora de mensajes. |
| [`ConversationsPage.tsx`](file:///c:/Users/sopor/Proyectos/CRM/crm-tibs-app/src/pages/ConversationsPage.tsx) | `/conversations` | Protegido | Consola de mensajería omnicanal en tiempo real (WhatsApp, redes sociales y chat web) con WebSocket. |
| [`ActivitiesPage.tsx`](file:///c:/Users/sopor/Proyectos/CRM/crm-tibs-app/src/pages/ActivitiesPage.tsx) | `/activities` | Protegido | Calendario operativo con FullCalendar (`@fullcalendar/react`), tipos cromáticos y tabla de citas. |
| [`ExpensesPage.tsx`](file:///c:/Users/sopor/Proyectos/CRM/crm-tibs-app/src/pages/ExpensesPage.tsx) | `/expenses` | Protegido | Registro y control de gastos corporativos, subida y descarga de comprobantes / facturas. |
| [`UsersPage.tsx`](file:///c:/Users/sopor/Proyectos/CRM/crm-tibs-app/src/pages/UsersPage.tsx) | `/users` | Protegido (Admin) | Administración de usuarios, asignación de roles RBAC, activación/desactivación y avatar. |
| [`SettingsPage.tsx`](file:///c:/Users/sopor/Proyectos/CRM/crm-tibs-app/src/pages/SettingsPage.tsx) | `/settings` | Protegido | Centro global de configuración: empresa, calendarios externos, catálogos, credenciales IA y tenants. |

---

## 📦 2. Componentes por Dominio Funcional

### 2.1 Tablero Comercial y Pipeline (`src/components/Pipeline/`)
* [`PipelineBoard.tsx`](file:///c:/Users/sopor/Proyectos/CRM/crm-tibs-app/src/components/Pipeline/PipelineBoard.tsx) — Contenedor maestro del tablero comercial, coordina cambio de vistas (Kanban vs Tabla) y sensor DndContext.
* [`PipelineKanban.tsx`](file:///c:/Users/sopor/Proyectos/CRM/crm-tibs-app/src/components/Pipeline/PipelineKanban.tsx) — Renderiza las columnas dinámicas del pipeline y maneja zonas de soltado para `@dnd-kit`.
* [`PipelineColumn.tsx`](file:///c:/Users/sopor/Proyectos/CRM/crm-tibs-app/src/components/Pipeline/PipelineColumn.tsx) — Columna de etapa con header de métricas monetarias acumuladas, colapso visual y listado ordenado.
* [`OpportunityCard.tsx`](file:///c:/Users/sopor/Proyectos/CRM/crm-tibs-app/src/components/Pipeline/OpportunityCard.tsx) — Tarjeta de oportunidad comercial con chip de estado, ejecutivo, monto y menú rápido.
* [`OpportunityForm.tsx`](file:///c:/Users/sopor/Proyectos/CRM/crm-tibs-app/src/components/Pipeline/OpportunityForm.tsx) — Modal interactivo de alta/edición de acuerdos, selección de empresa, cliente, montos y catálogo.
* [`OpportunityHistoryTable.tsx`](file:///c:/Users/sopor/Proyectos/CRM/crm-tibs-app/src/components/Pipeline/OpportunityHistoryTable.tsx) — Tabla de auditoría cronológica del cambio de etapas de una oportunidad.
* [`PipelineToolbar.tsx`](file:///c:/Users/sopor/Proyectos/CRM/crm-tibs-app/src/components/Pipeline/PipelineToolbar.tsx) — Barra superior con búsqueda, filtros rápidos por contacto/ejecutivo, selector de vista y exportación a PDF.
* [`PipelineStagesSettings.tsx`](file:///c:/Users/sopor/Proyectos/CRM/crm-tibs-app/src/components/Pipeline/PipelineStagesSettings.tsx) — Panel de configuración de etapas comerciales, ordenación y colores.

### 2.2 Mesa de Ayuda y Soporte (`src/components/Helpdesk/`)
* [`HelpdeskKanban.tsx`](file:///c:/Users/sopor/Proyectos/CRM/crm-tibs-app/src/components/Helpdesk/HelpdeskKanban.tsx) — Tablero de soporte por etapas de resolución (Abierto, En Progreso, Esperando Cliente, Resuelto).
* [`HelpdeskColumn.tsx`](file:///c:/Users/sopor/Proyectos/CRM/crm-tibs-app/src/components/Helpdesk/HelpdeskColumn.tsx) — Columna droppable de tickets con contadores de volumen y severidad.
* [`TicketCard.tsx`](file:///c:/Users/sopor/Proyectos/CRM/crm-tibs-app/src/components/Helpdesk/TicketCard.tsx) — Tarjeta de ticket con indicador de prioridad cromática, número de folio y días transcurridos.
* [`TicketDetail.tsx`](file:///c:/Users/sopor/Proyectos/CRM/crm-tibs-app/src/components/Helpdesk/TicketDetail.tsx) — Panel lateral / modal de detalle integral con cambio de etapa, asignación y pestañas.
* [`TicketInteractionsTab.tsx`](file:///c:/Users/sopor/Proyectos/CRM/crm-tibs-app/src/components/Helpdesk/TicketInteractionsTab.tsx) — Feed de notas públicas e internas entre técnicos y clientes.
* [`TicketsListTable.tsx`](file:///c:/Users/sopor/Proyectos/CRM/crm-tibs-app/src/components/Helpdesk/TicketsListTable.tsx) — Vista tabular densa de tickets con paginación y ordenamiento multivariable.
* [`HelpdeskCronSettings.tsx`](file:///c:/Users/sopor/Proyectos/CRM/crm-tibs-app/src/components/Helpdesk/HelpdeskCronSettings.tsx) — Configuración del cron de revisión de tickets huérfanos y SLAs.

### 2.3 Agenda y Actividades (`src/components/Activity/`)
* [`ActivitiesCalendar.tsx`](file:///c:/Users/sopor/Proyectos/CRM/crm-tibs-app/src/components/Activity/ActivitiesCalendar.tsx) — Integración de FullCalendar con vistas de cuadrícula horaria, mensual e interacción con clics de slot.
* [`ActivityEventCard.tsx`](file:///c:/Users/sopor/Proyectos/CRM/crm-tibs-app/src/components/Activity/ActivityEventCard.tsx) — Renderizador personalizado del chip de evento dentro de la celda de FullCalendar.
* [`ActivityPopover.tsx`](file:///c:/Users/sopor/Proyectos/CRM/crm-tibs-app/src/components/Activity/ActivityPopover.tsx) — Popover flotante con detalles de la cita, participantes y accesos de edición/borrado.
* [`ActivityForm.tsx`](file:///c:/Users/sopor/Proyectos/CRM/crm-tibs-app/src/components/Activity/ActivityForm.tsx) — Modal para programar llamadas, reuniones, demostraciones o tareas.
* [`ActivityTypeLegend.tsx`](file:///c:/Users/sopor/Proyectos/CRM/crm-tibs-app/src/components/Activity/ActivityTypeLegend.tsx) — Barra de insignias cromáticas explicativas de cada tipo de actividad operativa.

### 2.4 Chat Omnicanal y Asistente Virtual (`src/components/WebChat/`)
* [`ChatListSidebar.tsx`](file:///c:/Users/sopor/Proyectos/CRM/crm-tibs-app/src/components/WebChat/ChatListSidebar.tsx) — Bandeja lateral de conversaciones entrantes con buscador, filtros por canal y estado del bot.
* [`ChatWindowHeader.tsx`](file:///c:/Users/sopor/Proyectos/CRM/crm-tibs-app/src/components/WebChat/ChatWindowHeader.tsx) — Encabezado de la conversación activa con badge de canal, asignación y toggle IA / Humano.
* [`MessageFeed.tsx`](file:///c:/Users/sopor/Proyectos/CRM/crm-tibs-app/src/components/WebChat/MessageFeed.tsx) — Feed cronológico con divisores de día estilo WhatsApp y detección de cotizaciones PDF.
* [`MessageInputBar.tsx`](file:///c:/Users/sopor/Proyectos/CRM/crm-tibs-app/src/components/WebChat/MessageInputBar.tsx) — Barra de entrada de texto enriquecido y envío instantáneo vía WebSocket.
* [`SimulatorPanel.tsx`](file:///c:/Users/sopor/Proyectos/CRM/crm-tibs-app/src/components/WebChat/SimulatorPanel.tsx) — Panel desplegable para simular mensajes entrantes de WhatsApp o redes sociales.
* [`WebChat.tsx`](file:///c:/Users/sopor/Proyectos/CRM/crm-tibs-app/src/components/WebChat/WebChat.tsx) — Widget flotante de asistencia inteligente en el sistema para consultas en lenguaje natural.

### 2.5 Centro de Configuración (`src/components/Settings/`)
* [`SettingsSidebar.tsx`](file:///c:/Users/sopor/Proyectos/CRM/crm-tibs-app/src/components/Settings/SettingsSidebar.tsx) — Menú de navegación vertical de opciones del tenant y del sistema.
* [`MyCompanySection.tsx`](file:///c:/Users/sopor/Proyectos/CRM/crm-tibs-app/src/components/Settings/MyCompanySection.tsx) — Ajustes de la organización: nombre comercial, logotipo y datos fiscales.
* [`CalendarIntegrationSettings.tsx`](file:///c:/Users/sopor/Proyectos/CRM/crm-tibs-app/src/components/Settings/CalendarIntegrationSettings.tsx) — Vinculación OAuth2 con Google Calendar, Microsoft Outlook y CalDAV de Apple iCloud.
* [`AiAgentSettings.tsx`](file:///c:/Users/sopor/Proyectos/CRM/crm-tibs-app/src/components/Settings/AiAgentSettings.tsx) — Parámetros de comportamiento del bot omnicanal y gestión de sub-agentes.
* [`GlobalAiCredentialsSettings.tsx`](file:///c:/Users/sopor/Proyectos/CRM/crm-tibs-app/src/components/Settings/GlobalAiCredentialsSettings.tsx) — Configuración de llaves de API (OpenAI, Anthropic, Gemini) a nivel de plataforma.
* [`TenantsSection.tsx`](file:///c:/Users/sopor/Proyectos/CRM/crm-tibs-app/src/components/Settings/TenantsSection.tsx) — Aprovisionamiento de inquilinos, monitoreo de cuotas y asignación de esquemas DB.
* [`PlansSection.tsx`](file:///c:/Users/sopor/Proyectos/CRM/crm-tibs-app/src/components/Settings/PlansSection.tsx) — Catálogo de planes SaaS, límites de tokens y precios de suscripción.

---

## 🛠️ 3. Componentes Compartidos del Sistema (`src/components/shared/`)

| Componente | Propósito Técnico |
| :--- | :--- |
| [`Button.tsx`](file:///c:/Users/sopor/Proyectos/CRM/crm-tibs-app/src/components/shared/Button.tsx) | Botón interactivo multivariante (`primary`, `secondary`, `danger`, `outline`) con soporte de spinners de carga. |
| [`Input.tsx`](file:///c:/Users/sopor/Proyectos/CRM/crm-tibs-app/src/components/shared/Input.tsx) | Campo de texto accesible con soporte de iconos prefix/suffix y manejo de errores Yup. |
| [`Select.tsx`](file:///c:/Users/sopor/Proyectos/CRM/crm-tibs-app/src/components/shared/Select.tsx) | Selector desplegable estilizado con soporte para temas claros y oscuros. |
| [`CreatableSelect.tsx`](file:///c:/Users/sopor/Proyectos/CRM/crm-tibs-app/src/components/shared/CreatableSelect.tsx) | Selector avanzado con capacidad de creación de nuevas etiquetas al vuelo (react-select). |
| [`Modal.tsx`](file:///c:/Users/sopor/Proyectos/CRM/crm-tibs-app/src/components/shared/Modal.tsx) | Ventana modal con backdrop desenfocado, cierre con tecla Escape y animaciones suaves. |
| [`ConfirmModal.tsx`](file:///c:/Users/sopor/Proyectos/CRM/crm-tibs-app/src/components/shared/ConfirmModal.tsx) | Diálogo de confirmación para acciones destructivas (eliminación de registros). |
| [`Table.tsx`](file:///c:/Users/sopor/Proyectos/CRM/crm-tibs-app/src/components/shared/Table.tsx) | Tabla responsiva con soporte para encabezados ordenables, skeleton loaders y paginador. |
| [`Tabs.tsx`](file:///c:/Users/sopor/Proyectos/CRM/crm-tibs-app/src/components/shared/Tabs.tsx) | Pestañas de navegación interna con transiciones de contenido. |
| [`Dropzone.tsx`](file:///c:/Users/sopor/Proyectos/CRM/crm-tibs-app/src/components/shared/Dropzone.tsx) | Área de arrastrar y soltar para carga de archivos adjuntos (PDFs, imágenes de perfil, recibos). |
| [`UnifiedSearchBar.tsx`](file:///c:/Users/sopor/Proyectos/CRM/crm-tibs-app/src/components/shared/UnifiedSearchBar.tsx) | Barra de filtrado universal con debounce y chips de parámetros activos. |
| [`StageStepper.tsx`](file:///c:/Users/sopor/Proyectos/CRM/crm-tibs-app/src/components/shared/StageStepper.tsx) | Indicador visual de progreso tipo "pasos" para el avance de oportunidades o tickets. |
| [`Badge.tsx`](file:///c:/Users/sopor/Proyectos/CRM/crm-tibs-app/src/components/shared/Badge.tsx) | Etiqueta cromática compacta para estatus, roles y tipos. |

---

## 🔗 Enlaces Relacionados
* [[MOC - Mapa de Contenidos Frontend]] — Índice maestro de contenidos.
* [[Matriz de Servicios y Hooks API]] — Servicios y hooks que alimentan estos componentes.
* [[CRM TIBS APP]] — Hub Principal.
