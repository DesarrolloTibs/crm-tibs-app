export interface Opportunity {
  id: string;
  nombre_proyecto: string;
  cliente_id: string;
  cliente: any; // You might want to create a Client model as well
  empresa: string;
  ejecutivo_id: string;
  etapa: OpportunityStageType;
  monto_licenciamiento: number;
  monto_servicios: number;
  monto_total: number;
  moneda: CurrencyType;
  linea_negocio: BusinessLineType;
  tipo_entrega: DeliveryTypeType;
  licenciamiento?: LicensingType;
  interactions: any[]; // You might want to create an Interaction model
  proposalDocumentPath?: string;
  reminders: any[]; // You might want to create a Reminder model
}

export const OpportunityStage = {
  NUEVO: 'Nuevo',
  DESCUBRIMIENTO: 'Descubrimiento',
  ESTIMACION: 'Estimación',
  PROPUESTA: 'Propuesta',
  NEGOCIACION: 'Negociación',
  GANADA: 'Ganada',
  PERDIDA: 'Perdida',
  CANCELADA: 'Cancelada',
} as const;
export type OpportunityStageType = (typeof OpportunityStage)[keyof typeof OpportunityStage];

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
} as const;
export type LicensingType = (typeof Licensing)[keyof typeof Licensing];