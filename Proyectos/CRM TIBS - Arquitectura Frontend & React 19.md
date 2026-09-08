---
title: CRM TIBS - Arquitectura Frontend & React 19
tags:
  - "#proyecto"
  - "#arquitectura"
  - "#react19"
  - "#vite7"
  - "#typescript"
  - "#pwa"
date: 2026-09-08
status: produccion
---

# 🏗️ CRM TIBS — Arquitectura Frontend & React 19

Este documento describe la arquitectura modular, el ciclo de vida de empaquetado con **Vite 7**, el uso de **React 19** y los patrones de gestión de estado que estructuran el frontend de **CRM TIBS App**.

---

## 📐 Flujo de Capas y Flujo de Datos

```mermaid
flowchart TD
    subgraph CapaPresentacion ["🎨 Capa de Presentación (UI)"]
        Pages["📄 Páginas de Ruta (`src/pages/`)"]
        Components["🧩 Componentes de Dominio (`src/components/`)"]
        Shared["🛠️ Sistema Compartido (`src/components/shared/`)"]
    end

    subgraph CapaEstado ["🧠 Capa de Estado & Hooks"]
        Hooks["🎣 Custom Hooks (`src/hooks/`)"]
        Store["📦 Config Store (`src/store/useConfigStore.ts`)"]
        AuthHook["🔐 Auth Hook (`src/hooks/useAuth.ts`)"]
    end

    subgraph CapaTransporte ["🌐 Capa de Transporte & Red"]
        Services["📡 Servicios HTTP (`src/services/`)"]
        Axios["⚙️ Axios Instance + Interceptors (`src/core/axios/`)"]
        Sockets["⚡ Socket.IO Client (`/conversations`)"]
    end

    subgraph Backend ["🏢 Backend NestJS (Puerto 3091)"]
        API["REST Endpoints (`/api/*`)"]
        WSGateway["WebSocket Gateway (`/socket.io`)"]
    end

    Pages --> Components
    Components --> Shared
    Pages --> Hooks
    Components --> Hooks

    Hooks --> Store
    Hooks --> AuthHook
    Hooks --> Services
    Hooks --> Sockets

    Services --> Axios
    Axios --> API
    Sockets --> WSGateway

    classDef ui fill:#1e40af,stroke:#60a5fa,color:#fff;
    classDef state fill:#0f766e,stroke:#2dd4bf,color:#fff;
    classDef net fill:#3730a3,stroke:#818cf8,color:#fff;
    classDef bnd fill:#334155,stroke:#94a3b8,color:#fff;

    class Pages,Components,Shared ui;
    class Hooks,Store,AuthHook state;
    class Services,Axios,Sockets net;
    class API,WSGateway bnd;
```

---

## 🧩 1. Organización Modular por Capas

La aplicación está diseñada bajo el principio de separación de responsabilidades:

1. **`src/pages/` (Vistas de Ruta):**
   * Actúan como orquestadores de alto nivel.
   * Conectan la URL con los hooks de dominio y renderizan el diseño estructural provisto por [`Layout.tsx`](file:///c:/Users/sopor/Proyectos/CRM/crm-tibs-app/src/components/Layout/Layout.tsx).
2. **`src/components/` (Componentes de Dominio):**
   * Agrupados por contexto (`Activity`, `Company`, `Client`, `Dashboard`, `Expense`, `Helpdesk`, `Pipeline`, `Product`, `Settings`, `User`, `WebChat`).
   * No realizan peticiones `axios` directamente; delegan los eventos hacia props o consumen hooks.
3. **`src/components/shared/` (Sistema de Diseño Reusable):**
   * Primitivas agnósticas al negocio: botones, inputs, tablas con paginador, diálogos modales, stepper de etapas y zona de carga `Dropzone`.
4. **`src/hooks/` (Lógica de Negocio y Reactividad):**
   * Encapsulan estados locales, efectos, suscripciones WebSocket, temporizadores y llamadas a servicios.
   * Previenen cierres obsoletos (*stale closures*) en llamadas asíncronas mediante el uso intensivo de `useRef` (e.g. en [`useConversationsSocket.ts`](file:///c:/Users/sopor/Proyectos/CRM/crm-tibs-app/src/hooks/useConversationsSocket.ts)).
5. **`src/services/` (Clientes de Red Tipados):**
   * Colección de 23 módulos de funciones asíncronas que consumen `axiosInstance` y devuelven modelos TypeScript limpios.
6. **`src/store/` (Almacén de Configuración Global):**
   * [`useConfigStore.ts`](file:///c:/Users/sopor/Proyectos/CRM/crm-tibs-app/src/store/useConfigStore.ts) implementa un patrón **Observable / Pub-Sub** liviano para almacenar el tenant activo seleccionado por el usuario y la lista de inquilinos accesibles.

---

## ⚡ 2. Características de React 19 y Empaquetado con Vite 7

### Adopción de React 19:
* **Mejoras en el motor de renderizado:** React 19 (`19.1.1`) optimiza el reconciliador de árbol virtual eliminando costos de re-renderizado innecesarios en listas largas de oportunidades y tablas de tickets.
* **Transiciones y renderizado concurrente:** Permite mantener responsiva la interfaz mientras se realizan cálculos complejos de filtros o agrupaciones de fechas en [`useDashboard.ts`](file:///c:/Users/sopor/Proyectos/CRM/crm-tibs-app/src/hooks/useDashboard.ts).

### Configuración de Vite 7 (`vite.config.ts`):
* **Hot Module Replacement:** Tiempos de recarga en caliente inferiores a 50ms durante desarrollo.
* **Proxy Transparente:** Redirección de `/api`, `/socket.io` y `/uploads` al backend para evitar problemas de CORS en local.
* **Soporte PWA Integral (`vite-plugin-pwa`):**
  * `registerType: 'autoUpdate'`: Actualización automática del service worker ante despliegues de nuevas versiones.
  * Manifiesto PWA completo con iconos `180x180`, `192x192` y `512x512`.
  * Caché de Workbox con límite de tamaño de hasta 5 MB (`maximumFileSizeToCacheInBytes: 5 * 1024 * 1024`).

---

## 🔄 3. Patrón de Gestión de Estado y Eventos

En lugar de requerir librerías pesadas como Redux, CRM TIBS utiliza una estrategia equilibrada de 3 niveles:

```mermaid
sequenceDiagram
    participant Navbar as Navbar / TenantSelector
    participant ConfigStore as configStore (Pub/Sub)
    participant Axios as Interceptor Axios
    participant Hook as usePipeline / useActivities
    participant Backend as Backend NestJS

    Navbar->>ConfigStore: setSelectedTenant({ schema_name: 'acme_corp' })
    ConfigStore-->>Axios: getSelectedTenant() -> 'acme_corp'
    ConfigStore-->>Hook: Notifica a suscriptores reactivos
    Hook->>Axios: getOpportunities()
    Axios->>Backend: GET /api/opportunities [x-tenant-schema: acme_corp]
    Backend-->>Axios: 200 OK (Datos del esquema acme_corp)
    Axios-->>Hook: Actualiza estado local de oportunidades
```

1. **Estado de Sesión:** `localStorage` para tokens JWT decodificados al vuelo mediante [`useAuth.ts`](file:///c:/Users/sopor/Proyectos/CRM/crm-tibs-app/src/hooks/useAuth.ts).
2. **Estado de Tenant Activo:** `configStore` con persistencia en `localStorage.getItem('selected_tenant')`.
3. **Eventos Desacoplados:** `window.dispatchEvent(new CustomEvent('settingsTabChanged'))` para comunicación entre componentes hermanos en la pantalla de configuración sin prop-drilling.

---

## 🔗 Enlaces Relacionados
* [[CRM TIBS APP]] — Hub Maestro.
* [[CRM TIBS - Multi-Tenancy, Axios & Interceptores]] — Capa HTTP y propagación del esquema.
* [[CRM TIBS - Autenticacion, JWT & Protected Routes]] — Seguridad y guardias de navegación.
* [[Catalogo de Componentes y Vistas]] — Inventario de componentes y páginas.
