// Estados en tiempo real del artículo (Requisito F-10 y Sección 15.2.3)
export type ItemStatus = 'AVAILABLE' | 'RESERVED' | 'DELIVERED' | 'INACTIVE';

// Tipo de transacción (Sección 14.3 y 21.4)
export type TransactionType = 'DONATION' | 'SOLIDARITY_SALE';

// Roles del sistema (Requisito F-05 y Sección 13.2.1)
export type UserRole = 'SELLER_DONOR' | 'BUYER';

export interface Role {
  id: number;
  name: UserRole;
}

export interface UserResponseDTO {
  id: number;
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  birthDate: string;
  addresses: string[];
  profileImageUrl?: string;
  roles: Role[];
}

export interface ItemRequestDTO {
  title: string;
  description: string;
  type: TransactionType;
  price: number; // 0 si es DONATION
  shippingCost: number;
  stock: number;
  categoryId: number;
  subcategoryId?: number;
  location: string;
  imageUrls: string[];
}

export interface ItemResponseDTO {
  id: number;
  title: string;
  description: string;
  type: TransactionType;
  price: number;
  shippingCost: number;
  stock: number;
  itemStatus: ItemStatus;
  categoryName: string;
  location: string;
  imageUrls: string[];
  sellerId: number;
  sellerName: string;
}

export interface CartItem {
  id?: number;
  itemId: number;
  title: string;
  quantity: number;
  unitPrice: number;
  shippingCost: number;
  totalPrice: number;
  type: TransactionType;
  imageUrl?: string;
}

export interface Cart {
  id: number;
  customerId: number;
  subtotalItems: number;
  subtotalShipping: number;
  items: CartItem[];
}

export interface AddToCartRequestDTO {
  customerId: number;
  itemId: number;
  quantity: number;
}