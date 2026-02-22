import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ShopRoutingModule } from './shop-routing.module';
import { HomeComponent } from './home/home.component';
import { ProductCatalogComponent } from './product-catalog/product-catalog.component';
import { CartComponent } from './cart/cart.component';
import { ShopLayoutComponent } from './shop-layout/shop-layout.component';


@NgModule({
  declarations: [
    HomeComponent,
    ProductCatalogComponent,
    CartComponent,
    ShopLayoutComponent
  ],
  imports: [
    CommonModule,
    ShopRoutingModule
  ]
})
export class ShopModule { }
