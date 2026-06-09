import { TableStatus } from '../enums';

export interface CreateTableDto {
  tableNumber: number; // 1-999
  seatingCapacity: number; // 1-20
}

export interface UpdateTableDto {
  tableNumber?: number; // 1-999
  seatingCapacity?: number; // 1-20
}

export interface UpdateTableStatusDto {
  status: TableStatus;
}

export interface TableDto {
  id: string;
  tableNumber: number;
  seatingCapacity: number;
  status: TableStatus;
  createdAt: string;
  updatedAt: string;
}

export interface TableStatusSummaryDto {
  available: number;
  occupied: number;
  reserved: number;
  needsCleaning: number;
  total: number;
}
