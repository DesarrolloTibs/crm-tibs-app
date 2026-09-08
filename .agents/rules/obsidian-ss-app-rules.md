---
description: Reglas para la interacción con el MCP de Obsidian (obsidian-ss-app) y desarrollo en CRM TIBS App
globs: src/**/*
alwaysApply: true
---

# Regla de Integración: Obsidian SS APP como Base de Conocimiento

## 1. Identificación del Servidor MCP
El servidor MCP asignado para el frontend de CRM TIBS es **`obsidian-ss-app`** (puerto `27130`).

## 2. Protocolo de Consulta para Preguntas y Respuestas
Cuando el usuario formule preguntas sobre:
- "¿Cómo funciona el tablero Kanban de Pipeline o Drag & Drop?"
- "¿Cómo se inyecta el esquema del tenant en las peticiones Axios?"
- "¿Cómo está estructurado el ruteo y el guardia ProtectedRoute?"
- "¿Cómo se conecta el chat omnicanal a WebSockets o el bot de IA?"
- "¿Cómo se sincroniza el calendario con Google, Outlook o iCloud?"
- "¿Qué servicios y endpoints existen para soporte, tickets o gastos?"

El agente **DEBE PRIMERO**:
1. Consultar el índice de recuperación `Indices/Guia de Contexto para Agentes de IA (MCP Retrieval).md` o `Indices/MOC - Mapa de Contenidos Frontend.md` usando `vault_read` en `obsidian-ss-app`.
2. Leer la nota técnica específica en `Proyectos/` para obtener el contexto completo antes de formular una respuesta o planificar cambios.

## 3. Invariantes de Código Obligatorias
- **Uso estricto de `axiosInstance`:** Todas las solicitudes REST deben pasar por `axiosInstance` para asegurar la propagación de `Authorization` y `x-tenant-schema`.
- **Protección de Rutas:** Cualquier vista privada debe envolverse en `<ProtectedRoute>` dentro de `App.tsx`.
- **Gestión de Errores 401 y 402:** Respetar la captura unificada en `interceptors.ts` (desconexión en 401 y alertas de cuota en 402).
- **Tiempo Real:** Eventos socket deben vincularse limpiamente en hooks dedicados (e.g. `useConversationsSocket`) limpiando listeners al desmontar el componente.

## 4. Mantenimiento de la Bóveda (Hot Sync)
Cualquier modificación estructural en el código fuente de `src/` (nuevos componentes, vistas, hooks, servicios o cambios en la lógica de negocio) debe replicarse inmediatamente en las notas correspondientes de la bóveda mediante las herramientas MCP de `obsidian-ss-app`.
