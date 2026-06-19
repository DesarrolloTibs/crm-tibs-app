export interface OpportunityCatalogOption {
  id: string;
  strname: string;
  blnstatus: boolean;
  isUsed?: boolean;
  opportunities?: { id: string; nombre_proyecto: string }[];
}
