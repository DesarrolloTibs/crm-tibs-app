---
title: Guía de Contexto y Recuperación para Agentes de IA (MCP Retrieval)
tags:
  - "#indices-ai"
  - "#mcp"
  - "#prompt-engineering"
  - "#antigravity"
date: 2026-09-08
status: produccion
---

# 🤖 Guía de Contexto y Recuperación para Agentes de IA (MCP Retrieval)

Esta guía técnica está diseñada para que **modelos de lenguaje (LLMs) y agentes inteligentes (como Antigravity)** puedan explorar, diagnosticar y responder con precisión absoluta sobre la arquitectura del frontend **CRM TIBS App** utilizando las herramientas del servidor MCP **`obsidian-ss-app`** (puerto `27130`).

---

## 🎯 1. Matriz de Enrutamiento Rápido para el Agente

Cuando recibas una consulta técnica o solicitud de modificación sobre el código fuente:

| Intención o Pregunta del Usuario | Acción Inmediata del Agente (`vault_read`) |
| :--- | :--- |
| **Arquitectura global, React 19, Vite 7 o PWA** | Leer `Proyectos/CRM TIBS APP.md` y `Proyectos/CRM TIBS - Arquitectura Frontend & React 19.md` |
| **Multi-tenancy, cabecera `x-tenant-schema` o Axios** | Leer `Proyectos/CRM TIBS - Multi-Tenancy, Axios & Interceptores.md` |
| **Inicio de sesión, JWT, roles RBAC o ProtectedRoute** | Leer `Proyectos/CRM TIBS - Autenticacion, JWT & Protected Routes.md` |
| **Tablero Kanban, Drag & Drop (`@dnd-kit`) o Pipeline** | Leer `Proyectos/CRM TIBS - Tablero Kanban & Pipeline Comercial.md` |
| **Agenda operativa, eventos o FullCalendar** | Leer `Proyectos/CRM TIBS - Calendario FullCalendar & Actividades.md` |
| **Directorio de clientes, empresas o interacciones** | Leer `Proyectos/CRM TIBS - Modulo de Clientes, Empresas & CRM.md` |
| **Mesa de ayuda, tickets de soporte o cron de SLAs** | Leer `Proyectos/CRM TIBS - Mesa de Ayuda, Tickets & Helpdesk.md` |
| **Chat omnicanal, WebSockets o control de Bot IA** | Leer `Proyectos/CRM TIBS - Chat Omnicanal, WebSockets & Agente IA.md` |
| **Catálogo de productos, cotizador o generación PDF** | Leer `Proyectos/CRM TIBS - Cotizaciones PDF & Modulo de Productos.md` |
| **Indicadores KPI, métricas de ventas o reportes** | Leer `Proyectos/CRM TIBS - Dashboard, Analitica & Reportes.md` |
| **Configuración del sistema, planes SaaS o tenants** | Leer `Proyectos/CRM TIBS - Centro de Configuracion, Tenants & Roles.md` |
| **Componentes visuales, modales o formularios** | Leer `Indices/Catalogo de Componentes y Vistas.md` |
| **Servicios HTTP, hooks personalizados o endpoints** | Leer `Indices/Matriz de Servicios y Hooks API.md` |
| **Mapa general de contenidos del sistema** | Leer `Indices/MOC - Mapa de Contenidos Frontend.md` |

---

## 🔍 2. Consultas Clave Recomendadas (`search_query` / `search_simple`)

Para localizar fragmentos específicos sin recorrer todo el árbol de archivos, utiliza las siguientes búsquedas optimizadas:

| Caso de Uso | Consulta MCP Recomendada |
| :--- | :--- |
| Inyección de esquema multi-tenant | `path:Proyectos "x-tenant-schema"` |
| Control de cuota y token agotado (402) | `path:Proyectos "TOKENS_LIMIT_EXCEEDED" OR "SUBSCRIPTION_EXPIRED"` |
| Eventos Socket.IO de mensajería | `path:Proyectos "message_received" OR "bot_status_changed"` |
| Configuración de sensores Drag & Drop | `path:Proyectos "PointerSensor" OR "TouchSensor"` |
| Renderizado de eventos FullCalendar | `path:Proyectos "eventContent" OR "ReminderEventCard"` |
| Integración OAuth2 de calendarios | `path:Proyectos "calendar-integrations" OR "connect-icloud"` |
| Detección de cotizaciones PDF en chat | `path:Proyectos "renderMessageContent" OR "jspdf-autotable"` |
| Redirección reactiva desde WebChat | `path:Proyectos "dashboardRedirect" OR "queryWebChat"` |

---

## 🛡️ 3. Invariantes Técnicas de Obligatorio Cumplimiento

Cualquier propuesta de código o refactorización en `src/` debe respetar las siguientes cuatro invariantes del frontend:

1. **Uso Obligatorio de `axiosInstance`:**
   * Nunca utilices `fetch` nativo ni instancias independientes de Axios para llamadas a la API de negocio. Toda solicitud debe cursar por `src/core/axios/axiosInstance.ts` para garantizar la inserción automática del Bearer token y la cabecera `x-tenant-schema`.
2. **Desempaquetado Automático de Respuestas:**
   * El interceptor de respuesta de `axiosInstance` extrae automáticamente el payload `response.data = response.data.data` si viene envuelto bajo el estándar NestJS (`{ statusCode, data, timestamp }`). Los servicios reciben directamente la entidad o arreglo.
3. **Control de Acceso mediante `ProtectedRoute`:**
   * Toda ruta nueva agregada en `src/App.tsx` debe envolverse en `<ProtectedRoute>` y, si requiere privilegios administrativos, utilizar la prop `adminOnly={true}`.
4. **Sincronización en Caliente (Hot Sync):**
   * Cualquier cambio que altere rutas, servicios, hooks o componentes debe sincronizarse inmediatamente con la bóveda de Obsidian utilizando `vault_patch` o `vault_write`.

---

## 🔗 Enlaces Relacionados
* [[MOC - Mapa de Contenidos Frontend]] — Índice maestro de notas.
* [[CRM TIBS APP]] — Hub Principal de la aplicación.
* [[Matriz de Servicios y Hooks API]] — Catálogo de capas de datos.
* [[Catalogo de Componentes y Vistas]] — Catálogo de interfaz de usuario.
