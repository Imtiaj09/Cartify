import { Component, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { Subscription } from 'rxjs';
import { Order, OrderService, OrderStatus } from '../../../shop/services/order.service';

type OrderFilter = 'All' | OrderStatus;

@Component({
  selector: 'app-order-management',
  templateUrl: './order-management.component.html',
  styleUrls: ['./order-management.component.css'],
  encapsulation: ViewEncapsulation.None
})
export class OrderManagementComponent implements OnInit, OnDestroy {
  orders: Order[] = [];
  selectedOrder: Order | null = null;
  isInvoiceModalOpen = false;
  readonly statuses: OrderStatus[] = ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];
  readonly filters: OrderFilter[] = ['All', 'Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];
  activeFilter: OrderFilter = 'All';
  searchQuery = '';
  currentPage = 1;
  readonly itemsPerPage = 10;

  private ordersSubscription?: Subscription;

  constructor(private readonly orderService: OrderService) {}

  ngOnInit(): void {
    this.ordersSubscription = this.orderService.allOrders$.subscribe((orders) => {
      this.orders = [...orders].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      );

      if (this.currentPage > this.totalPages) {
        this.currentPage = this.totalPages;
      }

      if (!this.selectedOrder) {
        return;
      }

      const updatedSelected = this.orders.find((order) => order.id === this.selectedOrder?.id) || null;
      this.selectedOrder = updatedSelected;

      if (!updatedSelected) {
        this.closeInvoice();
      }
    });
  }

  ngOnDestroy(): void {
    this.ordersSubscription?.unsubscribe();
    document.body.classList.remove('invoice-modal-open');
  }

  setFilter(filter: OrderFilter): void {
    this.activeFilter = filter;
    this.currentPage = 1;
  }

  onSearchChange(): void {
    this.currentPage = 1;
  }

  onStatusChange(orderId: string, statusValue: string): void {
    const newStatus = this.toStatus(statusValue);

    if (!newStatus) {
      return;
    }

    this.orderService.updateOrderStatus(orderId, newStatus);
  }

  openInvoice(order: Order): void {
    this.selectedOrder = order;
    this.isInvoiceModalOpen = true;
    document.body.classList.add('invoice-modal-open');
  }

  closeInvoice(): void {
    this.isInvoiceModalOpen = false;
    this.selectedOrder = null;
    document.body.classList.remove('invoice-modal-open');
  }

  printInvoice(): void {
    window.print();
  }

  trackByOrderId(_index: number, order: Order): string {
    return order.id;
  }

  get totalOrdersCount(): number {
    return this.orders.length;
  }

  get pendingCount(): number {
    return this.orders.filter((order) => order.status === 'Pending').length;
  }

  get processingCount(): number {
    return this.orders.filter((order) => order.status === 'Processing').length;
  }

  get shippedCount(): number {
    return this.orders.filter((order) => order.status === 'Shipped').length;
  }

  get deliveredCount(): number {
    return this.orders.filter((order) => order.status === 'Delivered').length;
  }

  get cancelledCount(): number {
    return this.orders.filter((order) => order.status === 'Cancelled').length;
  }

  get filteredOrders(): Order[] {
    const query = this.searchQuery.trim().toLowerCase();

    return this.orders.filter((order) => {
      const matchesFilter = this.activeFilter === 'All' || order.status === this.activeFilter;
      const matchesQuery =
        !query ||
        order.id.toLowerCase().includes(query) ||
        order.customerDetails.name.toLowerCase().includes(query);

      return matchesFilter && matchesQuery;
    });
  }

  get paginatedOrders(): Order[] {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    const end = start + this.itemsPerPage;
    return this.filteredOrders.slice(start, end);
  }

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.filteredOrders.length / this.itemsPerPage));
  }

  previousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage -= 1;
    }
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage += 1;
    }
  }

  getFirstItemName(order: Order): string {
    return order.items[0]?.product.name || 'N/A';
  }

  getFirstItemImage(order: Order): string {
    return order.items[0]?.product.mainImage || 'https://via.placeholder.com/40';
  }

  getTotalItemCount(order: Order): number {
    return order.items.reduce((total, item) => total + item.quantity, 0);
  }

  getLineTotal(order: Order, itemIndex: number): number {
    const item = order.items[itemIndex];
    if (!item) {
      return 0;
    }

    const unitPrice = item.product.discountedPrice !== null
      ? item.product.discountedPrice
      : item.product.price;

    return unitPrice * item.quantity;
  }

  private toStatus(value: string): OrderStatus | null {
    switch (value) {
      case 'Pending':
      case 'Processing':
      case 'Shipped':
      case 'Delivered':
      case 'Cancelled':
        return value;
      default:
        return null;
    }
  }
}
