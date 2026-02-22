import { Component, HostListener, OnInit } from '@angular/core';

interface Order {
  id: string;
  productName: string;
  productImage: string;
  date: string;
  price: number;
  paymentMethod: string;
  status: 'Delivered' | 'Pending' | 'Shipped' | 'Cancelled';
}

@Component({
  selector: 'app-order-management',
  templateUrl: './order-management.component.html',
  styleUrls: ['./order-management.component.css']
})
export class OrderManagementComponent implements OnInit {

  orders: Order[] = [];
  openStatusOrderId: string | null = null;

  constructor() { }

  ngOnInit(): void {
    this.orders = [
      { id: '89742', productName: 'Classic T-Shirt', productImage: 'https://via.placeholder.com/40', date: 'Oct 26, 2023', price: 25.00, paymentMethod: 'Visa', status: 'Delivered' },
      { id: '89743', productName: 'Running Shoes', productImage: 'https://via.placeholder.com/40', date: 'Oct 25, 2023', price: 120.50, paymentMethod: 'Mastercard', status: 'Pending' },
      { id: '89744', productName: 'Leather Wallet', productImage: 'https://via.placeholder.com/40', date: 'Oct 24, 2023', price: 45.00, paymentMethod: 'Visa', status: 'Shipped' },
      { id: '89745', productName: 'Denim Jeans', productImage: 'https://via.placeholder.com/40', date: 'Oct 23, 2023', price: 89.99, paymentMethod: 'Mastercard', status: 'Cancelled' },
      { id: '89746', productName: 'Sunglasses', productImage: 'https://via.placeholder.com/40', date: 'Oct 22, 2023', price: 75.00, paymentMethod: 'Visa', status: 'Delivered' },
    ];
  }

  /**
   * Updates the status of a specific order.
   * @param order The order to update.
   * @param newStatus The new status to set.
   */
  updateStatus(order: Order, newStatus: 'Delivered' | 'Pending' | 'Shipped' | 'Cancelled'): void {
    order.status = newStatus;
    this.openStatusOrderId = null;
    // In a real-world application, you would call a service here to update the backend.
    // e.g., this.orderService.updateOrderStatus(order.id, newStatus).subscribe();
  }

  toggleStatusMenu(orderId: string, event: MouseEvent): void {
    event.stopPropagation();
    this.openStatusOrderId = this.openStatusOrderId === orderId ? null : orderId;
  }

  isStatusMenuOpen(orderId: string): boolean {
    return this.openStatusOrderId === orderId;
  }

  @HostListener('document:click')
  closeStatusMenu(): void {
    this.openStatusOrderId = null;
  }
}
