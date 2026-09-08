---
title: CRM TIBS - Centro de Configuración, Tenants & Roles
tags:
  - "#proyecto"
  - "#configuracion"
  - "#tenants"
  - "#roles"
  - "#rbac"
  - "#planes-saas"
date: 2026-09-08
status: produccion
---

# ⚙️ CRM TIBS — Centro de Configuración, Tenants & Roles

Este documento describe la arquitectura del panel de administración central ([`SettingsPage.tsx`](file:///c:/Users/sopor/Proyectos/CRM/crm-tibs-app/src/pages/SettingsPage.tsx)), la gestión de inquilinos (**Tenants**) y planes de suscripción SaaS, la configuración de credenciales de Inteligencia Artificial y la gobernanza de usuarios mediante **Control de Acceso Basado en Roles (RBAC)**.

---

## 🏛️ Jerarquía de Ajustes y Ámbitos de Seguridad (RBAC)

```mermaid
graph TD
    subgraph AmbitoSuperAdmin ["👑 Ámbito SuperAdmin (Plataforma Global)"]
        Tenants["🏢 Gestión de Tenants (`TenantsSection`)<br/>- Aprovisionamiento de Esquemas PostgreSQL<br/>- Monitoreo de Consumo de Tokens<br/>- Tolerancia de Sobregiro (allow_extra)"]
        Plans["💳 Catálogo de Planes SaaS (`PlansSection`)<br/>- Límite de Tokens, Precio y Facturación"]
        AICreds["🔑 Credenciales Globales IA (`GlobalAiCredentialsSettings`)<br/>- API Keys de OpenAI, Gemini y Anthropic"]
    end

    subgraph AmbitoAdmin ["🏢 Ámbito Admin de Tenant (Organización)"]
        Company["🏷️ Mi Empresa (`MyCompanySection`)<br/>- Logotipo, Razón Social y Datos de Contacto"]
        Users["👥 Gestión de Usuarios (`UsersPage`)<br/>- Alta de Ejecutivos, Roles y Avatares"]
        Catalogs["📑 Catálogos Dinámicos (`CatalogSubTabsPanel`)<br/>- Líneas de Negocio, Entregas y Licencias"]
        CronSLA["⏰ Cron de Mesa de Ayuda (`HelpdeskCronSettings`)"]
        BotConfig["🤖 Ajustes del Agente IA (`AiAgentSettings`)"]
    end

    subgraph AmbitoPersonal ["👤 Ámbito Ejecutivo / Usuario"]
        MyCal["📅 Mi Calendario (`CalendarIntegrationSettings`)<br/>- Vinculación OAuth con Google, Outlook e iCloud"]
    end

    AmbitoSuperAdmin --> AmbitoAdmin
    AmbitoAdmin --> AmbitoPersonal

    classDef sa fill:#854d0e,stroke:#eab308,color:#fff;
    classDef adm fill:#1e40af,stroke:#60a5fa,color:#fff;
    classDef usr fill:#0f766e,stroke:#2dd4bf,color:#fff;

    class Tenants,Plans,AICreds sa;
    class Company,Users,Catalogs,CronSLA,BotConfig adm;
    class MyCal usr;
```

---

## 🏢 1. Aprovisionamiento y Monitoreo de Tenants

El módulo de inquilinos ([`TenantsSection.tsx`](file:///c:/Users/sopor/Proyectos/CRM/crm-tibs-app/src/components/Settings/TenantsSection.tsx) y [`tenantsService.ts`](file:///c:/Users/sopor/Proyectos/CRM/crm-tibs-app/src/services/tenantsService.ts)) permite a los SuperAdmins:
* **Creación de Organizaciones:** Dispara la inicialización de un nuevo esquema PostgreSQL independiente en el backend.
* **Asignación de Planes SaaS:** Vinculación con [`plansService.ts`](file:///c:/Users/sopor/Proyectos/CRM/crm-tibs-app/src/services/plansService.ts) para asignar límites de tokens de IA por ciclo de facturación.
* **Control de Sobregiro (`allow_extra`):** Bandera booleana que determina si un cliente corporativo puede exceder temporalmente su cuota de tokens sin que el backend bloquee las consultas con error 402.
* **Telemetría de Consumo:** `getTenantConsumption(schemaName)` expone el porcentaje de cuota utilizado y la fecha programada de renovación.

---

## 👥 2. Administración de Usuarios y Permisos (`UsersPage.tsx`)

La pantalla de usuarios ([`src/pages/UsersPage.tsx`](file:///c:/Users/sopor/Proyectos/CRM/crm-tibs-app/src/pages/UsersPage.tsx)) está restringida exclusivamente a usuarios administradores mediante `ProtectedRoute adminOnly={true}`:
* **Asignación de Roles:**
  * `superadmin`: Acceso irrestricto a toda la infraestructura.
  * `admin`: Administrador exclusivo del esquema del tenant asignado.
  * `executive`: Asesor comercial/técnico con vistas operativas.
* **Carga de Avatares:** [`ProfileImageUploadModal.tsx`](file:///c:/Users/sopor/Proyectos/CRM/crm-tibs-app/src/components/User/ProfileImageUploadModal.tsx) sube imágenes al endpoint `/api/users/:id/profile-image` mediante multipart/form-data.
* **Activación/Desactivación:** `updateUserStatus(id, isActive)` revoca de inmediato la validez del token del usuario sin destruir sus registros históricos en el pipeline.

---

## 📑 3. Catálogos Dinámicos de Oportunidades

A través de [`CatalogSubTabsPanel.tsx`](file:///c:/Users/sopor/Proyectos/CRM/crm-tibs-app/src/components/Settings/CatalogSubTabsPanel.tsx) y [`opportunityCatalogsService.ts`](file:///c:/Users/sopor/Proyectos/CRM/crm-tibs-app/src/services/opportunityCatalogsService.ts), los administradores personalizan las opciones de sus formularios comerciales:
1. **Líneas de Negocio (`/api/business-lines`):** División comercial a la que pertenece el proyecto (e.g. *Consultoría*, *Desarrollo a Medida*, *Infraestructura Cloud*).
2. **Tipos de Entrega (`/api/delivery-types`):** Modalidad de prestación de servicios (e.g. *Remoto*, *Híbrido*, *En Sitio*).
3. **Licenciamientos (`/api/licensings`):** Esquema de venta (e.g. *SaaS Anual*, *Perpetuo*, *Mensual*).

---

## 🤖 4. Credenciales de IA y Ajustes del Agente Omnicanal

* **Credenciales Maestras ([`GlobalAiCredentialsSettings.tsx`](file:///c:/Users/sopor/Proyectos/CRM/crm-tibs-app/src/components/Settings/GlobalAiCredentialsSettings.tsx)):** Gestión de llaves de OpenAI, Google Gemini o Anthropic Claude utilizadas por los microservicios de IA de la plataforma.
* **Comportamiento del Bot ([`AiAgentSettings.tsx`](file:///c:/Users/sopor/Proyectos/CRM/crm-tibs-app/src/components/Settings/AiAgentSettings.tsx)):** Parámetros de temperatura, instrucciones de saludo por canal y asignación de sub-agentes especializados por área de negocio.

---

## 🔗 Enlaces Relacionados
* [[CRM TIBS APP]] — Hub Maestro.
* [[CRM TIBS - Multi-Tenancy, Axios & Interceptores]] — Inyección del esquema tenant en peticiones.
* [[CRM TIBS - Autenticacion, JWT & Protected Routes]] — Seguridad basada en roles.
* [[CRM TIBS - Chat Omnicanal, WebSockets & Agente IA]] — Configuración de bots y sub-agentes.
