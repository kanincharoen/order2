import { TableStatus } from '../enums';

export const VALID_TABLE_TRANSITIONS: Record<TableStatus, TableStatus[]> = {
  [TableStatus.AVAILABLE]: [TableStatus.OCCUPIED, TableStatus.RESERVED],
  [TableStatus.RESERVED]: [TableStatus.OCCUPIED, TableStatus.AVAILABLE],
  [TableStatus.OCCUPIED]: [TableStatus.NEEDS_CLEANING],
  [TableStatus.NEEDS_CLEANING]: [TableStatus.AVAILABLE],
};
