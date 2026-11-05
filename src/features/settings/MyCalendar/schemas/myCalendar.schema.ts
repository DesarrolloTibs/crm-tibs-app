import type { CalendarIntegrationStatus } from '@core/services/calendarIntegrationsService';

export type { CalendarIntegrationStatus };

export type CalendarProviderId = 'google' | 'outlook';

export interface CalendarProviderConfig {
  id: CalendarProviderId;
  name: string;
  description: string;
  authType: 'oauth';
  enabled: boolean;
  tagline?: string;
  iconBg: string;
  activeBorderColor: string;
  activeRingColor: string;
  accentColor: string;
}

export interface NotificationState {
  show: boolean;
  type: 'success' | 'error' | 'warning' | 'confirmation';
  title: string;
  message: string;
  onConfirm?: () => void;
  onCancel?: () => void;
}
