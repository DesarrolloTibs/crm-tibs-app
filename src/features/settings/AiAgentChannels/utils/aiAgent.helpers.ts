import type {
  SubAgent,
  AiAgentStats,
  ChannelConfig,
} from '../schemas/aiAgent.schema';

/**
 * Calcula estadísticas consolidadas de salud operativa del Agente IA y Canales
 */
export function calculateAiAgentStats(
  isActive: boolean,
  temperature: number,
  historyLimit: number,
  subAgents: SubAgent[] = [],
  channels: ChannelConfig[] = []
): AiAgentStats {
  const activeSubAgents = subAgents.filter((a) => a.isActive).length;
  const inactiveSubAgents = subAgents.length - activeSubAgents;

  const hasWhatsApp = channels.some((c) => c.channel === 'whatsapp' && c.isActive);
  const hasFacebook = channels.some((c) => c.channel === 'facebook' && c.isActive);
  const hasInstagram = channels.some((c) => c.channel === 'instagram' && c.isActive);

  return {
    isAgentActive: isActive,
    totalSubAgents: subAgents.length,
    activeSubAgents,
    inactiveSubAgents,
    totalChannels: channels.length,
    hasWhatsApp,
    hasFacebook,
    hasInstagram,
    temperature,
    historyLimit,
  };
}

/**
 * Calcula las posiciones automáticas iniciales en el lienzo para el Router y los Sub-Agentes
 */
export function calculateInitialNodePositions(
  subAgents: SubAgent[] = [],
  canvasWidth: number = 840
): Record<string, { x: number; y: number }> {
  if (subAgents.length === 0) {
    return {
      router: { x: Math.max(10, (canvasWidth - 270) / 2), y: 15 },
    };
  }

  const nodeWidth = 270;
  const positions: Record<string, { x: number; y: number }> = {
    router: { x: Math.max(10, (canvasWidth - nodeWidth) / 2), y: 15 },
  };

  const totalAgents = subAgents.length;
  const spacing = Math.min(310, Math.max(285, (canvasWidth - 40) / totalAgents));
  const totalRowWidth = (totalAgents - 1) * spacing + nodeWidth;
  const startX = Math.max(10, (canvasWidth - totalRowWidth) / 2);

  subAgents.forEach((agent, index) => {
    positions[agent.key] = {
      x: startX + index * spacing,
      y: 150,
    };
  });

  return positions;
}

/**
 * Filtra la lista de sub-agentes según búsqueda y estado
 */
export function filterSubAgents(
  subAgents: SubAgent[],
  search: string,
  status: 'all' | 'active' | 'inactive'
): SubAgent[] {
  return subAgents.filter((agent) => {
    const matchesSearch =
      !search ||
      agent.name.toLowerCase().includes(search.toLowerCase()) ||
      agent.key.toLowerCase().includes(search.toLowerCase()) ||
      (agent.description && agent.description.toLowerCase().includes(search.toLowerCase()));

    const matchesStatus =
      status === 'all' ||
      (status === 'active' && agent.isActive) ||
      (status === 'inactive' && !agent.isActive);

    return matchesSearch && matchesStatus;
  });
}
