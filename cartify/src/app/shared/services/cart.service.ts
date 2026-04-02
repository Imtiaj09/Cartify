import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Product } from './product.service';

export interface CartItem {
  product: Product;
  quantity: number;
  selectedColor: string;
}

@Injectable({
  providedIn: 'root'
})
export class CartService {
  private readonly storageKey = 'cartify_cart_items';
  private cartItemsSubject = new BehaviorSubject<CartItem[]>([]);

  cartItems$ = this.cartItemsSubject.asObservable();

  constructor() {
    this.loadCartFromStorage();
  }

  get cartTotalItems$(): Observable<number> {
    return this.cartItems$.pipe(
      map((items) => items.reduce((total, item) => total + item.quantity, 0))
    );
  }

  get cartSubtotal$(): Observable<number> {
    return this.cartItems$.pipe(
      map((items) =>
        items.reduce((total, item) => {
          const price = item.product.discountedPrice ?? item.product.price;
          return total + price * item.quantity;
        }, 0)
      )
    );
  }

  addToCart(product: Product, quantity: number = 1, selectedColor?: string): void {
    const color = selectedColor || (product.colors.length > 0 ? product.colors[0] : '');
    const currentItems = this.cartItemsSubject.getValue();

    const existingItemIndex = currentItems.findIndex(
      (item) => item.product.id === product.id && item.selectedColor === color
    );

    let updatedItems: CartItem[];

    if (existingItemIndex >= 0) {
      updatedItems = [...currentItems];
      updatedItems[existingItemIndex] = {
        ...updatedItems[existingItemIndex],
        quantity: updatedItems[existingItemIndex].quantity + quantity
      };
    } else {
      updatedItems = [
        ...currentItems,
        {
          product,
          quantity,
          selectedColor: color
        }
      ];
    }

    this.updateCartState(updatedItems);
  }

  increaseQuantity(productId: number, selectedColor: string): void {
    const currentItems = this.cartItemsSubject.getValue();
    const updatedItems = currentItems.map((item) => {
      if (item.product.id === productId && item.selectedColor === selectedColor) {
        return { ...item, quantity: item.quantity + 1 };
      }
      return item;
    });

    this.updateCartState(updatedItems);
  }

  decreaseQuantity(productId: number, selectedColor: string): void {
    const currentItems = this.cartItemsSubject.getValue();
    const updatedItems = currentItems.map((item) => {
      if (item.product.id === productId && item.selectedColor === selectedColor && item.quantity > 1) {
        return { ...item, quantity: item.quantity - 1 };
      }
      return item;
    });

    this.updateCartState(updatedItems);
  }

  removeItem(productId: number, selectedColor: string): void {
    const currentItems = this.cartItemsSubject.getValue();
    const updatedItems = currentItems.filter(
      (item) => !(item.product.id === productId && item.selectedColor === selectedColor)
    );

    this.updateCartState(updatedItems);
  }

  clearCart(): void {
    this.updateCartState([]);
  }

  private updateCartState(items: CartItem[]): void {
    this.cartItemsSubject.next(items);
    this.saveCartToStorage(items);
  }

  private loadCartFromStorage(): void {
    const savedCart = localStorage.getItem(this.storageKey);

    if (savedCart) {
      try {
        const parsedCart = JSON.parse(savedCart) as CartItem[];
        if (Array.isArray(parsedCart)) {
          this.cartItemsSubject.next(parsedCart);
        }
      } catch {
        this.cartItemsSubject.next([]);
      }
    }
  }

  private saveCartToStorage(items: CartItem[]): void {
    localStorage.setItem(this.storageKey, JSON.stringify(items));
  }
}
