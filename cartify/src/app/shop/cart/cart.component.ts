import { Component, OnInit } from '@angular/core';
import { CartItem, CartService } from '../../shared/services/cart.service';

@Component({
  selector: 'app-cart',
  templateUrl: './cart.component.html',
  styleUrls: ['./cart.component.css']
})
export class CartComponent implements OnInit {
  readonly shippingFee = 150;
  readonly minQuantity = 1;
  readonly quantityStep = 1;
  readonly paymentMethods: string[] = ['Visa', 'Mastercard'];

  cartItems: CartItem[] = [];
  promoCode = '';
  appliedPromoCode = '';
  promoFeedback = '';
  promoFeedbackType: 'success' | 'error' | '' = '';
  cartSubtotal = 0;

  constructor(private readonly cartService: CartService) {}

  ngOnInit(): void {
    this.cartService.cartItems$.subscribe((items) => {
      this.cartItems = items;
    });

    this.cartService.cartSubtotal$.subscribe((subtotal) => {
      this.cartSubtotal = subtotal;
    });
  }

  get promoDiscount(): number {
    if (this.appliedPromoCode === 'CARTIFY10') {
      return Math.round(this.cartSubtotal * 0.1);
    }

    if (this.appliedPromoCode === 'SAVE500' && this.cartSubtotal >= 5000) {
      return 500;
    }

    return 0;
  }

  get cartTotal(): number {
    if (this.cartItems.length === 0) {
      return 0;
    }

    return Math.max(this.cartSubtotal + this.shippingFee - this.promoDiscount, 0);
  }

  get isEmpty(): boolean {
    return this.cartItems.length === 0;
  }

  get totalUnits(): number {
    return this.cartItems.reduce((sum, item) => sum + item.quantity, 0);
  }

  increaseQuantity(productId: number, selectedColor: string): void {
    this.cartService.increaseQuantity(productId, selectedColor);
  }

  decreaseQuantity(productId: number, selectedColor: string): void {
    this.cartService.decreaseQuantity(productId, selectedColor);
  }

  removeItem(productId: number, selectedColor: string): void {
    this.cartService.removeItem(productId, selectedColor);
  }

  onPromoCodeInput(event: Event): void {
    const target = event.target as HTMLInputElement | null;

    if (!target) {
      return;
    }

    this.promoCode = target.value;
  }

  applyPromoCode(): void {
    if (this.isEmpty) {
      this.promoFeedback = 'Add items to cart before applying a promo code.';
      this.promoFeedbackType = 'error';
      this.appliedPromoCode = '';
      return;
    }

    const normalizedCode = this.promoCode.trim().toUpperCase();

    if (!normalizedCode) {
      this.promoFeedback = 'Enter a promo code.';
      this.promoFeedbackType = 'error';
      this.appliedPromoCode = '';
      return;
    }

    if (normalizedCode === 'CARTIFY10') {
      this.appliedPromoCode = normalizedCode;
      this.promoFeedback = 'Promo applied: 10% off subtotal.';
      this.promoFeedbackType = 'success';
      return;
    }

    if (normalizedCode === 'SAVE500') {
      if (this.cartSubtotal >= 5000) {
        this.appliedPromoCode = normalizedCode;
        this.promoFeedback = 'Promo applied: ৳500 off.';
        this.promoFeedbackType = 'success';
        return;
      }

      this.appliedPromoCode = '';
      this.promoFeedback = 'SAVE500 requires a minimum subtotal of ৳5,000.';
      this.promoFeedbackType = 'error';
      return;
    }

    this.appliedPromoCode = '';
    this.promoFeedback = 'Invalid promo code.';
    this.promoFeedbackType = 'error';
  }

  clearPromoCode(): void {
    this.promoCode = '';
    this.appliedPromoCode = '';
    this.promoFeedback = '';
    this.promoFeedbackType = '';
  }

  getEffectivePrice(item: CartItem): number {
    return item.product.discountedPrice ?? item.product.price;
  }

  hasDiscount(item: CartItem): boolean {
    return item.product.discountedPrice !== null && item.product.discountedPrice < item.product.price;
  }

  getLineTotal(item: CartItem): number {
    return this.getEffectivePrice(item) * item.quantity;
  }

  getOriginalLineTotal(item: CartItem): number {
    return item.product.price * item.quantity;
  }

  getColorLabel(item: CartItem): string {
    const matchedColor = item.product.colors.find((color) => color === item.selectedColor);
    return matchedColor ? matchedColor.toUpperCase() : item.selectedColor.toUpperCase();
  }

  trackByCartItem(index: number, item: CartItem): number {
    return item.product.id;
  }

  trackByText(index: number, value: string): string {
    return value;
  }
}
