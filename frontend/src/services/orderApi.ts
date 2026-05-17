import apiClient from './apiClient';
import type {
  Order,
  CreateOrderRequest,
  UpdateOrderRequest,
  CalculatePriceRequest,
  PriceCalculationResponse,
} from '@/types/order';
import { OrderStatus } from '@/types/order';

export interface ListOrdersParams {
  keyword?: string;
  status?: OrderStatus;
}

export const orderApi = {
  listOrders: (params?: ListOrdersParams): Promise<Order[]> =>
    apiClient.get<Order[]>('/api/orders', { params }).then((r) => r.data),

  getOrder: (id: string): Promise<Order> =>
    apiClient.get<Order>(`/api/orders/${id}`).then((r) => r.data),

  createOrder: (data: CreateOrderRequest): Promise<Order> =>
    apiClient.post<Order>('/api/orders', data).then((r) => r.data),

  updateOrder: (id: string, data: UpdateOrderRequest): Promise<Order> =>
    apiClient.put<Order>(`/api/orders/${id}`, data).then((r) => r.data),

  deleteOrder: (id: string): Promise<void> =>
    apiClient.delete(`/api/orders/${id}`).then(() => undefined),

  calculatePrice: (data: CalculatePriceRequest): Promise<PriceCalculationResponse> =>
    apiClient
      .post<PriceCalculationResponse>('/api/orders/calculate-price', data)
      .then((r) => r.data),
};
