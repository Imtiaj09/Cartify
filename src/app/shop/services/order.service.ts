import { Injectable } from '@angular/core';
import { CartItem, CartService } from '../../shared/services/cart.service';

export interface Order {
  id: string;
  userId: string;
  date: string;
  items: CartItem[];
  shippingDetails: any;
  paymentMethod: string;
  subtotal: number;
  shippingFee: number;
  total: number;
  status: string;
}

@Injectable({
  providedIn: 'root'
})
export class OrderService {
  private readonly storageKey = 'cartify_orders';

  constructor(private readonly cartService: CartService) {}

  placeOrder(orderData: Omit<Order, 'id' | 'date' | 'status'>): Order {
    const newOrder: Order = {
      ...orderData,
      id: 'ORD-' + Math.random().toString(36).substr(2, 9).toUpperCase(),
      date: new Date().toISOString(),
      status: 'Processing'
    };

    const allOrders = this.getAllOrders();
    allOrders.push(newOrder);
    localStorage.setItem(this.storageKey, JSON.stringify(allOrders));
    this.cartService.clearCart();
    return newOrder;
  }

  getUserOrders(userId: string): Order[] {
    const allOrders = this.getAllOrders();
    return allOrders.filter(order => order.userId === userId);
  }

  private getAllOrders(): Order[] {
    const savedOrders = localStorage.getItem(this.storageKey);
    if (savedOrders) {
      try {
        const parsedOrders = JSON.parse(savedOrders) as Order[];
        if (Array.isArray(parsedOrders)) {
          return parsedOrders;
        }
      } catch {
        return [];
      }
    }
    return [];
  }
}
