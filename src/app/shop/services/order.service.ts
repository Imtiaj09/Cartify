import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { CartItem, CartService } from '../../shared/services/cart.service';

export type OrderStatus = 'Pending' | 'Processing' | 'Shipped' | 'Delivered' | 'Cancelled';

export interface OrderCustomerDetails {
  name: string;
  email: string;
  address: string;
}

export interface ShippingDetails {
  firstName?: string;
  lastName?: string;
  address?: string;
  city?: string;
  postalCode?: string;
  phone?: string;
  [key: string]: unknown;
}

export interface Order {
  id: string;
  userId: string;
  date: string;
  items: CartItem[];
  shippingDetails: ShippingDetails;
  customerDetails: OrderCustomerDetails;
  paymentMethod: string;
  subtotal: number;
  shippingFee: number;
  total: number;
  status: OrderStatus;
}

type PlaceOrderInput = Omit<Order, 'id' | 'date' | 'status' | 'customerDetails'> &
  Partial<Pick<Order, 'customerDetails'>>;

@Injectable({
  providedIn: 'root'
})
export class OrderService {
  private readonly storageKey = 'cartify_orders';
  public readonly allOrders$ = new BehaviorSubject<Order[]>([]);

  constructor(private readonly cartService: CartService) {
    this.allOrders$.next(this.readOrdersFromStorage());
  }

  placeOrder(orderData: PlaceOrderInput): Order {
    const shipping = orderData.shippingDetails || {};
    const firstName = typeof shipping.firstName === 'string' ? shipping.firstName.trim() : '';
    const lastName = typeof shipping.lastName === 'string' ? shipping.lastName.trim() : '';
    const city = typeof shipping.city === 'string' ? shipping.city.trim() : '';
    const postalCode = typeof shipping.postalCode === 'string' ? shipping.postalCode.trim() : '';
    const shippingAddress = typeof shipping.address === 'string' ? shipping.address.trim() : '';

    const defaultCustomerDetails: OrderCustomerDetails = {
      name: `${firstName} ${lastName}`.trim() || 'Guest Customer',
      email: '',
      address: [shippingAddress, city, postalCode].filter(Boolean).join(', ')
    };

    const customerDetails: OrderCustomerDetails = {
      ...defaultCustomerDetails,
      ...orderData.customerDetails
    };

    const newOrder: Order = {
      ...orderData,
      customerDetails,
      id: this.generateOrderId(),
      date: new Date().toISOString(),
      status: 'Pending'
    };

    const updatedOrders = [newOrder, ...this.allOrders$.value];
    this.persistOrders(updatedOrders);
    this.cartService.clearCart();

    return newOrder;
  }

  getAllOrders(): Observable<Order[]> {
    return this.allOrders$.asObservable();
  }

  getUserOrders(userId: string): Observable<Order[]> {
    return this.allOrders$.pipe(map((orders) => orders.filter((order) => order.userId === userId)));
  }

  updateOrderStatus(orderId: string, newStatus: OrderStatus): void {
    const updatedOrders = this.allOrders$.value.map((order) =>
      order.id === orderId ? { ...order, status: newStatus } : order
    );

    this.persistOrders(updatedOrders);
  }

  private persistOrders(orders: Order[]): void {
    localStorage.setItem(this.storageKey, JSON.stringify(orders));
    this.allOrders$.next(orders);
  }

  private readOrdersFromStorage(): Order[] {
    const savedOrders = localStorage.getItem(this.storageKey);

    if (!savedOrders) {
      return [];
    }

    try {
      const parsedOrders = JSON.parse(savedOrders) as Partial<Order>[];

      if (!Array.isArray(parsedOrders)) {
        return [];
      }

      return parsedOrders.map((order) => this.normalizeOrder(order));
    } catch {
      return [];
    }
  }

  private normalizeOrder(order: Partial<Order>): Order {
    const shipping = (order.shippingDetails || {}) as ShippingDetails;
    const firstName = typeof shipping.firstName === 'string' ? shipping.firstName.trim() : '';
    const lastName = typeof shipping.lastName === 'string' ? shipping.lastName.trim() : '';
    const address = typeof shipping.address === 'string' ? shipping.address.trim() : '';
    const city = typeof shipping.city === 'string' ? shipping.city.trim() : '';
    const postalCode = typeof shipping.postalCode === 'string' ? shipping.postalCode.trim() : '';

    const fallbackAddress = [address, city, postalCode].filter(Boolean).join(', ');
    const customerName = `${firstName} ${lastName}`.trim() || 'Guest Customer';

    return {
      id: order.id || this.generateOrderId(),
      userId: order.userId || '',
      date: order.date || new Date().toISOString(),
      items: Array.isArray(order.items) ? order.items : [],
      shippingDetails: shipping,
      customerDetails: {
        name: order.customerDetails?.name || customerName,
        email: order.customerDetails?.email || '',
        address: order.customerDetails?.address || fallbackAddress
      },
      paymentMethod: order.paymentMethod || 'cod',
      subtotal: Number(order.subtotal) || 0,
      shippingFee: Number(order.shippingFee) || 0,
      total: Number(order.total) || 0,
      status: this.normalizeStatus(order.status)
    };
  }

  private normalizeStatus(status: string | undefined): OrderStatus {
    switch (status) {
      case 'Pending':
      case 'Processing':
      case 'Shipped':
      case 'Delivered':
      case 'Cancelled':
        return status;
      default:
        return 'Pending';
    }
  }

  private generateOrderId(): string {
    return `ORD-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
  }
}
