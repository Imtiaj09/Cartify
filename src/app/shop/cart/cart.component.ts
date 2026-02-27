import { Component, OnInit } from '@angular/core';

type ProductBadge = 'Sale' | 'Hot' | null;

interface CatalogProduct {
  id: number;
  name: string;
  description: string;
  price: number;
  discountedPrice: number | null;
  category: string;
  tags: string[];
  colors: string[];
  rating: number;
  reviewCount: number;
  badge: ProductBadge;
  createdAt: string;
  images: string[];
}

interface CartItem {
  product: CatalogProduct;
  quantity: number;
  selectedColor: string;
}

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

  private readonly storageKey = 'cartify_cart_items';

  ngOnInit(): void {
    this.loadCartFromStorage();
  }

  get cartSubtotal(): number {
    return this.cartItems.reduce((sum, item) => sum + this.getLineTotal(item), 0);
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

  increaseQuantity(productId: number): void {
    const item = this.cartItems.find((entry) => entry.product.id === productId);

    if (!item) {
      return;
    }

    item.quantity += this.quantityStep;
    this.saveCartToStorage();
  }

  decreaseQuantity(productId: number): void {
    const item = this.cartItems.find((entry) => entry.product.id === productId);

    if (!item || item.quantity <= this.minQuantity) {
      return;
    }

    item.quantity -= this.quantityStep;
    this.saveCartToStorage();
  }

  removeItem(productId: number): void {
    this.cartItems = this.cartItems.filter((item) => item.product.id !== productId);
    this.saveCartToStorage();
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

  getEffectivePrice(product: CatalogProduct): number {
    return product.discountedPrice ?? product.price;
  }

  hasDiscount(product: CatalogProduct): boolean {
    return product.discountedPrice !== null && product.discountedPrice < product.price;
  }

  getLineTotal(item: CartItem): number {
    return this.getEffectivePrice(item.product) * item.quantity;
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

  private loadCartFromStorage(): void {
    const savedCart = localStorage.getItem(this.storageKey);

    if (!savedCart) {
      this.cartItems = this.getDefaultCartItems();
      this.saveCartToStorage();
      return;
    }

    try {
      const parsedCart = JSON.parse(savedCart) as CartItem[];

      if (!Array.isArray(parsedCart)) {
        this.cartItems = this.getDefaultCartItems();
        this.saveCartToStorage();
        return;
      }

      this.cartItems = parsedCart;
    } catch {
      this.cartItems = this.getDefaultCartItems();
      this.saveCartToStorage();
    }
  }

  private saveCartToStorage(): void {
    localStorage.setItem(this.storageKey, JSON.stringify(this.cartItems));
  }

  private getDefaultCartItems(): CartItem[] {
    return [
      {
        product: {
          id: 1,
          name: 'Quantum X Smartphone',
          description: 'Flagship 5G phone with pro-grade camera and all-day battery.',
          price: 64900,
          discountedPrice: 58900,
          category: 'Electronics',
          tags: ['New Arrival', '5G'],
          colors: ['#4a4a4a', '#b2d8ff'],
          rating: 5,
          reviewCount: 182,
          badge: 'Hot',
          createdAt: '2026-02-15T08:30:00Z',
          images: [
            'https://placehold.co/900x1100/eef5ff/1f2a44?text=Quantum+X+Front',
            'https://placehold.co/900x1100/dce8fb/1f2a44?text=Quantum+X+Back'
          ]
        },
        quantity: 1,
        selectedColor: '#4a4a4a'
      },
      {
        product: {
          id: 4,
          name: 'Classic Bomber Jacket',
          description: 'Premium bomber jacket with soft inner lining for daily wear.',
          price: 5900,
          discountedPrice: 4700,
          category: 'Fashion',
          tags: ['Men', 'Winter'],
          colors: ['#4a4a4a', '#aaddbb'],
          rating: 4,
          reviewCount: 136,
          badge: 'Sale',
          createdAt: '2026-02-03T10:40:00Z',
          images: [
            'https://placehold.co/900x1100/f7f9fc/3d4348?text=Bomber+Jacket+Front',
            'https://placehold.co/900x1100/e6ebf1/3d4348?text=Bomber+Jacket+Back'
          ]
        },
        quantity: 2,
        selectedColor: '#aaddbb'
      },
      {
        product: {
          id: 9,
          name: 'Espresso Maker Pro',
          description: '19-bar pressure machine delivering cafe-level espresso at home.',
          price: 18500,
          discountedPrice: 16200,
          category: 'Home',
          tags: ['Coffee', 'Premium'],
          colors: ['#4a4a4a', '#b2d8ff'],
          rating: 5,
          reviewCount: 91,
          badge: 'Hot',
          createdAt: '2026-02-12T16:45:00Z',
          images: [
            'https://placehold.co/900x1100/f2f5f8/273240?text=Espresso+Maker+Front',
            'https://placehold.co/900x1100/e5ebf1/273240?text=Espresso+Maker+Side'
          ]
        },
        quantity: 1,
        selectedColor: '#b2d8ff'
      }
    ];
  }

}
