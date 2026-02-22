import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router'; // Import RouterModule
import { NgChartsModule } from 'ng2-charts';

import { AdminRoutingModule } from './admin-routing.module';
import { DashboardComponent } from './features/dashboard/dashboard.component';
import { OrderManagementComponent } from './features/order-management/order-management.component';
import { CustomersComponent } from './features/customers/customers.component';
import { CategoriesComponent } from './features/categories/categories.component';
import { TransactionsComponent } from './features/transactions/transactions.component';
import { AddProductComponent } from './features/add-product/add-product.component';
import { AdminRoleComponent } from './features/admin-role/admin-role.component';
import { ControlAuthorityComponent } from './features/control-authority/control-authority.component';
import { UsersComponent } from './features/users/users.component';
import { AdminLayoutComponent } from './admin-layout/admin-layout.component';


@NgModule({
  declarations: [
    DashboardComponent,
    OrderManagementComponent,
    CustomersComponent,
    CategoriesComponent,
    TransactionsComponent,
    AddProductComponent,
    AdminRoleComponent,
    ControlAuthorityComponent,
    UsersComponent,
    AdminLayoutComponent
  ],
  imports: [
    CommonModule,
    AdminRoutingModule,
    RouterModule, // <-- This line fixes the error
    NgChartsModule
  ]
})
export class AdminModule { }
