import { Component, HostListener, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { CartService } from '../../shared/services/cart.service';

@Component({
  selector: 'app-shop-layout',
  templateUrl: './shop-layout.component.html',
  styleUrls: ['./shop-layout.component.css']
})
export class ShopLayoutComponent implements OnInit {
  isHeaderScrolled = false;
  cartTotalItems$: Observable<number>;

  constructor(private readonly cartService: CartService) {
    this.cartTotalItems$ = this.cartService.cartTotalItems$;
  }

  ngOnInit(): void {
    this.updateScrollState();
  }

  @HostListener('window:scroll')
  onWindowScroll(): void {
    this.updateScrollState();
  }

  private updateScrollState(): void {
    this.isHeaderScrolled = typeof window !== 'undefined' && window.scrollY > 8;
  }
}
