import { Component, HostListener, OnInit } from '@angular/core';
import html2canvas from 'html2canvas';

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
type OrderFilter = 'All' | 'Delivered' | 'Pending' | 'Cancelled';

interface ManualOrderProduct {
  name: string;
  sku: string;
  image: string;
  quantity: number;
  unitPrice: number;
}

interface CashMemoLineItem {
  productName: string;
  quantity: number;
  unitPrice: number;
  rowTotal: number;
}

interface CashMemoReport {
  order: Order;
  customerName: string;
  email: string;
  phone: string;
  shippingAddress: string;
  billingAddress: string;
  items: CashMemoLineItem[];
  subtotal: number;
  discount: number;
  shipping: number;
  tax: number;
  finalTotal: number;
  market: string;
  tags: string;
  paymentTerms: string;
  notes: string;
}

interface JsPdfDocument {
  internal: {
    pageSize: {
      getWidth: () => number;
      getHeight: () => number;
    };
  };
  addImage: (imageData: string, format: 'PNG', x: number, y: number, width: number, height: number) => void;
  addPage: () => void;
  save: (fileName: string) => void;
}

type JsPdfConstructor = new (
  orientation: 'p' | 'portrait' | 'l' | 'landscape',
  unit: 'mm' | 'pt' | 'px' | 'cm' | 'in',
  format: 'a4' | string | number[]
) => JsPdfDocument;

@Component({
  selector: 'app-order-management',
  templateUrl: './order-management.component.html',
  styleUrls: ['./order-management.component.css']
})
export class OrderManagementComponent implements OnInit {

  public orders: Order[] = [];
  public selectedOrderIds: Set<number> = new Set();
  public openDropdownId: number | null = null;
  public isEditMode = false;
  public isReportModalOpen = false;
  public reportData: CashMemoReport | null = null;
  public isReportDownloading = false;

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

  public currentPage: number = 1;
  public itemsPerPage: number = 10;
  public activeFilter: OrderFilter = 'All';

  private isSubtotalManuallyEdited = false;
  private editingOrderId: number | null = null;
  private jsPdfLoaderPromise: Promise<void> | null = null;

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

  toggleSelection(orderId: number): void {
    if (this.selectedOrderIds.has(orderId)) {
      this.selectedOrderIds.delete(orderId);
      return;
    }

    this.selectedOrderIds.add(orderId);
  }

  toggleAllSelection(): void {
    const visibleOrderIds = this.getVisibleOrders().map(order => order.id);
    if (visibleOrderIds.length === 0) {
      this.selectedOrderIds.clear();
      return;
    }

    const areAllSelected = visibleOrderIds.every(orderId => this.selectedOrderIds.has(orderId));
    if (areAllSelected) {
      visibleOrderIds.forEach(orderId => this.selectedOrderIds.delete(orderId));
      return;
    }

    visibleOrderIds.forEach(orderId => this.selectedOrderIds.add(orderId));
  }

  isSelected(orderId: number): boolean {
    return this.selectedOrderIds.has(orderId);
  }

  areAllVisibleOrdersSelected(): boolean {
    const visibleOrders = this.getVisibleOrders();
    return visibleOrders.length > 0 && visibleOrders.every(order => this.selectedOrderIds.has(order.id));
  }

  hasPartialSelection(): boolean {
    const visibleOrderIds = this.getVisibleOrders().map(order => order.id);
    if (visibleOrderIds.length === 0) {
      return false;
    }

    const selectedVisibleCount = visibleOrderIds.filter(orderId => this.selectedOrderIds.has(orderId)).length;
    return selectedVisibleCount > 0 && selectedVisibleCount < visibleOrderIds.length;
  }

  deleteSelectedOrders(): void {
    if (this.selectedOrderIds.size === 0) {
      return;
    }

    this.orders = this.orders.filter(order => !this.selectedOrderIds.has(order.id));
    this.selectedOrderIds.clear();
    this.openDropdownId = null;
    this.saveOrdersToLocalStorage();

    if (this.currentPage > this.totalPages) {
      this.currentPage = Math.max(1, this.totalPages);
    }
  }

