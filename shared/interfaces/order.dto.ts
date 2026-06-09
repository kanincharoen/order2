import { OrderStatus, OrderSource } from '../enums';

export interface CreateOrderDto {
  tableId: string;
  items: CreateOrderItemDto[];
}

export interface CreateOrderItemDto {
  menuItemId: string;
  quantity: number; // 1-99
  specialInstructions?: string; // max 200 chars
}

export interface UpdateOrderItemDto {
  menuItemId?: string;
  quantity?: number; // 1-99
  specialInstructions?: string; // max 200 chars
}

export interface UpdateOrderStatusDto {
  status: OrderStatus;
  cancellationReason?: string; // required if status is Cancelled, 1-200 chars
}

export interface OrderHistoryQueryDto {
  tableNumber?: number;
  startDate?: string; // ISO date
  endDate?: string; // ISO date
  page?: number; // default 1
  limit?: number; // default 50
}

export interface OrderItemDto {
  id: string;
  menuItemId: string;
  menuItemName: string;
  quantity: number;
  specialInstructions: string | null;
  unitPrice: number;
  createdAt: string;
}

export interface OrderStatusHistoryDto {
  id: string;
  fromStatus: OrderStatus;
  toStatus: OrderStatus;
  changedAt: string;
}

export interface OrderDto {
  id: string;
  tableId: string;
  tableNumber: number;
  status: OrderStatus;
  totalPrice: number;
  cancellationReason: string | null;
  orderSource: OrderSource;
  items: OrderItemDto[];
  itemCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface OrderDetailDto extends OrderDto {
  statusHistory: OrderStatusHistoryDto[];
}
