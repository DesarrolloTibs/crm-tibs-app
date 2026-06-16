import type { Client } from "./Client";
import type { Company } from "./Company";

export interface Stage {
  id: string;
  strname: string;
  blnstatus: boolean;
  pipeline_id: string;
  display_order: number;
  strcolor: string | null;
  blninitial: boolean;
  dtmcreated?: Date;
  dtmlastmodified?: Date;
}

export interface Opportunity  {
  id: string;
  nombre_proyecto: string;
  description?: string;
  cliente_id?: string | null;
  cliente?: Client | null;
  empresa?: string | null;
  companyId?: string | null;
  company?: Company | null;
  contacts?: Client[];
  contactIds?: string[];
  ejecutivo_id: string;
  ejecutivo: any; 
  stage_id: string;
  stage?: Stage;
  monto_licenciamiento: number;
  monto_servicios: number;
  monto_total: number;
  moneda: CurrencyType;
  linea_negocio: BusinessLineType;
  tipo_entrega: DeliveryTypeType;
  licenciamiento?: LicensingType;
  interactions: any[]; // You might want to create an Interaction model
  reminders: any[]; // You might want to create a Reminder model
  archived?: boolean;
  proposalDocumentPath?: string;
  tipoCambio?: number;
  estimated_closure_date?: Date;
  createdAt?: Date;
}

export const Currency = {
  USD: 'USD',
  MXN: 'MXN',
} as const;
export type CurrencyType = (typeof Currency)[keyof typeof Currency];

export const BusinessLine = {
  DATOS: 'Datos',
  DESARROLLO: 'Desarrollo',
  RH: 'RH',
} as const;
export type BusinessLineType = (typeof BusinessLine)[keyof typeof BusinessLine];

export const DeliveryType = {
  PROYECTO: 'Proyecto',
  LICENCIA: 'Licencia',
  ASIGNACION: 'Asignacion',
  BOLSA_DE_HORAS: 'Bolsa de Horas',
} as const;
export type DeliveryTypeType = (typeof DeliveryType)[keyof typeof DeliveryType];

export const Licensing = {
  MICROSOFT: 'Microsoft',
  IBM: 'IBM',
  QLIK: 'Qlik',
  ALTERYX: 'Alteryx',
  KNIME: 'KNIME',
  NO_APLICA: 'No Aplica',
} as const;
export type LicensingType = (typeof Licensing)[keyof typeof Licensing];