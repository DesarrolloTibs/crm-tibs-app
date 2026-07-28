import type { Client } from "./Client";
import type { Company } from "./Company";
import type { Product } from "./Product";
import type { OpportunityCatalogOption } from "./OpportunityCatalog";

export interface Stage {
  id: string;
  strname: string;
  blnstatus: boolean;
  pipeline_id: string;
  display_order: number;
  strcolor: string | null;
  blninitial: boolean;
  intmaxdays?: number | null;
  dtmcreated?: Date;
  dtmlastmodified?: Date;
}

export interface OpportunityProduct {
  id?: string;
  opportunityId?: string;
  productId: string;
  cantidad: number;
  product?: Product;
}

export interface Opportunity  {
  id: string;
  pipeline_id?: string;
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
  linea_negocio_id?: string | null;
  linea_negocio?: OpportunityCatalogOption | null;
  tipo_entrega_id?: string | null;
  tipo_entrega?: OpportunityCatalogOption | null;
  licenciamiento_id?: string | null;
  licenciamiento?: OpportunityCatalogOption | null;
  interactions: any[]; // You might want to create an Interaction model
  reminders: any[]; // You might want to create a Reminder model
  archived?: boolean;
  proposalDocumentPath?: string;
  files?: OpportunityFile[];
  productIds?: string[];
  products?: Product[];
  opportunityProducts?: OpportunityProduct[];
  productItems?: Array<{ productId: string; cantidad: number }>;
  tipoCambio?: number;
  estimated_closure_date?: Date;
  createdAt?: Date;
  stage_entered_at?: Date | string;
  priority?: number;
}

export interface OpportunityFile {
  id: string;
  fileName: string;
  filePath: string;
  title: string | null;
  date: string | null;
  opportunityId: string;
  uploadedAt: string;
}

export const Currency = {
  USD: 'USD',
  MXN: 'MXN',
} as const;
export type CurrencyType = (typeof Currency)[keyof typeof Currency];