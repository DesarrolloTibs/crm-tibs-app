export interface ProductFile {
  id: string;
  fileName: string;
  filePath: string;
  title: string | null;
  uploadedAt: string;
  productId: string;
}

export interface Product {
  id?: string;
  nombre: string;
  descripcion?: string | null;
  precioBase: number;
  status: boolean;
  imagenPortada?: string | null;
  createdById?: string | null;
  createdBy?: { id: string; username: string } | null;
  files?: ProductFile[];
  createdAt?: string;
}