  editSelectedOrder(): void {
    if (this.selectedOrderIds.size !== 1) {
      return;
    }

    const [selectedOrderId] = Array.from(this.selectedOrderIds);
    const orderToEdit = this.orders.find(order => order.id === selectedOrderId);
    if (!orderToEdit) {
      return;
    }

    this.resetManualOrderPricing();
    this.closeAllMetadataEditors();

    const fallbackProduct = this.manualProducts[0] ?? {
      name: 'Custom Order',
      sku: 'N/A',
      image: 'https://via.placeholder.com/40',
      quantity: 1,
      unitPrice: 0
    };

    this.manualProducts = [
      {
        ...fallbackProduct,
        name: orderToEdit.productName,
        image: orderToEdit.productImage,
        quantity: 1,
        unitPrice: this.toNumber(orderToEdit.price)
      }
    ];

    this.newOrderId = orderToEdit.id;
    this.editingOrderId = orderToEdit.id;
    this.customerName = orderToEdit.customerName || 'Guest';
    this.orderDate = this.formatDateForInput(orderToEdit.date);
    this.selectedPaymentTerm = orderToEdit.paymentMethod as PaymentTerm;

    this.subtotal = this.toNumber(orderToEdit.price);
    this.discount = 0;
    this.shipping = 0;
    this.taxRate = 0;
    this.syncTotals();

    this.isEditMode = true;
    this.isAddOrderModalOpen = true;
    this.isPaymentTermsMenuOpen = false;
    this.openDropdownId = null;
  }

  openAddOrderModal(): void {
    this.isEditMode = false;
    this.editingOrderId = null;
    this.resetManualOrderPricing();
    this.closeAllMetadataEditors();
    this.isAddOrderModalOpen = true;
    this.isPaymentTermsMenuOpen = false;
    this.newOrderId = Math.floor(10000 + Math.random() * 90000);
  }

  closeAddOrderModal(): void {
    this.isAddOrderModalOpen = false;
    this.isPaymentTermsMenuOpen = false;
    this.isEditMode = false;
    this.editingOrderId = null;
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
    if (this.isReportModalOpen) {
      this.closeReportModal();
    }

    if (this.isAddOrderModalOpen) {
      this.closeAddOrderModal();
    }
  }

  @HostListener('window:afterprint')
  onAfterPrint(): void {
    this.disablePrintMode();
  }

  viewReport(): void {
    const selectedOrder = this.getSingleSelectedOrder(true);
    if (!selectedOrder) {
      return;
    }

    this.reportData = this.buildCashMemoReport(selectedOrder);
    this.isReportModalOpen = true;
    this.openDropdownId = null;
  }

  closeReportModal(): void {
    this.isReportModalOpen = false;
    this.disablePrintMode();
  }

  printOrder(): void {
    const selectedOrder = this.getSingleSelectedOrder(true);
    if (!selectedOrder) {
      return;
    }

    this.reportData = this.buildCashMemoReport(selectedOrder);
    this.isReportModalOpen = true;

    window.setTimeout(() => {
      this.enablePrintMode();
      window.print();
    }, 100);
  }

