import { OrderStatus } from '../enums';

export interface CustomerCreateOrderDto {
  items: CustomerOrderItemDto[];
}

export interface CustomerOrderItemDto {
  menuItemId: string;
  quantity: number; // 1-99
  specialInstructions?: string; // max 200 chars
}

export interface CustomerMenuDto {
  tableNumber: number;
  categories: Record<string, CustomerMenuItemDto[]>;
}

export interface CustomerMenuItemDto {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
}

export interface CustomerOrderDto {
  orderId: string;
  items: CustomerOrderItemSummaryDto[];
  totalPrice: number;
  status: OrderStatus;
  createdAt: string;
}

export interface CustomerOrderItemSummaryDto {
  name: string;
  quantity: number;
  price: number;
}

export interface CustomerOrderStatusDto {
  orderId: string;
  status: OrderStatus;
  createdAt: string;
  totalPrice: number;
}
