import type {
  TenantConsumptionData,
  ConsumptionBreakdownResponse,
  TenantBillingCycle,
  ChannelConsumption,
  TopUserConsumption,
  TopClientConsumption,
  DailyTimelineConsumption,
  RecentTransaction,
  CourtesyOveragesReportResponse,
  CourtesyOverageTenantReport,
} from '../../../../services/tenantsService';

export type {
  TenantConsumptionData,
  ConsumptionBreakdownResponse,
  TenantBillingCycle,
  ChannelConsumption,
  TopUserConsumption,
  TopClientConsumption,
  DailyTimelineConsumption,
  RecentTransaction,
  CourtesyOveragesReportResponse,
  CourtesyOverageTenantReport,
};

export interface CycleSelectOption {
  value: string;
  label: string;
  cycleId?: number;
  isCustom?: boolean;
  status?: 'active' | 'closed' | 'superseded';
  cycle?: TenantBillingCycle;
}

export type MyCompanySubTabId =
  | 'profile'
  | 'subscription'
  | 'channels'
  | 'consumers'
  | 'history';

export interface NotificationState {
  show: boolean;
  type: 'success' | 'error' | 'warning' | 'confirmation';
  title: string;
  message: string;
  onConfirm?: () => void;
  onCancel?: () => void;
}
