import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  // Redirect empty path to the admin area while admin UI is under development
  {
    path: '',
    redirectTo: 'admin',
    pathMatch: 'full'
  },
  // Lazy load the AdminModule
  {
    path: 'admin',
    loadChildren: () => import('./admin/admin.module').then(m => m.AdminModule)
  },
  // Lazy load the ShopModule
  {
    path: 'shop',
    loadChildren: () => import('./shop/shop.module').then(m => m.ShopModule)
  },
  // Optional: A wildcard route for 404 pages
  {
    path: '**',
    redirectTo: 'admin' // Or a dedicated 404 component
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
