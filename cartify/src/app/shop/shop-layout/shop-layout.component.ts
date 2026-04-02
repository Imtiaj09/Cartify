import { Component, HostListener, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { CartService } from '../../shared/services/cart.service';
import { AuthService, User } from '../../shared/services/auth.service';

@Component({
  selector: 'app-shop-layout',
  templateUrl: './shop-layout.component.html',
  styleUrls: ['./shop-layout.component.css']
})
export class ShopLayoutComponent implements OnInit {
  isHeaderScrolled = false;
  cartTotalItems$: Observable<number>;
  currentUser$: Observable<User | null>;
  readonly defaultAvatarUrl = 'https://ui-avatars.com/api/?name=User&background=e9ecef&color=495057';

  constructor(
    private readonly cartService: CartService,
    private readonly authService: AuthService
  ) {
    this.cartTotalItems$ = this.cartService.cartTotalItems$;
    this.currentUser$ = this.authService.currentUser$;
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

  logout(): void {
    this.authService.logout();
  }
}
