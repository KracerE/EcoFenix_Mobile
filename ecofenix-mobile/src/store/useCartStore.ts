import { create } from 'zustand';
import { CartItem, ItemResponseDTO } from '../types/models';

interface CartState {
  items: CartItem[];
  subtotalItems: number;
  subtotalShipping: number;
  addItem: (item: ItemResponseDTO, quantity: number) => void;
  updateQuantity: (itemId: number, delta: number) => void;
  removeItem: (itemId: number) => void;
  clearCart: () => void;
}

const calculateTotals = (items: CartItem[]) => {
  const subtotalItems = items.reduce((sum, item) => sum + item.totalPrice, 0);
  const subtotalShipping = items.reduce(
    (sum, item) => sum + (item.shippingCost ?? 0) * item.quantity,
    0,
  );

  return { subtotalItems, subtotalShipping };
};

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  subtotalItems: 0,
  subtotalShipping: 0,

  addItem: (item, quantity) => {
    if (!Number.isFinite(quantity) || quantity <= 0) {
      throw new Error('Datos inválidos para agregar al carrito');
    }

    if (item.stock < quantity) {
      throw new Error('Stock insuficiente');
    }

    const currentItems = [...get().items];
    const existingIndex = currentItems.findIndex((i) => i.itemId === item.id);
    const unitPrice = item.type === 'DONATION' ? 0 : item.price;
    const nextQuantity = existingIndex >= 0 ? currentItems[existingIndex].quantity + quantity : quantity;

    if (item.stock < nextQuantity) {
      throw new Error('Stock insuficiente');
    }

    if (existingIndex >= 0) {
      currentItems[existingIndex] = {
        ...currentItems[existingIndex],
        quantity: nextQuantity,
        totalPrice: unitPrice * nextQuantity,
        unitPrice,
        shippingCost: item.shippingCost ?? 0,
      };
    } else {
      currentItems.push({
        itemId: item.id,
        title: item.title,
        quantity: nextQuantity,
        unitPrice,
        shippingCost: item.shippingCost ?? 0,
        totalPrice: unitPrice * nextQuantity,
        type: item.type,
        imageUrl: item.imageUrls?.[0],
      });
    }

    const totals = calculateTotals(currentItems);
    set({ items: currentItems, ...totals });
  },

  updateQuantity: (itemId, delta) => {
    const nextQuantity = get().items.map((item) => {
      if (item.itemId !== itemId) return item;

      const updatedQuantity = Math.max(1, item.quantity + delta);
      return {
        ...item,
        quantity: updatedQuantity,
        totalPrice: item.unitPrice * updatedQuantity,
      };
    });

    const totals = calculateTotals(nextQuantity);
    set({ items: nextQuantity, ...totals });
  },

  removeItem: (itemId) => {
    const filtered = get().items.filter((i) => i.itemId !== itemId);
    const totals = calculateTotals(filtered);
    set({ items: filtered, ...totals });
  },

  clearCart: () => set({ items: [], subtotalItems: 0, subtotalShipping: 0 }),
}));