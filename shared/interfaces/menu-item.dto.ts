export interface CreateMenuItemDto {
  name: string; // max 100 chars
  description: string; // max 500 chars
  price: number; // 0.01-99999.99
  category: string;
}

export interface UpdateMenuItemDto {
  name?: string;
  description?: string;
  price?: number;
  category?: string;
}

export interface UpdateAvailabilityDto {
  isAvailable: boolean;
}

export interface MenuItemDto {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  isAvailable: boolean;
  createdAt: string;
  updatedAt: string;
}