  async downloadOrder(): Promise<void> {
    const selectedOrder = this.getSingleSelectedOrder(true);
    if (!selectedOrder) {
      return;
    }

    this.reportData = this.buildCashMemoReport(selectedOrder);
    this.isReportModalOpen = true;
    this.isReportDownloading = true;

    try {
      await this.waitForDomRender();
      const memoElement = document.getElementById('cashMemoPrintable');
      if (!memoElement) {
        alert('Cash memo content is not ready for download.');
        return;
      }

      const canvas = await html2canvas(memoElement, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff'
      });

      const imgData = canvas.toDataURL('image/png');
      const jsPdfConstructor = await this.getJsPdfConstructor();
      const pdf = new jsPdfConstructor('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 10;
      const contentWidth = pageWidth - margin * 2;
      const contentHeight = (canvas.height * contentWidth) / canvas.width;

      let remainingHeight = contentHeight;
      let yPosition = margin;

      pdf.addImage(imgData, 'PNG', margin, yPosition, contentWidth, contentHeight);
      remainingHeight -= pageHeight - margin * 2;

      while (remainingHeight > 0) {
        yPosition = remainingHeight - contentHeight + margin;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', margin, yPosition, contentWidth, contentHeight);
        remainingHeight -= pageHeight - margin * 2;
      }

      pdf.save(`cash-memo-${selectedOrder.id}.pdf`);
    } catch (error) {
      console.error('Unable to download order memo PDF', error);
      alert('Failed to generate the PDF. Please try again.');
    } finally {
      this.isReportDownloading = false;
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

  get filteredOrders(): Order[] {
    if (this.activeFilter === 'All') {
      return this.orders;
    }
    return this.orders.filter(order => order.status === this.activeFilter);
  }

  get totalPages(): number {
    return Math.ceil(this.filteredOrders.length / this.itemsPerPage) || 1;
  }

  public getPaginatedOrders(): Order[] {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    return this.filteredOrders.slice(startIndex, startIndex + this.itemsPerPage);
  }

  get paginationPages(): (number | string)[] {
    const total = this.totalPages;
    const current = this.currentPage;

    if (total <= 7) {
      return Array.from({ length: total }, (_, i) => i + 1);
    }

    const pages: (number | string)[] = [];
    pages.push(1);

    if (current > 4) {
      pages.push('...');
    }

    let start = Math.max(2, current - 1);
    let end = Math.min(total - 1, current + 1);

    if (current <= 4) {
      end = 5;
    }

    if (current >= total - 3) {
      start = total - 4;
    }

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    if (current < total - 3) {
      pages.push('...');
    }

    pages.push(total);

    return pages;
  }

  goToPage(page: number | string): void {
    if (typeof page === 'number' && page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
    }
  }

  prevPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
    }
  }

  setFilter(filter: OrderFilter): void {
    this.activeFilter = filter;
    this.currentPage = 1;
    this.selectedOrderIds.clear();
  }

  getOrderCount(status: OrderFilter): number {
    if (status === 'All') {
      return this.orders.length;
    }
    return this.orders.filter(order => order.status === status).length;
  }

  get totalOrderCount(): number {
    return this.orders.length;
  }

  get newOrderCount(): number {
    return this.orders.filter(order => order.status === 'Pending').length;
  }

  get completeOrderCount(): number {
    return this.orders.filter(order => order.status === 'Delivered').length;
  }

  get canceledOrderCount(): number {
    return this.orders.filter(order => order.status === 'Cancelled').length;
  }

  private getVisibleOrders(): Order[] {
    return this.getPaginatedOrders();
  }

