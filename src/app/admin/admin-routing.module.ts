import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AdminLayoutComponent } from './admin-layout/admin-layout.component';
import { DashboardComponent } from './features/dashboard/dashboard.component';
import { OrderManagementComponent } from './features/order-management/order-management.component';
import { CustomersComponent } from './features/customers/customers.component';
import { CategoriesComponent } from './features/categories/categories.component';
import { TransactionsComponent } from './features/transactions/transactions.component';
import { AddProductComponent } from './features/add-product/add-product.component';
import { AdminRoleComponent } from './features/admin-role/admin-role.component';
import { ControlAuthorityComponent } from './features/control-authority/control-authority.component';
import { UsersComponent } from './features/users/users.component';

const routes: Routes = [
  {
    path: '',
    component: AdminLayoutComponent,
    children: [
      { path: 'dashboard', component: DashboardComponent },
      { path: 'orders', component: OrderManagementComponent },
      { path: 'customers', component: CustomersComponent },
      { path: 'categories', component: CategoriesComponent },
      { path: 'transactions', component: TransactionsComponent },
      { path: 'add-product', component: AddProductComponent },
      { path: 'admin-role', component: AdminRoleComponent },
      { path: 'control-authority', component: ControlAuthorityComponent },
      { path: 'users', component: UsersComponent },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AdminRoutingModule { }
