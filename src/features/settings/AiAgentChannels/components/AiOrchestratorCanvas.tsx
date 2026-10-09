import React, { useRef, useState, useEffect } from 'react';
import {
  Brain,
  Sliders,
  Plus,
  Maximize2,
  Minimize2,
  CheckCircle,
  Trash2,
} from 'lucide-react';
import type { SubAgent } from '../schemas/aiAgent.schema';
import { calculateInitialNodePositions } from '../utils/aiAgent.helpers';

interface AiOrchestratorCanvasProps {
  subAgents: SubAgent[];
  onOpenCreateSubAgent: () => void;
  onOpenEditSubAgent: (agent: SubAgent) => void;
  onDeleteSubAgent: (id: string) => void;
  onToggleSubAgentStatus: (agent: SubAgent) => void;
  onOpenRouterModal: () => void;
}

export const AiOrchestratorCanvas: React.FC<AiOrchestratorCanvasProps> = ({
  subAgents,
  onOpenCreateSubAgent,
  onOpenEditSubAgent,
  onDeleteSubAgent,
  onToggleSubAgentStatus,
  onOpenRouterModal,
}) => {
  const [nodePositions, setNodePositions] = useState<Record<string, { x: number; y: number }>>({});
  const [draggingNode, setDraggingNode] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  // Pan, Zoom y Maximize states
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [isMaximized, setIsMaximized] = useState(false);

  const canvasRef = useRef<HTMLDivElement>(null);

  // Recalcular posiciones iniciales armónicas cuando cambia la lista o el modo pantalla completa
  useEffect(() => {
    setPanOffset({ x: 0, y: 0 });
    const canvasWidth = canvasRef.current ? canvasRef.current.clientWidth : 840;
    setNodePositions(calculateInitialNodePositions(subAgents, canvasWidth));
  }, [subAgents, isMaximized]);

  const handleNodeMouseDown = (e: React.MouseEvent, nodeKey: string) => {
    e.preventDefault();
    e.stopPropagation();
    setDraggingNode(nodeKey);
    if (!canvasRef.current) return;

    const canvasRect = canvasRef.current.getBoundingClientRect();
    const pos = nodePositions[nodeKey] || { x: 0, y: 0 };

    setDragOffset({
      x: e.clientX - canvasRect.left - pos.x,
      y: e.clientY - canvasRect.top - pos.y,
    });
  };

  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    const isCanvasBackground =
      target === canvasRef.current || target.tagName === 'svg' || target.tagName === 'path';
    if (isCanvasBackground) {
      setIsPanning(true);
      setPanStart({
        x: e.clientX - panOffset.x,
        y: e.clientY - panOffset.y,
      });
    }
  };

  const handleCanvasMouseMove = (e: React.MouseEvent) => {
    if (isPanning) {
      const newX = e.clientX - panStart.x;
      const newY = e.clientY - panStart.y;
      setPanOffset({ x: newX, y: newY });
      return;
    }

    if (!draggingNode || !canvasRef.current) return;

    const canvasRect = canvasRef.current.getBoundingClientRect();
    let newX = e.clientX - canvasRect.left - dragOffset.x;
    let newY = e.clientY - canvasRect.top - dragOffset.y;

    newX = Math.max(-1000, Math.min(3000, newX));
    newY = Math.max(-500, Math.min(1500, newY));

    setNodePositions((prev) => ({
      ...prev,
      [draggingNode]: { x: newX, y: newY },
    }));
  };

  const handleCanvasMouseUp = () => {
    setDraggingNode(null);
    setIsPanning(false);
  };

  return (
    <div
      className={
        isMaximized
          ? 'fixed inset-0 bg-white z-[60] flex flex-col overflow-hidden select-none animate-fade-in'
          : 'bg-white rounded-2xl border border-slate-200 shadow-xs relative overflow-hidden select-none'
      }
      style={isMaximized ? { margin: 0, padding: 0, width: '100vw', height: '100vh', zIndex: 60 } : {}}
      onMouseMove={handleCanvasMouseMove}
      onMouseUp={handleCanvasMouseUp}
      onMouseLeave={handleCanvasMouseUp}
      onMouseDown={handleCanvasMouseDown}
    >
      {/* Header del Orquestador */}
      <div className="relative flex flex-col sm:flex-row sm:items-center justify-between px-6 pt-5 pb-4 border-b border-slate-100 bg-white shrink-0 gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600">
            <Brain size={19} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-extrabold text-slate-800 text-sm tracking-tight">
                Orquestador Visual Multi-Agente
              </h4>
              {isMaximized && (
                <span className="bg-indigo-100 text-indigo-800 text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                  Pantalla Completa
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Arrastra para mover • Doble clic para editar prompt y herramientas • Arrastra el fondo para desplazar vista
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setIsMaximized(!isMaximized)}
            onMouseDown={(e) => e.stopPropagation()}
            title={isMaximized ? 'Cerrar pantalla completa' : 'Maximizar orquestador'}
            className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 text-[11px] font-bold rounded-lg border border-slate-200 transition-all cursor-pointer shadow-2xs"
          >
            {isMaximized ? (
              <>
                <Minimize2 size={12} className="text-slate-500" />
                <span>Minimizar</span>
              </>
            ) : (
              <>
                <Maximize2 size={12} className="text-slate-500" />
                <span>Maximizar</span>
              </>
            )}
          </button>
          <button
            type="button"
            onClick={onOpenCreateSubAgent}
            onMouseDown={(e) => e.stopPropagation()}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-[11px] font-bold rounded-lg shadow-xs transition-all cursor-pointer border-none"
          >
            <Plus size={13} />
            <span>Nuevo Sub-Agente</span>
          </button>
        </div>
      </div>

      {/* Canvas Interactivo */}
      <div
        ref={canvasRef}
        className="relative w-full overflow-hidden bg-slate-50/50"
        style={{
          height: isMaximized ? 'calc(100vh - 120px)' : '340px',
          backgroundImage: 'radial-gradient(circle, #cbd5e1 1.2px, transparent 1.2px)',
          backgroundSize: '24px 24px',
          backgroundPosition: `${panOffset.x}px ${panOffset.y}px`,
          cursor: isPanning ? 'grabbing' : 'default',
        }}
      >
        {/* SVG Connections */}
        <svg className="absolute inset-0 pointer-events-none w-full h-full" style={{ overflow: 'visible' }}>
          <defs>
            <filter id="glow-indigo" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="2.5" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          {subAgents.map((agent) => {
            const routerPos = nodePositions.router;
            const subPos = nodePositions[agent.key];
            if (!routerPos || !subPos) return null;

            const fromX = routerPos.x + 135 + panOffset.x;
            const fromY = routerPos.y + 54 + panOffset.y;
            const toX = subPos.x + 135 + panOffset.x;
            const toY = subPos.y + panOffset.y;

            const midY = (fromY + toY) / 2;
            const path = `M ${fromX} ${fromY} C ${fromX} ${midY}, ${toX} ${midY}, ${toX} ${toY}`;

            return (
              <g key={`conn-${agent.key}`}>
                {agent.isActive && (
                  <path
                    d={path}
                    fill="none"
                    stroke="rgba(79, 70, 229, 0.18)"
                    strokeWidth="5"
                  />
                )}
                <path
                  d={path}
                  fill="none"
                  stroke={agent.isActive ? '#4f46e5' : '#94a3b8'}
                  strokeWidth={agent.isActive ? '2' : '1.2'}
                  strokeDasharray={agent.isActive ? '6 3' : '4 4'}
                  opacity={agent.isActive ? '1' : '0.5'}
                  filter={agent.isActive ? 'url(#glow-indigo)' : undefined}
                />
                <circle
                  cx={toX}
                  cy={toY}
                  r="4"
                  fill={agent.isActive ? '#4f46e5' : '#94a3b8'}
                  opacity={agent.isActive ? '1' : '0.6'}
                />
                <circle
                  cx={fromX}
                  cy={fromY}
                  r="3.5"
                  fill={agent.isActive ? '#4f46e5' : '#94a3b8'}
                  opacity={agent.isActive ? '1' : '0.6'}
                />
              </g>
            );
          })}
        </svg>

        {/* Empty State */}
        {subAgents.length === 0 && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 pointer-events-none">
            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs backdrop-blur-sm">
              <Sliders size={28} className="text-slate-400" />
            </div>
            <div className="text-center">
              <p className="text-slate-700 text-xs font-bold">No hay sub-agentes configurados</p>
              <p className="text-slate-400 text-[11px] mt-0.5">Haz clic en "Nuevo Sub-Agente" para comenzar</p>
            </div>
          </div>
        )}

        {/* NODO ROUTER */}
        {nodePositions.router && (
          <div
            style={{
              position: 'absolute',
              left: `${nodePositions.router.x + panOffset.x}px`,
              top: `${nodePositions.router.y + panOffset.y}px`,
              cursor: draggingNode === 'router' ? 'grabbing' : 'grab',
              zIndex: draggingNode === 'router' ? 30 : 10,
              width: '270px',
              background: '#ffffff',
              transition: draggingNode === 'router' ? 'none' : 'box-shadow 150ms',
            }}
            onMouseDown={(e) => handleNodeMouseDown(e, 'router')}
            onDoubleClick={onOpenRouterModal}
            className={`rounded-2xl p-3.5 flex items-center gap-3.5 text-left select-none transition-transform duration-150 border ${
              draggingNode === 'router'
                ? 'scale-105 border-indigo-500 shadow-[0_8px_30px_rgba(79,70,229,0.22),0_4px_12px_rgba(0,0,0,0.06)]'
                : 'border-indigo-600/70 shadow-[0_4px_12px_rgba(79,70,229,0.08)] hover:border-indigo-600 hover:shadow-[0_6px_16px_rgba(79,70,229,0.15)]'
            }`}
          >
            <div className="relative shrink-0">
              <div className="p-2.5 rounded-xl bg-indigo-50 border border-indigo-100">
                <Brain size={22} className="text-indigo-600" />
              </div>
              <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-indigo-600 rounded-full border-2 border-white shadow-[0_0_4px_rgba(79,70,229,0.6)] animate-pulse" />
            </div>
            <div className="min-w-0">
              <h5 className="font-extrabold text-[12px] text-slate-800 uppercase tracking-wider leading-none truncate">
                Agente Principal
              </h5>
              <span className="text-[10px] text-indigo-600 font-mono block mt-1 truncate">
                Router (Enrutador)
              </span>
            </div>
          </div>
        )}

        {/* NODOS DE SUB-AGENTES */}
        {subAgents.map((agent) => {
          const pos = nodePositions[agent.key];
          if (!pos) return null;

          const isDragging = draggingNode === agent.key;

          return (
            <div
              key={agent.id || agent.key}
              onMouseDown={(e) => handleNodeMouseDown(e, agent.key)}
              onDoubleClick={() => onOpenEditSubAgent(agent)}
              style={{
                position: 'absolute',
                left: `${pos.x + panOffset.x}px`,
                top: `${pos.y + panOffset.y}px`,
                cursor: isDragging ? 'grabbing' : 'grab',
                zIndex: isDragging ? 20 : 5,
                width: '270px',
                background: '#ffffff',
                transition: isDragging ? 'none' : 'box-shadow 150ms, opacity 200ms',
              }}
              className={`rounded-2xl p-4 flex flex-col gap-2.5 text-left select-none border transition-transform duration-150 ${
                isDragging
                  ? 'scale-105 border-indigo-500 shadow-[0_8px_30px_rgba(99,102,241,0.22),0_4px_12px_rgba(0,0,0,0.06)]'
                  : agent.isActive
                  ? 'border-indigo-500/70 shadow-[0_4px_12px_rgba(99,102,241,0.08)] hover:border-indigo-500 hover:shadow-[0_6px_16px_rgba(99,102,241,0.15)]'
                  : 'border-slate-200 shadow-2xs opacity-60 hover:opacity-85'
              }`}
            >
              {/* Header de la tarjeta */}
              <div className="flex items-start justify-between gap-1.5">
                <div className="flex items-center gap-2 min-w-0">
                  <div
                    className={`p-2 rounded-lg border shrink-0 ${
                      agent.isActive
                        ? 'bg-indigo-50 border-indigo-100 text-indigo-600'
                        : 'bg-slate-50 border-slate-200 text-slate-400'
                    }`}
                  >
                    <Sliders size={16} />
                  </div>
                  <div className="min-w-0">
                    <h5 className="font-extrabold text-xs text-slate-800 truncate leading-none">
                      {agent.name}
                    </h5>
                    <span className="text-[9px] font-mono text-slate-400 block truncate mt-0.5">
                      {agent.key}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onMouseDown={(e) => e.stopPropagation()}
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleSubAgentStatus(agent);
                    }}
                    title={agent.isActive ? 'Desactivar sub-agente' : 'Activar sub-agente'}
                    className={`w-7 h-7 flex items-center justify-center rounded-md transition-all cursor-pointer ${
                      agent.isActive
                        ? 'text-emerald-600 hover:bg-emerald-50'
                        : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <CheckCircle size={15} />
                  </button>
                  {agent.id && (
                    <button
                      type="button"
                      onMouseDown={(e) => e.stopPropagation()}
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteSubAgent(agent.id!);
                      }}
                      title="Eliminar agente"
                      className="w-7 h-7 flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-all cursor-pointer"
                    >
                      <Trash2 size={15} />
                    </button>
                  )}
                </div>
              </div>

              {/* Temperatura & Estado */}
              <div className="flex items-center justify-between gap-1 border-t border-slate-100 pt-2">
                <span
                  className={`inline-flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-full border ${
                    agent.isActive
                      ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
                      : 'text-slate-500 bg-slate-50 border-slate-200'
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      agent.isActive ? 'bg-emerald-500' : 'bg-slate-400'
                    }`}
                  />
                  {agent.isActive ? 'Activo' : 'Inactivo'}
                </span>
                <span
                  className="text-[9px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded-full"
                  title="Temperatura del sub-agente"
                >
                  🌡 {agent.temperature ?? 0.7}
                </span>
              </div>

              {/* Chips de Herramientas */}
              <div className="flex items-center justify-end gap-1">
                {agent.tools && agent.tools.length > 0 ? (
                  <>
                    {agent.tools.slice(0, 2).map((t: string) => (
                      <span
                        key={t}
                        className="text-[8px] font-bold bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded border border-blue-100 truncate max-w-[65px]"
                      >
                        {t
                          .replace('createOpportunity', 'Opp')
                          .replace('modifyOpportunity', 'Mod')
                          .replace('registerContact', 'Ctc')
                          .replace('updateContact', 'Act')
                          .replace('checkAvailability', 'Disp')
                          .replace('createActivity', 'Act')
                          .replace('createTicket', 'Tick')
                          .replace('consult_product_catalog', 'Cat')}
                      </span>
                    ))}
                    {agent.tools.length > 2 && (
                      <span className="text-[8px] text-slate-500 font-bold bg-slate-50 px-1.5 py-0.5 rounded border border-slate-200">
                        +{agent.tools.length - 2}
                      </span>
                    )}
                  </>
                ) : (
                  <span className="text-[8px] text-slate-400 italic">conversacional</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer del Lienzo */}
      <div className="relative flex items-center justify-between px-6 py-2.5 border-t border-slate-200 bg-slate-50/70 shrink-0">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <svg width="22" height="8">
              <line x1="0" y1="4" x2="22" y2="4" stroke="#4f46e5" strokeWidth="2" strokeDasharray="4 2" />
            </svg>
            <span className="text-[10px] text-slate-600 font-medium">Flujo activo</span>
          </div>
          <div className="flex items-center gap-1.5">
            <svg width="22" height="8">
              <line x1="0" y1="4" x2="22" y2="4" stroke="#94a3b8" strokeWidth="1.2" strokeDasharray="2 3" />
            </svg>
            <span className="text-[10px] text-slate-400 font-medium">Inactivo</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Brain size={11} className="text-indigo-600" />
            <span className="text-[10px] text-slate-600 font-medium">Enrutador</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Sliders size={11} className="text-indigo-600" />
            <span className="text-[10px] text-slate-600 font-medium">Sub-agente</span>
          </div>
        </div>
        <span className="text-[10px] font-bold text-slate-500">
          {subAgents.filter((a) => a.isActive).length} / {subAgents.length} activos
        </span>
      </div>
    </div>
  );
};