  private formatDateForInput(dateStr: string): string {
    const parsedDate = new Date(dateStr);
    if (Number.isNaN(parsedDate.getTime())) {
      return new Date().toISOString().split('T')[0];
    }

    const year = parsedDate.getFullYear();
    const month = String(parsedDate.getMonth() + 1).padStart(2, '0');
    const day = String(parsedDate.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  private enablePrintMode(): void {
    document.body.classList.add('printing-cash-memo');
  }

  private disablePrintMode(): void {
    document.body.classList.remove('printing-cash-memo');
  }

  private getSingleSelectedOrder(showAlert: boolean): Order | null {
    if (this.selectedOrderIds.size !== 1) {
      if (showAlert) {
        alert('Please select exactly one order to continue.');
      }
      return null;
    }

    const [selectedOrderId] = Array.from(this.selectedOrderIds);
    const selectedOrder = this.orders.find(order => order.id === selectedOrderId) || null;

    if (!selectedOrder && showAlert) {
      alert('The selected order was not found.');
    }

    return selectedOrder;
  }

  private buildCashMemoReport(order: Order): CashMemoReport {
    const quantity = 1;
    const unitPrice = this.toNumber(order.price);
    const rowTotal = Number((quantity * unitPrice).toFixed(2));
    const subtotal = rowTotal;
    const discount = 0;
    const shipping = 0;
    const tax = 0;
    const finalTotal = Number((subtotal - discount + shipping + tax).toFixed(2));

    return {
      order,
      customerName: order.customerName || this.customerName || 'Guest',
      email: this.contactEmail || 'Not available',
      phone: this.contactPhone || 'Not available',
      shippingAddress: this.shippingAddress || 'Not available',
      billingAddress: this.billingAddress || 'Not available',
      items: [
        {
          productName: order.productName,
          quantity,
          unitPrice,
          rowTotal
        }
      ],
      subtotal,
      discount,
      shipping,
      tax,
      finalTotal,
      market: this.market || 'Not available',
      tags: this.tags || 'Not available',
      paymentTerms: order.paymentMethod || this.selectedPaymentTerm,
      notes: this.notes || 'No notes available'
    };
  }

  private waitForDomRender(): Promise<void> {
    return new Promise(resolve => window.setTimeout(() => resolve(), 120));
  }

  private async getJsPdfConstructor(): Promise<JsPdfConstructor> {
    const browserWindow = window as Window & { jspdf?: { jsPDF?: JsPdfConstructor } };
    if (browserWindow.jspdf?.jsPDF) {
      return browserWindow.jspdf.jsPDF;
    }

    if (!this.jsPdfLoaderPromise) {
      this.jsPdfLoaderPromise = new Promise<void>((resolve, reject) => {
        const existingScript = document.getElementById('cartify-jspdf-loader') as HTMLScriptElement | null;
        if (existingScript) {
          existingScript.addEventListener('load', () => resolve(), { once: true });
          existingScript.addEventListener('error', () => reject(new Error('Failed to load jsPDF library.')), { once: true });
          return;
        }

        const script = document.createElement('script');
        script.id = 'cartify-jspdf-loader';
        script.src = 'https://cdn.jsdelivr.net/npm/jspdf@2.5.1/dist/jspdf.umd.min.js';
        script.async = true;
        script.onload = () => resolve();
        script.onerror = () => reject(new Error('Failed to load jsPDF library.'));
        document.head.appendChild(script);
      });
    }

    try {
      await this.jsPdfLoaderPromise;
    } catch (error) {
      this.jsPdfLoaderPromise = null;
      throw error;
    }

    const jsPdfFromWindow = browserWindow.jspdf?.jsPDF;
    if (!jsPdfFromWindow) {
      this.jsPdfLoaderPromise = null;
      throw new Error('jsPDF is unavailable after loading.');
    }

    return jsPdfFromWindow;
  }

  createOrder(): void {
    const targetOrderId = this.isEditMode && this.editingOrderId !== null ? this.editingOrderId : this.newOrderId;
    const existingOrderIndex = this.orders.findIndex(order => order.id === targetOrderId);
    const fallbackStatus = existingOrderIndex >= 0 ? this.orders[existingOrderIndex].status : 'Pending';
    const newOrder: Order = {
      id: this.newOrderId,
      customerName: this.customerName || 'Guest',
      productName: this.manualProducts.length > 0 ? this.manualProducts[0].name : 'Custom Order',
      productImage: this.manualProducts.length > 0 ? this.manualProducts[0].image : 'https://via.placeholder.com/40',
      date: this.formatDate(this.orderDate),
      price: this.finalTotal,
      paymentMethod: this.selectedPaymentTerm,
      status: this.isEditMode ? fallbackStatus : 'Pending'
    };

    if (this.isEditMode && existingOrderIndex >= 0) {
      this.orders[existingOrderIndex] = newOrder;
      this.selectedOrderIds = new Set([newOrder.id]);
    } else {
      this.orders.unshift(newOrder);
      this.selectedOrderIds.clear();
      this.currentPage = 1;
    }

    this.closeAddOrderModal();
    this.saveOrdersToLocalStorage();
  }
}
