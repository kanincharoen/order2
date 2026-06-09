import { OrderStatus } from '../enums';

export interface ModificationPermissions {
  addItems: boolean;
  removeItems: boolean;
  changeQuantity: boolean;
  changeMenuItem: boolean;
  editInstructions: boolean;
}

const NO_MODIFICATIONS: ModificationPermissions = {
  addItems: false,
  removeItems: false,
  changeQuantity: false,
  changeMenuItem: false,
  editInstructions: false,
};

export const ORDER_MODIFICATION_RULES: Record<OrderStatus, ModificationPermissions> = {
  [OrderStatus.PENDING]: {
    addItems: true,
    removeItems: true,
    changeQuantity: true,
    changeMenuItem: true,
    editInstructions: true,
  },
  [OrderStatus.IN_PROGRESS]: {
    addItems: true,
    removeItems: false,
    changeQuantity: false,
    changeMenuItem: false,
    editInstructions: true,
  },
  [OrderStatus.READY]: { ...NO_MODIFICATIONS },
  [OrderStatus.SERVED]: { ...NO_MODIFICATIONS },
  [OrderStatus.COMPLETED]: { ...NO_MODIFICATIONS },
  [OrderStatus.CANCELLED]: { ...NO_MODIFICATIONS },
};
