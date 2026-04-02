import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { CartService, CartItem } from '../../shared/services/cart.service';
import { OrderService } from '../services/order.service';
import { Observable } from 'rxjs';
import { map, first } from 'rxjs/operators';
import { MockToastrService } from '../../shared/services/mock-toastr.service';
import { AuthService, User } from '../../shared/services/auth.service';

@Component({
  selector: 'app-checkout',
  templateUrl: './checkout.component.html',
  styleUrls: ['./checkout.component.css']
})
export class CheckoutComponent implements OnInit {
  checkoutForm!: FormGroup;
  cartItems$!: Observable<CartItem[]>;
  subtotal$!: Observable<number>;
  totalItems$!: Observable<number>;
  shippingFee = 150;
  total$!: Observable<number>;
  private currentUser!: User;

  constructor(
    private readonly fb: FormBuilder,
    private readonly cartService: CartService,
    private readonly orderService: OrderService,
    private readonly router: Router,
    private readonly toastr: MockToastrService,
    private readonly authService: AuthService
  ) {}

  ngOnInit(): void {
    this.checkoutForm = this.fb.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      address: ['', Validators.required],
      city: ['', Validators.required],
      postalCode: ['', Validators.required],
      phone: ['', Validators.required],
      paymentMethod: ['cod', Validators.required]
    });

    this.cartItems$ = this.cartService.cartItems$;
    this.subtotal$ = this.cartService.cartSubtotal$;
    this.totalItems$ = this.cartService.cartTotalItems$;
    this.total$ = this.subtotal$.pipe(map(subtotal => subtotal + this.shippingFee));

    this.authService.currentUser$.subscribe(user => {
      if (user) {
        this.currentUser = user;
        this.checkoutForm.patchValue({
          firstName: user.firstName,
          lastName: user.lastName,
        });
      }
    });
  }

  onSubmit(): void {
    if (this.checkoutForm.invalid) {
      this.toastr.error('Please fill out all required fields.', 'Validation Error');
      return;
    }

    this.cartItems$.pipe(first()).subscribe(items => {
      this.subtotal$.pipe(first()).subscribe(subtotal => {
        const total = subtotal + this.shippingFee;

        const orderData = {
          userId: this.currentUser.id,
          items: items,
          shippingDetails: this.checkoutForm.value,
          customerDetails: {
            name: `${this.checkoutForm.value.firstName} ${this.checkoutForm.value.lastName}`.trim(),
            email: this.currentUser.email || '',
            address: `${this.checkoutForm.value.address}, ${this.checkoutForm.value.city}, ${this.checkoutForm.value.postalCode}`
          },
          paymentMethod: this.checkoutForm.value.paymentMethod,
          subtotal: subtotal,
          shippingFee: this.shippingFee,
          total: total,
        };

        const order = this.orderService.placeOrder(orderData);
        this.toastr.success('Your order has been placed successfully!', 'Order Placed');
        this.router.navigate(['/shop/order-success', order.id]);
      });
    });
  }
}
