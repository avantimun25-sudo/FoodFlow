import { createContext, useContext, useState, useEffect, ReactNode } from "react";

export interface CartItem {
  menuItemId: number;
  name: string;
  price: number;
  quantity: number;
  imageUrl?: string | null;
}

interface CartContextType {
  items: CartItem[];
  restaurantId: number | null;
  restaurantName: string | null;
  addItem: (item: Omit<CartItem, 'quantity'>, rId: number, rName: string) => void;
  removeItem: (menuItemId: number) => void;
  updateQuantity: (menuItemId: number, quantity: number) => void;
  clearCart: () => void;
  totalItems: number;
  subtotal: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [restaurantId, setRestaurantId] = useState<number | null>(null);
  const [restaurantName, setRestaurantName] = useState<string | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem("delivery_cart");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setItems(parsed.items || []);
        setRestaurantId(parsed.restaurantId || null);
        setRestaurantName(parsed.restaurantName || null);
      } catch (e) {
        console.error("Failed to parse cart", e);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("delivery_cart", JSON.stringify({ items, restaurantId, restaurantName }));
  }, [items, restaurantId, restaurantName]);

  const addItem = (item: Omit<CartItem, 'quantity'>, rId: number, rName: string) => {
    if (restaurantId !== null && restaurantId !== rId) {
      if (!window.confirm(`Your cart contains items from ${restaurantName}. Clear cart to add items from ${rName}?`)) {
        return;
      }
      setItems([{ ...item, quantity: 1 }]);
      setRestaurantId(rId);
      setRestaurantName(rName);
      return;
    }

    if (restaurantId === null) {
      setRestaurantId(rId);
      setRestaurantName(rName);
    }

    setItems(prev => {
      const existing = prev.find(i => i.menuItemId === item.menuItemId);
      if (existing) {
        return prev.map(i => i.menuItemId === item.menuItemId ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { ...item, quantity: 1 }];
    });
  };

  const removeItem = (menuItemId: number) => {
    setItems(prev => {
      const filtered = prev.filter(i => i.menuItemId !== menuItemId);
      if (filtered.length === 0) {
        setRestaurantId(null);
        setRestaurantName(null);
      }
      return filtered;
    });
  };

  const updateQuantity = (menuItemId: number, quantity: number) => {
    if (quantity <= 0) {
      removeItem(menuItemId);
      return;
    }
    setItems(prev => prev.map(i => i.menuItemId === menuItemId ? { ...i, quantity } : i));
  };

  const clearCart = () => {
    setItems([]);
    setRestaurantId(null);
    setRestaurantName(null);
  };

  const totalItems = items.reduce((acc, item) => acc + item.quantity, 0);
  const subtotal = items.reduce((acc, item) => acc + (item.price * item.quantity), 0);

  return (
    <CartContext.Provider value={{
      items, restaurantId, restaurantName, addItem, removeItem, updateQuantity, clearCart, totalItems, subtotal
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
