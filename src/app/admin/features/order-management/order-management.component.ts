import { Component, OnInit, HostListener } from '@angular/core';

export interface Order {
  id: number;
  customerName?: string;
  productName: string;
  productImage: string;
  date: string;
  price: number;
  paymentMethod: string;
  status: 'Delivered' | 'Pending' | 'Shipped' | 'Cancelled';
}

type PaymentTerm = 'Due on Receipt' | 'Cash on Delivery' | 'bkash' | 'Nagad';
type EditableMetaSection = 'notes' | 'customer' | 'contact' | 'shipping' | 'billing' | 'market' | 'tags';

interface ManualOrderProduct {
  name: string;
  sku: string;
  image: string;
  quantity: number;
  unitPrice: number;
}

@Component({
  selector: 'app-order-management',
  templateUrl: './order-management.component.html',
  styleUrls: ['./order-management.component.css']
})
export class OrderManagementComponent implements OnInit {

  public orders: Order[] = [];
  public openDropdownId: number | null = null;

  public isAddOrderModalOpen: boolean = false;
  public isPaymentTermsMenuOpen: boolean = false;
  public selectedPaymentTerm: PaymentTerm = 'Due on Receipt';
  public readonly paymentTerms: PaymentTerm[] = ['Due on Receipt', 'Cash on Delivery', 'bkash', 'Nagad'];

  public searchProductQuery = '';
  public paymentHelperNote = '';
  public isNewCustomer = false;

  public manualProducts: ManualOrderProduct[] = [
    {
      name: 'Classic T-Shirt',
      sku: 'TS-1001',
      image: 'https://via.placeholder.com/40',
      quantity: 1,
      unitPrice: 25
    }
  ];

  public subtotal = 0;
  public discount = 0;
  public shipping = 0;
  public taxRate = 0;
  public estimatedTaxAmount = 0;
  public finalTotal = 0;

  public notes = 'No internal notes yet.';
  public customerName = 'Jane Smith';
  public customerId = 'CUS-2048';
  public contactEmail = 'jane.smith@email.com';
  public contactPhone = '+880 1712 345678';
  public shippingAddress = 'House 12, Road 7, Dhanmondi, Dhaka 1209, Bangladesh';
  public billingAddress = 'House 12, Road 7, Dhanmondi, Dhaka 1209, Bangladesh';
  public market = 'Website Store';
  public tags = 'Priority, VIP, COD';

  public isEditingMetadata: Record<EditableMetaSection, boolean> = {
    notes: false,
    customer: false,
    contact: false,
    shipping: false,
    billing: false,
    market: false,
    tags: false
  };

  private isSubtotalManuallyEdited = false;

  public newOrderId: any;
  public orderDate: string = new Date().toISOString().split('T')[0];

  constructor() { }

  ngOnInit(): void {
    const storedOrders = localStorage.getItem('admin_orders');
    if (storedOrders) {
      this.orders = JSON.parse(storedOrders);
    } else {
      this.orders = [
        { id: 89742, customerName: 'John Doe', productName: 'Classic T-Shirt', productImage: 'https://via.placeholder.com/40', date: 'Oct 26, 2023', price: 25.00, paymentMethod: 'Visa', status: 'Delivered' },
        { id: 89743, customerName: 'Jane Smith', productName: 'Running Shoes', productImage: 'https://via.placeholder.com/40', date: 'Oct 25, 2023', price: 120.50, paymentMethod: 'Mastercard', status: 'Pending' },
        { id: 89744, customerName: 'Mike Johnson', productName: 'Leather Wallet', productImage: 'https://via.placeholder.com/40', date: 'Oct 24, 2023', price: 45.00, paymentMethod: 'Visa', status: 'Shipped' },
        { id: 89745, customerName: 'Emily Davis', productName: 'Denim Jeans', productImage: 'https://via.placeholder.com/40', date: 'Oct 23, 2023', price: 89.99, paymentMethod: 'Mastercard', status: 'Cancelled' },
        { id: 89746, customerName: 'Robert Brown', productName: 'Sunglasses', productImage: 'https://via.placeholder.com/40', date: 'Oct 22, 2023', price: 75.00, paymentMethod: 'Visa', status: 'Delivered' },
      ];
      this.saveOrdersToLocalStorage();
    }
    this.resetManualOrderPricing();
  }

  private saveOrdersToLocalStorage(): void {
    localStorage.setItem('admin_orders', JSON.stringify(this.orders));
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event): void {
    const target = event.target as HTMLElement | null;
    if (!target?.closest('.status-dropdown')) {
      this.openDropdownId = null;
    }
    if (!target?.closest('.payment-terms-dropdown')) {
      this.isPaymentTermsMenuOpen = false;
    }
  }

