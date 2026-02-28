import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';

import { ShopRoutingModule } from './shop-routing.module';
import { HomeComponent } from './home/home.component';
import { ProductCatalogComponent } from './product-catalog/product-catalog.component';
import { CartComponent } from './cart/cart.component';
import { ShopLayoutComponent } from './shop-layout/shop-layout.component';
import { LoginComponent } from './login/login.component';
import { RegisterComponent } from './register/register.component';
import { ProfileComponent } from './profile/profile.component';
import { CheckoutComponent } from './checkout/checkout.component';
import { OrderSuccessComponent } from './order-success/order-success.component';


@NgModule({
  declarations: [
    HomeComponent,
    ProductCatalogComponent,
    CartComponent,
    ShopLayoutComponent,
    LoginComponent,
    RegisterComponent,
    ProfileComponent,
    CheckoutComponent,
    OrderSuccessComponent
  ],
  imports: [
    CommonModule,
    ShopRoutingModule,
    ReactiveFormsModule
  ]
})
export class ShopModule { }
