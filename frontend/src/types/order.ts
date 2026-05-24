export enum OrderStatus {
  DRAFT = 'DRAFT',
  CONFIRMED = 'CONFIRMED',
  CANCELLED = 'CANCELLED',
}

export interface OrderOption {
  optionId: string;
  optionName: string;
  optionPrice: number;
}

export interface Order {
  id: string;
  orderNo: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string | null;
  vehicleId: string;
  vehicleName: string | null;
  exteriorColor: string;
  interiorColor: string;
  vehicleBasePrice: number;
  optionsTotalPrice: number;
  totalPrice: number;
  expectedDeliveryMonth: string;
  status: OrderStatus;
  sourceType: string | null;
  sourceText: string | null;
  uploadedFileName: string | null;
  aiSummary: string | null;
  deleted: boolean;
  createdAt: string;
  updatedAt: string;
  options: OrderOption[];
}

export interface CreateOrderRequest {
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  vehicleId: string;
  exteriorColor: string;
  interiorColor: string;
  optionIds?: string[];
  expectedDeliveryMonth: string;
  status: OrderStatus;
}

export interface UpdateOrderRequest {
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
  vehicleId?: string;
  exteriorColor?: string;
  interiorColor?: string;
  optionIds?: string[];
  expectedDeliveryMonth?: string;
  status?: OrderStatus;
}

export interface CalculatePriceRequest {
  vehicleId: string;
  optionIds?: string[];
}

export interface PriceCalculationResponse {
  vehicleBasePrice: number;
  optionsTotalPrice: number;
  totalPrice: number;
}
