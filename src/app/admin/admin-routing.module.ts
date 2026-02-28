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
import { AuthGuard } from '../shared/guards/auth.guard';

const routes: Routes = [
  {
    path: '',
    component: AdminLayoutComponent,
    canActivate: [AuthGuard],
    canActivateChild: [AuthGuard],
    data: { expectedRoles: ['ADMIN'] },
    children: [
      { path: 'dashboard', component: DashboardComponent, data: { title: 'Dashboard' } },
      { path: 'orders', component: OrderManagementComponent, data: { title: 'Order Management' } },
      { path: 'customers', component: CustomersComponent, data: { title: 'Customers' } },
      { path: 'categories', component: CategoriesComponent, data: { title: 'Categories' } },
      { path: 'transactions', component: TransactionsComponent, data: { title: 'Transactions' } },
      { path: 'add-product', component: AddProductComponent, data: { title: 'Add Product' } },
      { path: 'admin-role', component: AdminRoleComponent, data: { title: 'Admin Role' } },
      { path: 'control-authority', component: ControlAuthorityComponent, data: { title: 'Control Authority' } },
      { path: 'users', component: UsersComponent, data: { title: 'Users' } },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AdminRoutingModule { }