  isStatusMenuOpen(orderId: number): boolean {
    return this.openDropdownId === orderId;
  }

  toggleStatusMenu(orderId: number, event: Event): void {
    event.stopPropagation();
    this.openDropdownId = this.openDropdownId === orderId ? null : orderId;
  }

  updateStatus(order: Order, newStatus: 'Delivered' | 'Pending' | 'Shipped' | 'Cancelled'): void {
    order.status = newStatus;
    this.openDropdownId = null;
    this.saveOrdersToLocalStorage();
  }

  openAddOrderModal(): void {
    this.resetManualOrderPricing();
    this.closeAllMetadataEditors();
    this.isAddOrderModalOpen = true;
    this.isPaymentTermsMenuOpen = false;
    this.newOrderId = Math.floor(10000 + Math.random() * 90000);
  }

  closeAddOrderModal(): void {
    this.isAddOrderModalOpen = false;
    this.isPaymentTermsMenuOpen = false;
    this.closeAllMetadataEditors();
  }

  togglePaymentTermsMenu(event: Event): void {
    event.stopPropagation();
    this.isPaymentTermsMenuOpen = !this.isPaymentTermsMenuOpen;
  }

  selectPaymentTerm(term: PaymentTerm): void {
    this.selectedPaymentTerm = term;
    this.isPaymentTermsMenuOpen = false;
  }

  @HostListener('document:keydown.escape')
  closeModalOnEscape(): void {
    if (this.isAddOrderModalOpen) {
      this.closeAddOrderModal();
    }
  }

  toggleMetadataEdit(section: EditableMetaSection, event: Event): void {
    event.stopPropagation();
    this.isEditingMetadata[section] = !this.isEditingMetadata[section];
  }

  onProductQuantityChange(): void {
    if (!this.isSubtotalManuallyEdited) {
      this.subtotal = this.calculateProductSubtotal();
    }
    this.syncTotals();
  }

  onSubtotalInputChange(): void {
    this.isSubtotalManuallyEdited = true;
    this.syncTotals();
  }

  onPricingFieldChange(): void {
    this.syncTotals();
  }

  onTaxRateChange(): void {
    this.syncTotals();
  }

  calculateFinalTotal(): number {
    const total = this.toNumber(this.subtotal) + this.toNumber(this.shipping) + this.toNumber(this.estimatedTaxAmount) - this.toNumber(this.discount);
    return Number((total < 0 ? 0 : total).toFixed(2));
  }

  calculateEstimatedTaxAmount(): number {
    const taxableAmount = this.toNumber(this.subtotal) - this.toNumber(this.discount);
    const taxAmount = taxableAmount * (this.toNumber(this.taxRate) / 100);
    return Number(taxAmount.toFixed(2));
  }

  getProductRowTotal(product: ManualOrderProduct): number {
    return Number((this.toNumber(product.quantity) * this.toNumber(product.unitPrice)).toFixed(2));
  }

  private calculateProductSubtotal(): number {
    return Number(this.manualProducts
      .reduce((sum, product) => sum + this.getProductRowTotal(product), 0)
      .toFixed(2));
  }

  private resetManualOrderPricing(): void {
    this.searchProductQuery = '';
    this.paymentHelperNote = '';
    this.isNewCustomer = false;
    this.selectedPaymentTerm = 'Due on Receipt';
    this.isSubtotalManuallyEdited = false;
    this.subtotal = this.calculateProductSubtotal();
    this.discount = 0;
    this.shipping = 0;
    this.taxRate = 0;
    this.syncTotals();
  }

  private closeAllMetadataEditors(): void {
    this.isEditingMetadata = {
      notes: false,
      customer: false,
      contact: false,
      shipping: false,
      billing: false,
      market: false,
      tags: false
    };
  }

  private toNumber(value: number | string | null | undefined): number {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  private syncTotals(): void {
    this.estimatedTaxAmount = this.calculateEstimatedTaxAmount();
    this.finalTotal = this.calculateFinalTotal();
  }

  private formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  createOrder(): void {
    const newOrder: Order = {
      id: this.newOrderId,
      customerName: this.customerName || 'Guest',
      productName: this.manualProducts.length > 0 ? this.manualProducts[0].name : 'Custom Order',
      productImage: this.manualProducts.length > 0 ? this.manualProducts[0].image : 'https://via.placeholder.com/40',
      date: this.formatDate(this.orderDate),
      price: this.finalTotal,
      paymentMethod: this.selectedPaymentTerm,
      status: 'Pending'
    };
    this.orders.unshift(newOrder);
    this.closeAddOrderModal();
    this.saveOrdersToLocalStorage();
  }
}
